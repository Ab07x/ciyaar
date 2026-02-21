import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PushSubscription, Subscription, ConversionEvent } from "@/lib/models";
import { sendMulticastNotification } from "@/lib/firebase-admin";

/**
 * POST /api/push/reengagement
 * Send a targeted re-engagement push to active push subscribers who are NOT premium.
 * Admin-only — requires X-Admin-Key header.
 *
 * body: {
 *   titleEn: string,       // EN title (shown in push)
 *   bodyEn: string,        // EN body
 *   url?: string,          // deep link (default: /pricing)
 *   image?: string,        // notification image
 *   campaign?: string,     // e.g. "ramadan_2026" for tracking
 *   dryRun?: boolean,      // if true, returns count without sending
 * }
 */
export async function POST(req: NextRequest) {
    // Admin auth
    const adminKey = req.headers.get("x-admin-key");
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const {
            titleEn,
            bodyEn,
            url = "/pricing",
            image,
            campaign = "reengagement",
            dryRun = false,
        } = await req.json();

        if (!titleEn || !bodyEn) {
            return NextResponse.json({ error: "titleEn and bodyEn required" }, { status: 400 });
        }

        // Get all active push subscribers
        const allSubs = await PushSubscription
            .find({ isActive: true, fcmToken: { $exists: true, $ne: "" } })
            .select("fcmToken deviceId userId")
            .lean<{ fcmToken?: string; deviceId?: string; userId?: string }[]>();

        if (allSubs.length === 0) {
            return NextResponse.json({ message: "No active push subscribers", sent: 0 });
        }

        // Find deviceIds/userIds of PREMIUM users to exclude
        const activeNow = Date.now();
        const activeSubs = await Subscription
            .find({ status: "active", expiresAt: { $gt: activeNow } })
            .select("userId")
            .lean<{ userId?: string }[]>();

        const premiumUserIds = new Set(activeSubs.map(s => String(s.userId)).filter(Boolean));

        // Filter: only non-premium push subscribers
        const targetSubs = allSubs.filter(s => {
            if (!s.fcmToken) return false;
            if (s.userId && premiumUserIds.has(s.userId)) return false;
            return true;
        });

        if (dryRun) {
            return NextResponse.json({
                dryRun: true,
                totalSubscribers: allSubs.length,
                premiumExcluded: allSubs.length - targetSubs.length,
                willSendTo: targetSubs.length,
            });
        }

        const tokens = targetSubs.map(s => s.fcmToken!);

        let totalSent = 0;
        let totalFailed = 0;
        const failedTokens: string[] = [];

        for (let i = 0; i < tokens.length; i += 500) {
            const batch = tokens.slice(i, i + 500);
            const result = await sendMulticastNotification(
                batch,
                titleEn,
                bodyEn,
                { url },
                image,
                undefined
            );
            totalSent   += result.sent ?? 0;
            totalFailed += result.failed ?? 0;
            if (result.failedTokens) failedTokens.push(...result.failedTokens);
        }

        // Deactivate permanently invalid tokens
        if (failedTokens.length > 0) {
            await PushSubscription.updateMany(
                { fcmToken: { $in: failedTokens } },
                { isActive: false }
            );
        }

        // Track campaign event
        await ConversionEvent.create({
            eventName: "push_reengagement_sent",
            source: campaign,
            metadata: {
                campaign,
                totalSubscribers: allSubs.length,
                premiumExcluded: allSubs.length - targetSubs.length,
                sent: totalSent,
                failed: totalFailed,
            },
            date: new Date().toISOString().slice(0, 10),
            createdAt: Date.now(),
        }).catch(() => {});

        return NextResponse.json({
            sent: totalSent,
            failed: totalFailed,
            deactivated: failedTokens.length,
            campaign,
        });
    } catch (err) {
        console.error("Reengagement push error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
