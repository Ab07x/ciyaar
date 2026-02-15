import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { Device, Subscription, User, UserSession } from "@/lib/models";
import { mergeUserIdentityData } from "@/lib/user-merge";
import {
    USER_SESSION_TTL_MS,
    createDefaultDisplayName,
    createSalt,
    createSessionToken,
    hashPassword,
    hashSessionToken,
    isValidEmail,
    normalizeEmail,
    setUserSessionCookie,
} from "@/lib/auth";

function readIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for") || "";
    const first = forwarded.split(",")[0]?.trim();
    return first || request.headers.get("x-real-ip") || "";
}

function sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash, passwordSalt, ...safe } = user;
    void passwordHash;
    void passwordSalt;
    return safe;
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        const emailRaw = String(body?.email || "");
        const password = String(body?.password || "");
        const displayNameRaw = String(body?.displayName || "");
        const deviceId = String(body?.deviceId || "").trim();
        const userAgent = String(body?.userAgent || request.headers.get("user-agent") || "");

        const emailLower = normalizeEmail(emailRaw);
        if (!isValidEmail(emailLower)) {
            return NextResponse.json({ error: "Email sax ah geli." }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password-ku waa inuu noqdaa ugu yaraan 6 xaraf." }, { status: 400 });
        }

        const existingEmail = await User.findOne({ emailLower }).select("_id").lean<{ _id: string } | null>();
        if (existingEmail?._id) {
            return NextResponse.json({ error: "Email-kan hore ayaa loo isticmaalay. Fadlan login samee." }, { status: 409 });
        }

        const now = Date.now();
        const salt = createSalt();
        const passwordHash = await hashPassword(password, salt);
        const defaultName = createDefaultDisplayName(emailLower);
        const displayName = displayNameRaw.trim() || defaultName;

        let userDoc:
            | { _id: string; emailLower?: string | null }
            | null = null;

        let existingDeviceUserId = "";
        if (deviceId) {
            const existingDevice = await Device.findOne({ deviceId }).lean<{ userId?: string } | null>();
            existingDeviceUserId = String(existingDevice?.userId || "");
            if (existingDevice?.userId && mongoose.Types.ObjectId.isValid(existingDevice.userId)) {
                userDoc = await User.findById(existingDevice.userId).select("_id emailLower").lean<{ _id: string; emailLower?: string | null } | null>();
                if (userDoc?.emailLower && userDoc.emailLower !== emailLower) {
                    // Device already linked to another registered account: create a fresh account and re-link device.
                    userDoc = null;
                }
            }
        }

        if (userDoc?._id) {
            await User.findByIdAndUpdate(userDoc._id, {
                email: emailLower,
                emailLower,
                passwordHash,
                passwordSalt: salt,
                displayName,
                avatarUrl: `/img/icons/background.png`,
            });
        } else {
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const created = await User.create({
                email: emailLower,
                emailLower,
                passwordHash,
                passwordSalt: salt,
                displayName,
                avatarUrl: `/img/icons/background.png`,
                referralCode,
                referralCount: 0,
                referralEarnings: 0,
                isTrialUsed: false,
                createdAt: now,
            });
            userDoc = { _id: created._id.toString(), emailLower: created.emailLower };
        }

        if (deviceId) {
            if (existingDeviceUserId && existingDeviceUserId !== userDoc!._id) {
                await mergeUserIdentityData({
                    fromUserId: existingDeviceUserId,
                    toUserId: userDoc!._id,
                });
            }
            await Device.findOneAndUpdate(
                { deviceId },
                {
                    userId: userDoc!._id,
                    deviceId,
                    userAgent,
                    lastSeenAt: now,
                },
                { upsert: true, new: true }
            );
        }

        // Issue persistent session token
        const token = createSessionToken();
        const tokenHash = hashSessionToken(token);
        const expiresAt = now + USER_SESSION_TTL_MS;

        await UserSession.create({
            userId: userDoc!._id,
            tokenHash,
            deviceId: deviceId || undefined,
            ip: readIp(request),
            userAgent,
            createdAt: now,
            lastSeenAt: now,
            expiresAt,
        });

        const user = await User.findById(userDoc!._id).lean<Record<string, unknown> | null>();
        const subscription = await Subscription.findOne({
            userId: userDoc!._id,
            status: "active",
            expiresAt: { $gt: now },
        }).lean();

        const response = NextResponse.json({
            success: true,
            user: user ? sanitizeUser(user) : null,
            subscription: subscription || null,
            message: "Account waa la sameeyay, waad logged-in tahay.",
        });
        setUserSessionCookie(response, token, expiresAt);
        return response;
    } catch (error) {
        console.error("POST /api/auth/signup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
