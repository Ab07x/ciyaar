import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Settings, Payment, ConversionEvent } from "@/lib/models";

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

        if (!["match", "weekly", "monthly", "yearly"].includes(plan)) {
            return NextResponse.json(
                { error: "Invalid plan" },
                { status: 400 }
            );
        }

        // Get price from settings
        const settings = await Settings.findOne().lean() as any;
        const priceKey = `price${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
        const baseAmount = settings?.[priceKey] || 0;
        const bonusDays = plan === "monthly" ? Math.min(7, Math.max(0, Number(offerBonusDays) || 0)) : 0;
        const normalizedOfferCode = bonusDays > 0 ? String(offerCode || "MONTHLY_EXIT_7D") : "";

        if (!baseAmount || baseAmount <= 0) {
            return NextResponse.json(
                { error: "Price not configured for this plan" },
                { status: 400 }
            );
        }

        // Add Sifalo Pay processing fee (1% for mobile money) so merchant gets full price
        const FEE_PERCENT = 0.01; // 1%
        const fee = Math.ceil(baseAmount * FEE_PERCENT * 100) / 100; // round up to nearest cent
        const totalAmount = Math.round((baseAmount + fee) * 100) / 100;

        // Generate unique order ID
        const orderId = `FBJ-${plan.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Get site URL for return_url (hardcoded to production domain)
        const siteUrl = process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : "https://fanbroj.net";
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
        const webhookUrl = process.env.NODE_ENV === "development"
            ? "http://localhost:3000/api/pay/webhook"
            : "https://fanbroj.net/api/pay/webhook";

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
            plan,
            amount: baseAmount,
            currency: "USD",
            orderId,
            gateway: "checkout",
            sifaloKey: key,
            sifaloToken: token,
            status: "pending",
            bonusDays,
            offerCode: normalizedOfferCode || undefined,
            createdAt: Date.now(),
        });

        try {
            await ConversionEvent.create({
                eventName: "purchase_started",
                deviceId,
                pageType: "pricing",
                plan,
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
    } catch (error: any) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to initiate checkout" },
            { status: 500 }
        );
    }
}
