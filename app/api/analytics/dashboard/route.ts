import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ConversionEvent, PageView } from "@/lib/models";

function toRate(numerator: number, denominator: number) {
    if (!denominator || denominator <= 0) return 0;
    return Number(((numerator / denominator) * 100).toFixed(2));
}

export async function GET() {
    try {
        await connectDB();

        const now = new Date();
        const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split("T")[0];

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStartStr = lastMonthStart.toISOString().split("T")[0];

        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthEndStr = lastMonthEnd.toISOString().split("T")[0];

        // Aggregate views for each period
        const [todayViews, yesterdayViews, weekViews, monthViews, lastMonthViews] = await Promise.all([
            PageView.aggregate([
                { $match: { date: todayStr } },
                { $group: { _id: null, total: { $sum: "$views" } } },
            ]),
            PageView.aggregate([
                { $match: { date: yesterdayStr } },
                { $group: { _id: null, total: { $sum: "$views" } } },
            ]),
            PageView.aggregate([
                { $match: { date: { $gte: weekAgoStr, $lte: todayStr } } },
                { $group: { _id: null, total: { $sum: "$views" } } },
            ]),
            PageView.aggregate([
                { $match: { date: { $gte: monthStartStr, $lte: todayStr } } },
                { $group: { _id: null, total: { $sum: "$views" } } },
            ]),
            PageView.aggregate([
                { $match: { date: { $gte: lastMonthStartStr, $lte: lastMonthEndStr } } },
                { $group: { _id: null, total: { $sum: "$views" } } },
            ]),
        ]);

        // Daily breakdown for the last 7 days
        const dailyBreakdown = await PageView.aggregate([
            { $match: { date: { $gte: weekAgoStr, $lte: todayStr } } },
            { $group: { _id: "$date", views: { $sum: "$views" } } },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", views: 1, _id: 0 } },
        ]);

        // Top page types
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

        const funnelEventNames = [
            "preview_started",
            "preview_locked",
            "paywall_shown",
            "cta_clicked",
            "purchase_started",
            "purchase_completed",
        ];

        const funnelWindowDays = 7;
        const funnelWindowStart = Date.now() - funnelWindowDays * 24 * 60 * 60 * 1000;

        const [topPageTypes, funnelCountsAgg, highIntentAgg] = await Promise.all([
            PageView.aggregate([
                { $match: { date: { $gte: thirtyDaysAgoStr } } },
                { $group: { _id: "$pageType", views: { $sum: "$views" } } },
                { $sort: { views: -1 } },
                { $limit: 10 },
                { $project: { type: "$_id", views: 1, _id: 0 } },
            ]),
            ConversionEvent.aggregate([
                {
                    $match: {
                        createdAt: { $gte: funnelWindowStart },
                        eventName: { $in: funnelEventNames },
                    },
                },
                { $group: { _id: "$eventName", count: { $sum: 1 } } },
            ]),
            ConversionEvent.aggregate([
                {
                    $match: {
                        createdAt: { $gte: funnelWindowStart },
                        eventName: { $in: ["high_intent_user", "lock_repeat_user"] },
                    },
                },
                {
                    $group: {
                        _id: {
                            $ifNull: ["$userId", { $ifNull: ["$deviceId", "$sessionId"] }],
                        },
                    },
                },
                { $count: "total" },
            ]),
        ]);

        const funnelCounts: Record<string, number> = {
            preview_started: 0,
            preview_locked: 0,
            paywall_shown: 0,
            cta_clicked: 0,
            purchase_started: 0,
            purchase_completed: 0,
        };

        funnelCountsAgg.forEach((row: { _id?: string; count?: number }) => {
            const name = String(row?._id || "");
            if (!name) return;
            funnelCounts[name] = Number(row?.count || 0);
        });

        const previewStarted = funnelCounts.preview_started || 0;
        const previewLocked = funnelCounts.preview_locked || 0;
        const ctaClicked = funnelCounts.cta_clicked || 0;
        const purchaseStarted = funnelCounts.purchase_started || 0;
        const purchaseCompleted = funnelCounts.purchase_completed || 0;

        return NextResponse.json({
            today: todayViews[0]?.total || 0,
            yesterday: yesterdayViews[0]?.total || 0,
            lastWeek: weekViews[0]?.total || 0,
            thisMonth: monthViews[0]?.total || 0,
            lastMonth: lastMonthViews[0]?.total || 0,
            dailyBreakdown,
            topPageTypes,
            conversionFunnel: {
                windowDays: funnelWindowDays,
                counts: funnelCounts,
                rates: {
                    lockRate: toRate(previewLocked, previewStarted),
                    ctaRateFromLock: toRate(ctaClicked, previewLocked),
                    startRateFromCta: toRate(purchaseStarted, ctaClicked),
                    completionRateFromStart: toRate(purchaseCompleted, purchaseStarted),
                    endToEndRate: toRate(purchaseCompleted, previewStarted),
                },
                highIntentUsers: Number(highIntentAgg?.[0]?.total || 0),
            },
        });
    } catch (error) {
        console.error("GET /api/analytics/dashboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
