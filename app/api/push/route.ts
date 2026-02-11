import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PushSubscription } from "@/lib/models";
import { sendNotification, sendMulticastNotification } from "@/lib/firebase-admin";

// POST /api/push
// Two modes:
//   1. Save FCM token (when body has `token` + `deviceId`)
//   2. Send notification (when body has `title` + `body`)
//      - broadcast: true → send to ALL active subscribers
//      - fcmToken: "xxx" → send to single device (test)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        // ─── MODE 1: Save FCM Token (subscription) ───
        if (body.token && body.deviceId) {
            const { token, deviceId, userId, userAgent } = body;

            // Upsert by deviceId
            const existing = await PushSubscription.findOne({ deviceId });
            if (existing) {
                existing.fcmToken = token;
                existing.userId = userId;
                existing.userAgent = userAgent;
                existing.isActive = true;
                existing.lastUsedAt = Date.now();
                await existing.save();
                return NextResponse.json(existing);
            }

            const sub = await PushSubscription.create({
                deviceId,
                fcmToken: token,
                endpoint: token,
                keys: { p256dh: "", auth: "" },
                userId,
                userAgent,
                isActive: true,
                createdAt: Date.now(),
                lastUsedAt: Date.now(),
            });

            return NextResponse.json(sub, { status: 201 });
        }

        // ─── MODE 2: Send Notification ───
        if (body.title && body.body) {
            const { title, body: messageBody, url, image, icon, broadcast, fcmToken } = body;
            const data: Record<string, string> = {};
            if (url) data.url = url;

            // Single device test
            if (fcmToken && !broadcast) {
                const result = await sendNotification(
                    fcmToken,
                    title,
                    messageBody,
                    data,
                    image,
                    icon
                );
                return NextResponse.json({
                    sent: result.success ? 1 : 0,
                    failed: result.success ? 0 : 1,
                    ...result,
                });
            }

            // Broadcast to all active subscribers
            if (broadcast) {
                const subs = await PushSubscription.find({ isActive: true, fcmToken: { $exists: true, $ne: "" } }).lean() as any[];
                const tokens = subs.map((s: any) => s.fcmToken).filter(Boolean);

                if (tokens.length === 0) {
                    return NextResponse.json({ sent: 0, failed: 0, message: "No active subscribers" });
                }

                // Firebase can handle up to 500 tokens per batch
                let totalSent = 0;
                let totalFailed = 0;
                const failedTokens: string[] = [];

                for (let i = 0; i < tokens.length; i += 500) {
                    const batch = tokens.slice(i, i + 500);
                    const result = await sendMulticastNotification(
                        batch,
                        title,
                        messageBody,
                        data,
                        image,
                        icon
                    );
                    totalSent += result.sent || 0;
                    totalFailed += result.failed || 0;
                    if (result.failedTokens) {
                        failedTokens.push(...result.failedTokens);
                    }
                }

                // Deactivate permanently invalid tokens
                if (failedTokens.length > 0) {
                    await PushSubscription.updateMany(
                        { fcmToken: { $in: failedTokens } },
                        { isActive: false }
                    );
                    console.log(`Deactivated ${failedTokens.length} invalid push tokens`);
                }

                return NextResponse.json({
                    sent: totalSent,
                    failed: totalFailed,
                    total: tokens.length,
                    deactivated: failedTokens.length,
                });
            }

            return NextResponse.json({ error: "Must provide broadcast:true or fcmToken" }, { status: 400 });
        }

        return NextResponse.json({ error: "Invalid request: provide (token+deviceId) or (title+body)" }, { status: 400 });
    } catch (error) {
        console.error("POST /api/push error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/push — list subscriptions (for admin stats)
export async function GET() {
    try {
        await connectDB();
        const subs = await PushSubscription.find({ isActive: true }).lean();
        return NextResponse.json({ subscriptions: subs, count: subs.length });
    } catch (error) {
        console.error("GET /api/push error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/push — remove FCM token
export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { deviceId } = await req.json();

        if (!deviceId) {
            return NextResponse.json({ error: "deviceId required" }, { status: 400 });
        }

        await PushSubscription.updateMany(
            { deviceId },
            { isActive: false }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/push error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
