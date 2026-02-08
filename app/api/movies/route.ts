import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getCached, CACHE_TTL } from "@/lib/cache";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Cached movies list endpoint - reduces Convex bandwidth
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const isPublished = searchParams.get("isPublished") !== "false";
    const limit = parseInt(searchParams.get("limit") || "100");
    const featured = searchParams.get("featured") === "true";
    const top10 = searchParams.get("top10") === "true";

    try {
        let data;

        if (featured) {
            // Get featured movies with caching
            data = await getCached(
                "movies:featured",
                () => convex.query(api.movies.getFeaturedMovies),
                CACHE_TTL.FEATURED
            );
        } else if (top10) {
            // Get top 10 movies with caching
            data = await getCached(
                "movies:top10",
                () => convex.query(api.movies.getTop10Movies),
                CACHE_TTL.TOP10
            );
        } else {
            // Get all movies with caching
            const cacheKey = `movies:list:${isPublished}:${limit}`;
            data = await getCached(
                cacheKey,
                () => convex.query(api.movies.listMovies, { isPublished, limit }),
                CACHE_TTL.MOVIES_LIST
            );
        }

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                "CDN-Cache-Control": "public, max-age=300",
            },
        });
    } catch (error) {
        console.error("[API/Movies] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch movies" },
            { status: 500 }
        );
    }
}
