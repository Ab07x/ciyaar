import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getCached, CACHE_TTL } from "@/lib/cache";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Cached single movie endpoint
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const data = await getCached(
            `movie:${slug}`,
            () => convex.query(api.movies.getMovieBySlug, { slug }),
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
