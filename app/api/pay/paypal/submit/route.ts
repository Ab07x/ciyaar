import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import { Settings, Payment } from "@/lib/models";
import { getRequestGeo } from "@/lib/geo-lookup";

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { plan, deviceId, paypalTxId, offerBonusDays, offerCode } = body;

        if (!plan || !deviceId || !paypalTxId) {
            return NextResponse.json(
                { error: "plan, deviceId, and paypalTxId are required" },
                { status: 400 }
            );
        }

        if (!["match", "weekly", "monthly", "yearly"].includes(plan)) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        const txId = String(paypalTxId).trim();
        if (txId.length < 6) {
            return NextResponse.json(
                { error: "Invalid PayPal Transaction ID" },
                { status: 400 }
            );
        }

        // Reject duplicate transaction IDs
        const duplicate = await Payment.findOne({ paypalTxId: txId }).lean();
        if (duplicate) {
            return NextResponse.json(
                { error: "This PayPal transaction ID has already been submitted." },
                { status: 400 }
            );
        }

        const settings = await Settings.findOne().lean<Record<string, unknown> | null>();
        const priceKey = `price${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
        const baseAmount = Number(settings?.[priceKey] || 0);

        const bonusDays = plan === "monthly" ? Math.min(7, Math.max(0, Number(offerBonusDays) || 0)) : 0;
        const normalizedOfferCode = bonusDays > 0 ? String(offerCode || "MONTHLY_EXIT_7D") : "";

        const { country, multiplier } = await getRequestGeo(request);
        const finalAmount = Math.round(baseAmount * multiplier * 100) / 100;

        const orderNonce = crypto.randomBytes(4).toString("hex").toUpperCase();
        const orderId = `FBJ-PAYPAL-${plan.toUpperCase()}-${Date.now()}-${orderNonce}`;

        await Payment.create({
            deviceId,
            plan,
            amount: finalAmount,
            currency: "USD",
            orderId,
            gateway: "paypal",
            paypalTxId: txId,
            status: "pending",
            bonusDays,
            offerCode: normalizedOfferCode || undefined,
            verifyAttempts: 0,
            lastCheckedAt: 0,
            geoCountry: country || undefined,
            geoMultiplier: multiplier,
            baseAmount,
            createdAt: Date.now(),
        });

        return NextResponse.json({ success: true, orderId });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to submit PayPal payment";
        console.error("PayPal submit error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
