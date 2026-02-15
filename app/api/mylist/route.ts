import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { UserMyList, Movie, Series, Match } from "@/lib/models";

type ListType = "mylist" | "favourites" | "watch_later";

function normalizeListType(value: unknown): ListType {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "favourite" || raw === "favorites" || raw === "favorite" || raw === "favourites") {
        return "favourites";
    }
    if (raw === "watchlater" || raw === "watch-later" || raw === "watch_later" || raw === "later") {
        return "watch_later";
    }
    return "mylist";
}

function listTypeFilter(listType: ListType) {
    if (listType === "mylist") {
        return {
            $or: [
                { listType: "mylist" },
                { listType: { $exists: false } },
                { listType: null },
                { listType: "" },
            ],
        };
    }
    if (listType === "favourites") {
        return {
            $or: [
                { listType: "favourites" },
                { listType: "mylist" },
                { listType: { $exists: false } },
                { listType: null },
                { listType: "" },
            ],
        };
    }
    return { listType };
}

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

function buildLookupMap(rows: Array<Record<string, unknown>>) {
    const map = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
        const id = String(row._id || "");
        const slug = String(row.slug || "");
        if (id) map.set(id, row);
        if (slug) map.set(slug, row);
    }
    return map;
}

// GET /api/mylist?userId=xxx — get all items with details
// GET /api/mylist?action=check&userId=xxx&contentType=movie&contentId=xxx — check if listed
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const action = searchParams.get("action");
        const listType = normalizeListType(searchParams.get("listType"));

        if (!userId) {
            return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        // Check if a specific item is in the list
        if (action === "check") {
            const contentType = searchParams.get("contentType");
            const contentId = searchParams.get("contentId");
            if (!contentType || !contentId) {
                return NextResponse.json({ isListed: false });
            }
            const item = await UserMyList.findOne({
                userId,
                contentType,
                contentId,
                ...listTypeFilter(listType),
            }).lean();
            return NextResponse.json({ isListed: !!item });
        }

        // Get all items in user's list
        const items = await UserMyList.find({
            userId,
            ...listTypeFilter(listType),
        })
            .sort({ addedAt: -1 })
            .lean<Array<Record<string, unknown>>>();

        const movieIds = items
            .filter((item) => String(item.contentType || "") === "movie")
            .map((item) => String(item.contentId || ""))
            .filter(Boolean);
        const seriesIds = items
            .filter((item) => String(item.contentType || "") === "series")
            .map((item) => String(item.contentId || ""))
            .filter(Boolean);
        const matchIds = items
            .filter((item) => String(item.contentType || "") === "match")
            .map((item) => String(item.contentId || ""))
            .filter(Boolean);

        const { objectIds: movieObjectIds, slugs: movieSlugs } = splitIds(movieIds);
        const { objectIds: seriesObjectIds, slugs: seriesSlugs } = splitIds(seriesIds);
        const { objectIds: matchObjectIds, slugs: matchSlugs } = splitIds(matchIds);
        const movieQuery = buildIdOrSlugQuery(movieObjectIds, movieSlugs);
        const seriesQuery = buildIdOrSlugQuery(seriesObjectIds, seriesSlugs);
        const matchQuery = buildIdOrSlugQuery(matchObjectIds, matchSlugs);

        const [movies, series, matches] = await Promise.all([
            movieQuery
                ? Movie.find(movieQuery).lean<Array<Record<string, unknown>>>()
                : [],
            seriesQuery
                ? Series.find(seriesQuery).lean<Array<Record<string, unknown>>>()
                : [],
            matchQuery
                ? Match.find(matchQuery).lean<Array<Record<string, unknown>>>()
                : [],
        ]);

        const movieMap = buildLookupMap(movies);
        const seriesMap = buildLookupMap(series);
        const matchMap = buildLookupMap(matches);

        const populated = items.map((item) => {
            const contentType = String(item.contentType || "");
            const contentId = String(item.contentId || "");
            let details: Record<string, unknown> | null = null;
            if (contentType === "movie") details = movieMap.get(contentId) || null;
            if (contentType === "series") details = seriesMap.get(contentId) || null;
            if (contentType === "match") details = matchMap.get(contentId) || null;
            return {
                ...item,
                listType: normalizeListType(item.listType),
                details,
            };
        });

        return NextResponse.json(populated);
    } catch (error) {
        console.error("GET /api/mylist error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/mylist — toggle item (add if not exists, remove if exists)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { userId, contentType, contentId, listType: rawListType } = await req.json();
        const listType = normalizeListType(rawListType);

        if (!userId || !contentType || !contentId) {
            return NextResponse.json({ error: "userId, contentType, contentId required" }, { status: 400 });
        }

        // Check if already in list
        const existing = await UserMyList.findOne({
            userId,
            contentType,
            contentId,
            ...listTypeFilter(listType),
        });

        if (existing) {
            await UserMyList.deleteOne({ _id: existing._id });
            return NextResponse.json({ action: "removed" });
        }

        await UserMyList.create({
            userId,
            contentType,
            contentId,
            listType,
            addedAt: Date.now(),
        });

        return NextResponse.json({ action: "added" });
    } catch (error) {
        console.error("POST /api/mylist error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
