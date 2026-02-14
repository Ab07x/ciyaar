import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Settings, UserWatchProgress } from "@/lib/models";

const DEFAULT_DAILY_LIMIT = 2;

function getUtcDayBounds(nowMs: number) {
    const date = new Date(nowMs);
    const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
    const end = start + 24 * 60 * 60 * 1000;
    const dateKey = new Date(start).toISOString().slice(0, 10);
    return { start, end, dateKey };
}

async function getDailyLimit() {
    const settings = await Settings.findOne().lean() as { freeMoviesPerDay?: number } | null;
    const configured = Number(settings?.freeMoviesPerDay || 0);
    return configured > 0 ? configured : DEFAULT_DAILY_LIMIT;
}

async function getTodayPreviewStats(userId: string, start: number, end: number) {
    const rows = await UserWatchProgress.find({
        userId,
        contentType: "movie_preview",
        updatedAt: { $gte: start, $lt: end },
    })
        .select("contentId updatedAt")
        .lean() as Array<{ contentId?: string }>;

    const watchedMovieIds = Array.from(new Set(rows.map((row) => row.contentId).filter(Boolean))) as string[];
    return watchedMovieIds;
}

// GET /api/movies/free-limit?userId=xxx&movieId=slug
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const movieId = searchParams.get("movieId");

        if (!userId) {
            return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        const now = Date.now();
        const { start, end, dateKey } = getUtcDayBounds(now);
        const dailyLimit = await getDailyLimit();
        const watchedMovieIds = await getTodayPreviewStats(userId, start, end);

        const used = watchedMovieIds.length;
        const alreadyWatched = movieId ? watchedMovieIds.includes(movieId) : false;
        const allowed = alreadyWatched || used < dailyLimit;
        const remaining = Math.max(0, dailyLimit - used);

        return NextResponse.json({
            allowed,
            alreadyWatched,
            used,
            remaining,
            dailyLimit,
            dateKey,
        });
    } catch (error) {
        console.error("GET /api/movies/free-limit error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/movies/free-limit { userId, movieId }
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const userId = String(body?.userId || "");
        const movieId = String(body?.movieId || "");

        if (!userId || !movieId) {
            return NextResponse.json({ error: "userId and movieId are required" }, { status: 400 });
        }

        const now = Date.now();
        const { start, end, dateKey } = getUtcDayBounds(now);
        const dailyLimit = await getDailyLimit();
        const watchedMovieIds = await getTodayPreviewStats(userId, start, end);

        const alreadyWatched = watchedMovieIds.includes(movieId);
        const used = watchedMovieIds.length;

        if (!alreadyWatched && used >= dailyLimit) {
            return NextResponse.json({
                allowed: false,
                alreadyWatched: false,
                used,
                remaining: 0,
                dailyLimit,
                dateKey,
            });
        }

        if (!alreadyWatched) {
            await UserWatchProgress.create({
                userId,
                contentType: "movie_preview",
                contentId: movieId,
                progressSeconds: 0,
                durationSeconds: 0,
                isFinished: false,
                updatedAt: now,
            });
        } else {
            await UserWatchProgress.updateMany(
                {
                    userId,
                    contentType: "movie_preview",
                    contentId: movieId,
                    updatedAt: { $gte: start, $lt: end },
                },
                { updatedAt: now }
            );
        }

        const nextUsed = alreadyWatched ? used : used + 1;
        return NextResponse.json({
            allowed: true,
            alreadyWatched,
            used: nextUsed,
            remaining: Math.max(0, dailyLimit - nextUsed),
            dailyLimit,
            dateKey,
        });
    } catch (error) {
        console.error("POST /api/movies/free-limit error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
