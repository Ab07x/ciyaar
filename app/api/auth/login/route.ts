import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Device, Subscription, User, UserSession } from "@/lib/models";
import { mergeUserIdentityData } from "@/lib/user-merge";
import {
    USER_SESSION_TTL_MS,
    createSessionToken,
    hashSessionToken,
    isValidEmail,
    normalizeEmail,
    setUserSessionCookie,
    verifyPassword,
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

        const emailLower = normalizeEmail(String(body?.email || ""));
        const password = String(body?.password || "");
        const deviceId = String(body?.deviceId || "").trim();
        const userAgent = String(body?.userAgent || request.headers.get("user-agent") || "");

        if (!isValidEmail(emailLower) || !password) {
            return NextResponse.json({ error: "Email ama password qaldan." }, { status: 400 });
        }

        const user = await User.findOne({ emailLower }).lean<Record<string, unknown> | null>();
        if (!user?._id) {
            return NextResponse.json({ error: "Email ama password qaldan." }, { status: 401 });
        }

        const passwordSalt = String(user.passwordSalt || "");
        const passwordHash = String(user.passwordHash || "");
        if (!passwordSalt || !passwordHash) {
            return NextResponse.json({ error: "Account-kan password lama dejin." }, { status: 401 });
        }

        const isPasswordValid = await verifyPassword(password, passwordSalt, passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Email ama password qaldan." }, { status: 401 });
        }

        const now = Date.now();
        const existingDevice = deviceId ? await Device.findOne({ deviceId }).lean<{ userId?: string } | null>() : null;
        const existingDeviceUserId = String(existingDevice?.userId || "");

        if (existingDeviceUserId && existingDeviceUserId !== String(user._id)) {
            await mergeUserIdentityData({
                fromUserId: existingDeviceUserId,
                toUserId: String(user._id),
            });
        }

        if (deviceId) {
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

        const token = createSessionToken();
        const tokenHash = hashSessionToken(token);
        const expiresAt = now + USER_SESSION_TTL_MS;
        await UserSession.create({
            userId: String(user._id),
            tokenHash,
            deviceId: deviceId || undefined,
            ip: readIp(request),
            userAgent,
            createdAt: now,
            lastSeenAt: now,
            expiresAt,
        });

        const subscription = await Subscription.findOne({
            userId: String(user._id),
            status: "active",
            expiresAt: { $gt: now },
        }).lean();

        const response = NextResponse.json({
            success: true,
            user: sanitizeUser(user),
            subscription: subscription || null,
            message: "Login waa sax.",
        });
        setUserSessionCookie(response, token, expiresAt);
        return response;
    } catch (error) {
        console.error("POST /api/auth/login error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
