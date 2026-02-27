import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Device, Subscription, Payment, User } from "@/lib/models";
import { getOrCreateAutoPaymentRedemption } from "@/lib/auto-redemption";

const PLAN_DURATIONS: Record<string, number> = { match: 3, weekly: 7, monthly: 30, yearly: 365 };
const PLAN_DEVICES:   Record<string, number> = { match: 1, weekly: 2, monthly: 3,  yearly: 5  };

// Accept both new canonical names and legacy names
const PLAN_TO_LEGACY: Record<string, string> = {
    starter: "match",   match: "match",
    basic: "weekly",    weekly: "weekly",
    pro: "monthly",     monthly: "monthly",
    elite: "yearly",    yearly: "yearly",
};

export async function POST(req: NextRequest) {
    const key = req.headers.get("x-internal-key");
    if (!key || key !== process.env.INTERNAL_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const body = await req.json();
        const { customerId, deviceId, event } = body;
        const plan = PLAN_TO_LEGACY[body.plan] || body.plan;

        console.log("[internal/activate] received:", { event, plan, deviceId, customerId });

        // Cancellation
        if (event === "customer.subscription.deleted") {
            const result = await Subscription.updateMany(
                { stripeCustomerId: customerId, status: "active" },
                { status: "cancelled", cancelledAt: Date.now() }
            );
            console.log("[internal/activate] cancelled", result.modifiedCount, "subscriptions for", customerId);
            return NextResponse.json({ ok: true });
        }

        if (!plan || !deviceId) {
            return NextResponse.json({ error: "plan and deviceId required" }, { status: 400 });
        }

        // Look up device, or create one if missing
        let device = await Device.findOne({ deviceId }).lean() as Record<string, unknown> | null;
        let userId: string;

        if (device) {
            userId = String(device.userId || device._id);
        } else {
            // Device not found — look for a user session with this deviceId
            const { UserSession } = await import("@/lib/models");
            const session = await UserSession.findOne({ deviceId }).lean() as Record<string, unknown> | null;
            if (session) {
                userId = String(session.userId);
            } else {
                // Last resort: create a placeholder user + device so the subscription is not lost
                console.warn("[internal/activate] no device/session found for", deviceId, "— creating placeholder");
                const placeholderUser = await User.create({
                    phoneOrId: `stripe_${deviceId}`,
                    displayName: "Stripe Customer",
                    createdAt: Date.now(),
                });
                userId = placeholderUser._id.toString();
            }
            // Create the device record
            await Device.create({ userId, deviceId, lastSeenAt: Date.now() });
        }

        const durationDays = PLAN_DURATIONS[plan] || 30;
        const maxDevices = PLAN_DEVICES[plan] || 1;
        const orderId = `STRIPE-WEBHOOK-${customerId}-${Date.now()}`;

        const access = await getOrCreateAutoPaymentRedemption({ paymentOrderId: orderId, userId, plan, durationDays, maxDevices });

        await Subscription.create({
            userId,
            plan,
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

        console.log("[internal/activate] activated", plan, "for device", deviceId, "userId", userId, "code:", access.code);
        return NextResponse.json({ ok: true, code: access.code });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[internal/activate] error:", msg, err);
        return NextResponse.json({ error: "Failed", detail: msg }, { status: 500 });
    }
}
