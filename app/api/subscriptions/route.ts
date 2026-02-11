import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Subscription, Redemption, User, Device } from "@/lib/models";

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
                return NextResponse.json({ active: false, subscription: null });
            }
        }

        const now = Date.now();

        // Find active subscription
        const subscription = await Subscription.findOne({
            userId: targetUserId,
            status: "active",
            expiresAt: { $gt: now },
        }).lean();

        if (subscription) {
            // Check device count
            const devices = await Device.find({ userId: targetUserId }).lean();
            return NextResponse.json({
                active: true,
                subscription,
                deviceCount: devices.length,
                maxDevices: subscription.maxDevices,
            });
        }

        // Check for expired subscriptions and mark them
        await Subscription.updateMany(
            { userId: targetUserId, status: "active", expiresAt: { $lt: now } },
            { status: "expired" }
        );

        return NextResponse.json({ active: false, subscription: null });
    } catch (error) {
        console.error("GET /api/subscriptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/subscriptions — create subscription (usually via code redemption)
export async function POST(req: NextRequest) {
    try {
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
