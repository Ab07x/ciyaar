import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { Device, Subscription, User, UserSession } from "@/lib/models";
import { mergeUserIdentityData } from "@/lib/user-merge";
import { USER_SESSION_COOKIE, clearUserSessionCookie, hashSessionToken } from "@/lib/auth";

function sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash, passwordSalt, ...safe } = user;
    void passwordHash;
    void passwordSalt;
    return safe;
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const sessionToken = request.cookies.get(USER_SESSION_COOKIE)?.value;
        const { searchParams } = new URL(request.url);
        const deviceId = String(searchParams.get("deviceId") || "").trim();
        const userAgent = request.headers.get("user-agent") || "";

        if (!sessionToken) {
            return NextResponse.json({ authenticated: false, user: null, subscription: null });
        }

        const now = Date.now();
        const tokenHash = hashSessionToken(sessionToken);
        const session = await UserSession.findOne({
            tokenHash,
            revokedAt: { $exists: false },
            expiresAt: { $gt: now },
        }).lean<{ userId: string; expiresAt: number } | null>();

        if (!session?.userId || !mongoose.Types.ObjectId.isValid(session.userId)) {
            const res = NextResponse.json({ authenticated: false, user: null, subscription: null });
            clearUserSessionCookie(res);
            return res;
        }

        const user = await User.findById(session.userId).lean<Record<string, unknown> | null>();
        if (!user?._id) {
            const res = NextResponse.json({ authenticated: false, user: null, subscription: null });
            clearUserSessionCookie(res);
            return res;
        }

        await UserSession.updateOne(
            { tokenHash },
            { $set: { lastSeenAt: now, deviceId: deviceId || undefined, userAgent } }
        );

        if (deviceId) {
            const existingDevice = await Device.findOne({ deviceId }).lean<{ userId?: string } | null>();
            const existingDeviceUserId = String(existingDevice?.userId || "");
            const sessionUserId = String(user._id);
            if (existingDeviceUserId && existingDeviceUserId !== sessionUserId) {
                await mergeUserIdentityData({
                    fromUserId: existingDeviceUserId,
                    toUserId: sessionUserId,
                });
            }
            await Device.findOneAndUpdate(
                { deviceId },
                {
                    userId: String(user._id),
                    deviceId,
                    userAgent,
                    lastSeenAt: now,
                },
                { upsert: true, new: true }
            );
        }

        const subscription = await Subscription.findOne({
            userId: String(user._id),
            status: "active",
            expiresAt: { $gt: now },
        }).lean();

        return NextResponse.json({
            authenticated: true,
            user: sanitizeUser(user),
            subscription: subscription || null,
        });
    } catch (error) {
        console.error("GET /api/auth/session error:", error);
        return NextResponse.json({ authenticated: false, user: null, subscription: null });
    }
}
