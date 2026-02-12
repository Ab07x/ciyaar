import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";

// GET /api/movies/tags - Get all unique tags with count
export async function GET() {
    try {
        await connectDB();

        const result = await Movie.aggregate([
            { $match: { isPublished: true, tags: { $exists: true, $ne: [] } } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        const tags = result.map((r: any) => ({
            tag: r._id,
            slug: r._id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            count: r.count,
        }));

        return NextResponse.json(tags, {
            headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
        });
    } catch (error) {
        console.error("GET /api/movies/tags error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
