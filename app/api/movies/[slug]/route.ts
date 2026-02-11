import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";
import { getCached, CACHE_TTL } from "@/lib/cache";

// Cached single movie endpoint
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const data = await getCached(
            `movie:${slug}`,
            async () => {
                await connectDB();
                return Movie.findOne({ slug }).lean();
            },
            CACHE_TTL.MOVIE_DETAIL
        );

        if (!data) {
            return NextResponse.json(
                { error: "Movie not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
                "CDN-Cache-Control": "public, max-age=600",
            },
        });
    } catch (error) {
        console.error("[API/Movie] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch movie" },
            { status: 500 }
        );
    }
}
