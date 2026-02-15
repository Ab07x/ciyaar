import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Subscription, Device, Redemption, Payment } from "@/lib/models";

const SUBSCRIPTION_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

function isAdminAuthenticated(req: NextRequest): boolean {
    return req.cookies.get("fanbroj_admin_session")?.value === "authenticated";
}

type LeanSubscription = {
    _id: string;
    userId: string;
    plan: "match" | "weekly" | "monthly" | "yearly";
    expiresAt: number;
    maxDevices: number;
    codeId?: string;
    createdAt?: number;
};

// GET /api/subscriptions?userId=xxx — check active subscription
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const deviceId = searchParams.get("deviceId");

        if (!userId && !deviceId) {
            return NextResponse.json({ error: "userId or deviceId required" }, { status: 400 });
        }

        let targetUserId = userId;

        // If deviceId provided, find user first
        if (deviceId && !userId) {
            const device = await Device.findOne({ deviceId }).lean();
            if (device) {
                targetUserId = device.userId;
            } else {
                return NextResponse.json({ active: false, subscription: null, devices: [], now: Date.now() });
            }
        }

        const now = Date.now();

        // Find active subscription
        const subscription = await Subscription.findOne({
            userId: targetUserId,
            status: "active",
            expiresAt: { $gt: now - SUBSCRIPTION_GRACE_PERIOD_MS },
        })
            .sort({ expiresAt: -1, createdAt: -1 })
            .lean<LeanSubscription | null>();

        if (subscription) {
            const isGracePeriod = subscription.expiresAt <= now;
            const graceEndsAt = subscription.expiresAt + SUBSCRIPTION_GRACE_PERIOD_MS;
            // Get all devices for this user
            const devices = await Device.find({ userId: targetUserId }).lean();

            let code: {
                code: string;
                source?: string;
                paymentOrderId?: string;
                usedAt?: number;
            } | null = null;

            if (subscription.codeId) {
                const redemption = await Redemption.findById(subscription.codeId)
                    .select("code source paymentOrderId usedAt")
                    .lean<{ code?: string; source?: string; paymentOrderId?: string; usedAt?: number } | null>();

                if (redemption?.code) {
                    code = {
                        code: redemption.code,
                        source: redemption.source,
                        paymentOrderId: redemption.paymentOrderId,
                        usedAt: redemption.usedAt,
                    };
                }
            }

            if (!code) {
                const lastPayment = await Payment.findOne({
                    userId: targetUserId,
                    status: "success",
                    accessCode: { $ne: null },
                })
                    .sort({ completedAt: -1, createdAt: -1 })
                    .select("accessCode orderId completedAt")
                    .lean<{ accessCode?: string; orderId?: string; completedAt?: number } | null>();

                if (lastPayment?.accessCode) {
                    code = {
                        code: lastPayment.accessCode,
                        source: "auto_payment",
                        paymentOrderId: lastPayment.orderId,
                        usedAt: lastPayment.completedAt,
                    };
                }
            }

            return NextResponse.json({
                active: true,
                subscription,
                isGracePeriod,
                graceEndsAt,
                devices,
                code,
                now,
                deviceCount: devices.length,
                maxDevices: subscription.maxDevices,
            });
        }

        // Check for expired subscriptions and mark them
        await Subscription.updateMany(
            { userId: targetUserId, status: "active", expiresAt: { $lt: now - SUBSCRIPTION_GRACE_PERIOD_MS } },
            { status: "expired" }
        );

        return NextResponse.json({ active: false, subscription: null, devices: [], now });
    } catch (error) {
        console.error("GET /api/subscriptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/subscriptions — create subscription (admin only)
export async function POST(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { userId, plan, durationDays, maxDevices, codeId, matchId } = body;

        const now = Date.now();
        const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;

        const subscription = await Subscription.create({
            userId,
            plan,
            matchId,
            expiresAt,
            maxDevices,
            status: "active",
            codeId,
            createdAt: now,
        });

        return NextResponse.json(subscription, { status: 201 });
    } catch (error) {
        console.error("POST /api/subscriptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
