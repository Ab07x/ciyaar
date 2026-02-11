import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SearchAnalytics } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const days = parseInt(searchParams.get("days") || "7");
        const limit = parseInt(searchParams.get("limit") || "20");
        const since = Date.now() - days * 24 * 60 * 60 * 1000;

        if (action === "summary") {
            const total = await SearchAnalytics.countDocuments({ createdAt: { $gte: since } });
            const zeroResults = await SearchAnalytics.countDocuments({ createdAt: { $gte: since }, resultsCount: 0 });
            const clicked = await SearchAnalytics.countDocuments({ createdAt: { $gte: since }, clickedItem: { $ne: null } });
            const uniqueDevices = (await SearchAnalytics.distinct("deviceId", { createdAt: { $gte: since } })).length;

            return NextResponse.json({
                totalSearches: total,
                zeroResultSearches: zeroResults,
                zeroResultRate: total > 0 ? Math.round((zeroResults / total) * 100) : 0,
                clickedSearches: clicked,
                clickThroughRate: total > 0 ? Math.round((clicked / total) * 100) : 0,
                uniqueDevices,
            });
        }

        if (action === "topQueries") {
            const results = await SearchAnalytics.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: "$query",
                        count: { $sum: 1 },
                        clicks: { $sum: { $cond: [{ $ne: ["$clickedItem", null] }, 1, 0] } },
                        noResults: { $sum: { $cond: [{ $eq: ["$resultsCount", 0] }, 1, 0] } },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: limit },
                { $project: { query: "$_id", count: 1, clicks: 1, noResults: 1, _id: 0 } },
            ]);
            return NextResponse.json(results);
        }

        if (action === "zeroResults") {
            const results = await SearchAnalytics.aggregate([
                { $match: { createdAt: { $gte: since }, resultsCount: 0 } },
                { $group: { _id: "$query", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: limit },
                { $project: { query: "$_id", count: 1, _id: 0 } },
            ]);
            return NextResponse.json(results);
        }

        if (action === "recent") {
            const results = await SearchAnalytics.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
            return NextResponse.json(
                results.map((r: any) => ({
                    id: r._id,
                    query: r.query,
                    resultsCount: r.resultsCount,
                    hasResults: r.resultsCount > 0,
                    clickedItem: r.clickedItem,
                    clickedItemType: r.clickedItemType,
                    createdAt: r.createdAt,
                }))
            );
        }

        if (action === "trend") {
            const results = await SearchAnalytics.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" } },
                        },
                        searches: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
                { $project: { date: "$_id", searches: 1, _id: 0 } },
            ]);
            return NextResponse.json(results);
        }

        return NextResponse.json({ error: "action required" }, { status: 400 });
    } catch (error) {
        console.error("GET /api/search-analytics error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
