import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Device, Subscription, Payment } from "@/lib/models";
import { getOrCreateAutoPaymentRedemption } from "@/lib/auto-redemption";

const PLAN_DURATIONS: Record<string, number> = { weekly: 7, monthly: 30, yearly: 365 };
const PLAN_DEVICES:   Record<string, number> = { weekly: 2, monthly: 3,  yearly: 5  };

export async function POST(req: NextRequest) {
    const key = req.headers.get("x-internal-key");
    if (!key || key !== process.env.INTERNAL_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const { customerId, plan, deviceId, event } = await req.json();

        // Cancellation
        if (event === "customer.subscription.deleted") {
            await Subscription.updateMany(
                { stripeCustomerId: customerId, status: "active" },
                { status: "cancelled", cancelledAt: Date.now() }
            );
            return NextResponse.json({ ok: true });
        }

        if (!plan || !deviceId) {
            return NextResponse.json({ error: "plan and deviceId required" }, { status: 400 });
        }

        const device = await Device.findOne({ deviceId }).lean() as Record<string, unknown> | null;
        if (!device) {
            return NextResponse.json({ error: "Device not found" }, { status: 404 });
        }

        const userId = (device.userId || device._id) as string;
        const durationDays = PLAN_DURATIONS[plan] || 30;
        const maxDevices = PLAN_DEVICES[plan] || 1;
        const orderId = `STRIPE-WEBHOOK-${customerId}-${Date.now()}`;

        const access = await getOrCreateAutoPaymentRedemption({ paymentOrderId: orderId, userId: String(userId), plan, durationDays, maxDevices });

        await Subscription.create({
            userId,
            plan,
            durationDays,
            maxDevices,
            status: "active",
            activatedAt: Date.now(),
            expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
            codeId: access.redemptionId,
            stripeCustomerId: customerId,
            createdAt: Date.now(),
        });

        await Payment.create({
            deviceId,
            plan,
            amount: 0,
            currency: "USD",
            orderId,
            gateway: "stripe_webhook",
            status: "success",
            accessCode: access.code,
            accessCodeId: access.redemptionId,
            userId,
            completedAt: Date.now(),
            createdAt: Date.now(),
        });

        console.log("[internal/activate] activated", plan, "for device", deviceId, "event:", event);
        return NextResponse.json({ ok: true, code: access.code });
    } catch (err) {
        console.error("[internal/activate] error:", err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
