import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Series, Episode } from "@/lib/models";

// GET /api/series/[slug] — get a single series by slug with episodes
export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        await connectDB();
        const { slug } = params;

        const series = await Series.findOne({ slug }).lean();
        if (!series) {
            return NextResponse.json(null, { status: 404 });
        }

        // Also fetch episodes
        const episodes = await Episode.find({ seriesId: (series._id as string).toString() })
            .sort({ seasonNumber: 1, episodeNumber: 1 })
            .lean();

        return NextResponse.json({ ...series, episodes }, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
        });
    } catch (error) {
        console.error("GET /api/series/[slug] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
