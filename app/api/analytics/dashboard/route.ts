import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PageView } from "@/lib/models";

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

        const topPageTypes = await PageView.aggregate([
            { $match: { date: { $gte: thirtyDaysAgoStr } } },
            { $group: { _id: "$pageType", views: { $sum: "$views" } } },
            { $sort: { views: -1 } },
            { $limit: 10 },
            { $project: { type: "$_id", views: 1, _id: 0 } },
        ]);

        return NextResponse.json({
            today: todayViews[0]?.total || 0,
            yesterday: yesterdayViews[0]?.total || 0,
            lastWeek: weekViews[0]?.total || 0,
            thisMonth: monthViews[0]?.total || 0,
            lastMonth: lastMonthViews[0]?.total || 0,
            dailyBreakdown,
            topPageTypes,
        });
    } catch (error) {
        console.error("GET /api/analytics/dashboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
