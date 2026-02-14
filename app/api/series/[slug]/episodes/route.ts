import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Series, Episode } from "@/lib/models";

// GET /api/series/[slug]/episodes — get episodes for a series
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await connectDB();
        const { slug } = await params;

        // Find the series first to get its ID
        const series = await Series.findOne({ slug }).lean();
        if (!series) {
            return NextResponse.json([], { status: 404 });
        }

        const episodes = await Episode.find({ seriesId: (series._id as string).toString() })
            .sort({ seasonNumber: 1, episodeNumber: 1 })
            .lean();

        // Group by season to match SeriesClientPage expectation.
        const groupedEpisodes = episodes.reduce((acc: Record<number, any[]>, ep: any) => {
            const season = Number(ep?.seasonNumber) || 1;
            if (!acc[season]) acc[season] = [];
            acc[season].push(ep);
            return acc;
        }, {});

        return NextResponse.json(groupedEpisodes, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
        });
    } catch (error) {
        console.error("GET /api/series/[slug]/episodes error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
