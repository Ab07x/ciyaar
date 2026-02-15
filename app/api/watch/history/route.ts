import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { Match, Movie, Series, UserWatchProgress } from "@/lib/models";

type WatchRow = {
    _id?: string;
    userId?: string;
    contentType?: string;
    contentId?: string;
    seriesId?: string;
    progressSeconds?: number;
    durationSeconds?: number;
    isFinished?: boolean;
    updatedAt?: number;
};

type ContentDetails = Record<string, unknown> & {
    _id?: string;
    slug?: string;
};

function splitIds(values: string[]) {
    const objectIds = values.filter((value) => mongoose.Types.ObjectId.isValid(value));
    const slugs = values.filter((value) => !mongoose.Types.ObjectId.isValid(value));
    return { objectIds, slugs };
}

function buildIdOrSlugQuery(objectIds: string[], slugs: string[]) {
    if (objectIds.length > 0 && slugs.length > 0) {
        return {
            $or: [
                { _id: { $in: objectIds } },
                { slug: { $in: slugs } },
            ],
        };
    }
    if (objectIds.length > 0) {
        return { _id: { $in: objectIds } };
    }
    if (slugs.length > 0) {
        return { slug: { $in: slugs } };
    }
    return null;
}

function buildLookupMap(items: ContentDetails[]) {
    const map = new Map<string, ContentDetails>();
    for (const item of items || []) {
        const id = String(item?._id || "");
        const slug = String(item?.slug || "");
        if (id) map.set(id, item);
        if (slug) map.set(slug, item);
    }
    return map;
}

// GET /api/watch/history?userId=...&limit=50
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = String(searchParams.get("userId") || "").trim();
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 40)));

        if (!userId) {
            return NextResponse.json([]);
        }

        const rows = await UserWatchProgress.find({
            userId,
            contentType: { $nin: ["movie_preview_session", "movie_preview"] },
        })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean<WatchRow[]>();

        const movieIds = rows
            .filter((r) => r.contentType === "movie" && r.contentId)
            .map((r) => String(r.contentId));
        const seriesIds = rows
            .filter((r) => r.contentType === "episode" && (r.seriesId || r.contentId))
            .map((r) => String(r.seriesId || r.contentId));
        const matchIds = rows
            .filter((r) => r.contentType === "match" && r.contentId)
            .map((r) => String(r.contentId));

        const { objectIds: movieObjectIds, slugs: movieSlugs } = splitIds(movieIds);
        const { objectIds: seriesObjectIds, slugs: seriesSlugs } = splitIds(seriesIds);
        const { objectIds: matchObjectIds, slugs: matchSlugs } = splitIds(matchIds);
        const movieQuery = buildIdOrSlugQuery(movieObjectIds, movieSlugs);
        const seriesQuery = buildIdOrSlugQuery(seriesObjectIds, seriesSlugs);
        const matchQuery = buildIdOrSlugQuery(matchObjectIds, matchSlugs);

        const [movies, series, matches] = await Promise.all([
            movieQuery
                ? Movie.find(movieQuery).lean()
                : [],
            seriesQuery
                ? Series.find(seriesQuery).lean()
                : [],
            matchQuery
                ? Match.find(matchQuery).lean()
                : [],
        ]);

        const movieMap = buildLookupMap(movies || []);
        const seriesMap = buildLookupMap(series || []);
        const matchMap = buildLookupMap(matches || []);

        const enriched = rows.map((row) => {
            const progressSeconds = Math.max(0, Number(row.progressSeconds || 0));
            const durationSeconds = Math.max(0, Number(row.durationSeconds || 0));
            const progressPercent =
                durationSeconds > 0 ? Math.min(100, Math.round((progressSeconds / durationSeconds) * 100)) : 0;

            let details: ContentDetails | null = null;
            if (row.contentType === "movie") {
                details = movieMap.get(String(row.contentId || "")) || null;
            } else if (row.contentType === "episode") {
                details = seriesMap.get(String(row.seriesId || row.contentId || "")) || null;
            } else if (row.contentType === "match") {
                details = matchMap.get(String(row.contentId || "")) || null;
            }

            return {
                ...row,
                progressSeconds,
                durationSeconds,
                progressPercent,
                details: details || null,
            };
        });

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("GET /api/watch/history error:", error);
        return NextResponse.json([]);
    }
}
