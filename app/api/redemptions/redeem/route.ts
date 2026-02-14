import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { Redemption, Subscription, User, Device } from "@/lib/models";

// POST /api/redemptions/redeem — redeem a code
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { code, deviceId } = await req.json();

        if (!code || !deviceId) {
            return NextResponse.json({ error: "code and deviceId required" }, { status: 400 });
        }

        // Find the code
        const redemption = await Redemption.findOne({ code: code.toUpperCase() });
        if (!redemption) {
            return NextResponse.json({ error: "Invalid code" }, { status: 404 });
        }

        // Check if already used
        if (redemption.usedByUserId) {
            return NextResponse.json({ error: "Code already used" }, { status: 400 });
        }

        // Check if expired
        if (redemption.expiresAt && redemption.expiresAt < Date.now()) {
            return NextResponse.json({ error: "Code expired" }, { status: 400 });
        }

        // Find or create user
        let device = await Device.findOne({ deviceId });
        let user = null;

        if (device && mongoose.Types.ObjectId.isValid(device.userId)) {
            user = await User.findById(device.userId);
        }

        const now = Date.now();

        if (!user) {
            // Create new user
            user = await User.create({
                createdAt: now,
                referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                referralCount: 0,
            });

            // If there is a stale device row, re-bind it to the new user.
            if (device) {
                device.userId = user._id.toString();
                device.lastSeenAt = now;
                await device.save();
            } else {
                device = await Device.create({
                    userId: user._id.toString(),
                    deviceId,
                    lastSeenAt: now,
                });
            }
        } else if (device) {
            // Keep device-user mapping fresh for valid returning users.
            if (device.userId !== user._id.toString()) {
                device.userId = user._id.toString();
            }
            device.lastSeenAt = now;
            await device.save();
        }

        // Mark code as used
        redemption.usedByUserId = user._id.toString();
        redemption.usedAt = now;
        await redemption.save();

        // Create subscription
        const expiresAt = now + redemption.durationDays * 24 * 60 * 60 * 1000;
        const subscription = await Subscription.create({
            userId: user._id.toString(),
            plan: redemption.plan,
            expiresAt,
            maxDevices: redemption.maxDevices,
            status: "active",
            codeId: redemption._id.toString(),
            createdAt: now,
        });

        return NextResponse.json({
            success: true,
            subscription,
            plan: redemption.plan,
            durationDays: redemption.durationDays,
            expiresAt,
        });
    } catch (error) {
        console.error("POST /api/redemptions/redeem error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
