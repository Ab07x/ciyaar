import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import { Payment, ConversionEvent } from "@/lib/models";

// Fixed prices — must match Stripe price IDs on fanproj.shop
const FIXED_PRICES: Record<string, number> = {
    match:   1.50,
    starter: 1.50,
    weekly:  3.00,
    basic:   3.00,
    monthly: 6.00,
    pro:     6.00,
    yearly:  80.00,
    elite:   80.00,
};

// Canonical legacy plan ID used for DB / downstream
const CANONICAL_PLAN: Record<string, string> = {
    match:   "match",
    starter: "match",
    weekly:  "weekly",
    basic:   "weekly",
    monthly: "monthly",
    pro:     "monthly",
    yearly:  "yearly",
    elite:   "yearly",
};

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { plan, deviceId, offerBonusDays, offerCode } = body;

        if (!plan || !deviceId) {
            return NextResponse.json(
                { error: "plan and deviceId are required" },
                { status: 400 }
            );
        }

        if (!FIXED_PRICES[plan]) {
            return NextResponse.json(
                { error: "Invalid plan" },
                { status: 400 }
            );
        }

        const canonicalPlan = CANONICAL_PLAN[plan];
        const baseAmount = FIXED_PRICES[plan];
        const bonusDays = canonicalPlan === "monthly" ? Math.min(7, Math.max(0, Number(offerBonusDays) || 0)) : 0;
        const normalizedOfferCode = bonusDays > 0 ? String(offerCode || "MONTHLY_EXIT_7D") : "";

        const geoAdjustedAmount = baseAmount;

        // Add Sifalo Pay processing fee (1% for mobile money) so merchant gets full price
        const FEE_PERCENT = 0.01; // 1%
        const fee = Math.ceil(geoAdjustedAmount * FEE_PERCENT * 100) / 100; // round up to nearest cent
        const totalAmount = Math.round((geoAdjustedAmount + fee) * 100) / 100;

        // Generate unique order ID
        const orderNonce = crypto.randomBytes(4).toString("hex").toUpperCase();
        const orderId = `FBJ-${plan.toUpperCase()}-${Date.now()}-${orderNonce}`;

        // Get site URL for return_url
        const prodUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fanbroj.net";
        const siteUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : prodUrl;
        const returnUrl = `${siteUrl}/pay?order_id=${encodeURIComponent(orderId)}`;

        // Call Sifalo Pay API
        const username = process.env.SIFALO_PAY_USERNAME;
        const password = process.env.SIFALO_PAY_PASSWORD;

        if (!username || !password) {
            console.error("Sifalo Pay credentials not configured");
            return NextResponse.json(
                { error: "Payment system not configured" },
                { status: 500 }
            );
        }

        const authToken = Buffer.from(`${username}:${password}`).toString("base64");

        // Webhook URL for Sifalo Pay to notify us when payment is completed
        const baseWebhookUrl = process.env.NODE_ENV === "development"
            ? "http://localhost:3000/api/pay/webhook"
            : `${prodUrl}/api/pay/webhook`;
        const webhookUrl = `${baseWebhookUrl}?order_id=${encodeURIComponent(orderId)}&device_id=${encodeURIComponent(deviceId)}`;

        const sifaloRes = await fetch("https://api.sifalopay.com/gateway/", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: totalAmount.toString(),
                gateway: "checkout",
                currency: "USD",
                return_url: returnUrl,
                callback_url: webhookUrl,
                order_id: orderId,
            }),
        });

        if (!sifaloRes.ok) {
            const errText = await sifaloRes.text();
            console.error("Sifalo Pay API Error:", sifaloRes.status, errText);
            return NextResponse.json(
                { error: "Payment gateway error" },
                { status: 502 }
            );
        }

        const sifaloData = await sifaloRes.json();
        const { key, token } = sifaloData;

        if (!key || !token) {
            console.error("Sifalo Pay returned no key/token:", sifaloData);
            return NextResponse.json(
                { error: "Invalid payment gateway response" },
                { status: 502 }
            );
        }

        // Save pending payment in MongoDB
        await Payment.create({
            deviceId,
            plan: canonicalPlan,
            amount: baseAmount,
            currency: "USD",
            orderId,
            gateway: "checkout",
            sifaloKey: key,
            sifaloToken: token,
            status: "pending",
            bonusDays,
            offerCode: normalizedOfferCode || undefined,
            verifyAttempts: 0,
            lastCheckedAt: 0,
            baseAmount,
            createdAt: Date.now(),
        });

        try {
            await ConversionEvent.create({
                eventName: "purchase_started",
                deviceId,
                pageType: "pricing",
                plan: canonicalPlan,
                source: "checkout_api",
                metadata: {
                    baseAmount,
                    totalAmount,
                    bonusDays,
                    offerCode: normalizedOfferCode || undefined,
                    orderId,
                },
                date: new Date().toISOString().slice(0, 10),
                createdAt: Date.now(),
            });
        } catch (eventError) {
            console.error("Checkout conversion event write failed:", eventError);
        }

        // Build checkout URL
        const checkoutUrl = `https://pay.sifalo.com/checkout/?key=${key}&token=${token}`;

        return NextResponse.json({
            checkoutUrl,
            orderId,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to initiate checkout";
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
