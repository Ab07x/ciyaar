import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Plan duration mapping (days)
const PLAN_DURATIONS: Record<string, number> = {
    match: 1,
    weekly: 7,
    monthly: 30,
    yearly: 365,
};

const PLAN_DEVICES: Record<string, number> = {
    match: 1,
    weekly: 2,
    monthly: 3,
    yearly: 5,
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { plan, deviceId } = body;

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
        const settings = await fetchQuery(api.settings.getSettings);
        const priceKey = `price${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof typeof settings;
        const baseAmount = (settings as any)[priceKey] || 0;

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

        // Save pending payment in Convex
        await fetchMutation(api.payments.createPayment, {
            deviceId,
            plan: plan as "match" | "weekly" | "monthly" | "yearly",
            amount: baseAmount,
            currency: "USD",
            orderId,
            gateway: "checkout",
            sifaloKey: key,
            sifaloToken: token,
        });

        // Build checkout URL
        const checkoutUrl = `https://pay.sifalo.com/checkout/?key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`;

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
