import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PageView } from "@/lib/models";

export async function POST() {
    try {
        await connectDB();

        const pageTypes = ["home", "movie", "series", "match", "live", "blog", "channel", "search"];
        const records = [];
        const now = new Date();

        for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
            const date = new Date(now);
            date.setDate(date.getDate() - daysAgo);
            const dateStr = date.toISOString().split("T")[0];

            for (const pageType of pageTypes) {
                // Generate realistic view counts (weekends higher, recent days higher)
                const dayOfWeek = date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const recencyBoost = Math.max(1, (30 - daysAgo) / 10);
                const baseViews = pageType === "home" ? 500 : pageType === "movie" ? 300 : pageType === "match" ? 250 : 100;
                const views = Math.floor(
                    baseViews * recencyBoost * (isWeekend ? 1.5 : 1) * (0.5 + Math.random())
                );

                records.push({
                    date: dateStr,
                    pageType,
                    views,
                    uniqueViews: Math.floor(views * 0.6),
                });
            }
        }

        // Use bulkWrite to upsert (avoid duplicates if seeded multiple times)
        const ops = records.map((r) => ({
            updateOne: {
                filter: { date: r.date, pageType: r.pageType, pageId: { $exists: false } },
                update: { $set: r },
                upsert: true,
            },
        }));

        await PageView.bulkWrite(ops);

        return NextResponse.json({ success: true, seeded: records.length });
    } catch (error) {
        console.error("POST /api/analytics/seed error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
