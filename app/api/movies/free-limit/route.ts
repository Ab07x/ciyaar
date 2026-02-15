import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Settings, UserWatchProgress } from "@/lib/models";

const DEFAULT_DAILY_LIMIT = 2;
const LEGACY_CONTENT_TYPE = "movie_preview";
const SESSION_CONTENT_TYPE = "movie_preview_session";

interface IPreviewUsageRow {
    contentId?: string;
    sessionId?: string;
    updatedAt?: number;
}

function getUtcDayBounds(nowMs: number) {
    const date = new Date(nowMs);
    const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
    const end = start + 24 * 60 * 60 * 1000;
    const dateKey = new Date(start).toISOString().slice(0, 10);
    return { start, end, dateKey };
}

async function getDailyLimit() {
    const settings = await Settings.findOne()
        .select("freeMoviesPerDay")
        .lean<{ freeMoviesPerDay?: number }>();
    const configuredLimit = Number(settings?.freeMoviesPerDay);

    if (Number.isFinite(configuredLimit) && configuredLimit >= 1) {
        return Math.max(DEFAULT_DAILY_LIMIT, Math.floor(configuredLimit));
    }

    // Aggressive monetization policy default:
    // free users get exactly 2 premium preview sessions, 3rd is locked.
    return DEFAULT_DAILY_LIMIT;
}

async function getTodayPreviewRows(userId: string, start: number, end: number) {
    const rows = await UserWatchProgress.find({
        userId,
        contentType: { $in: [SESSION_CONTENT_TYPE, LEGACY_CONTENT_TYPE] },
        updatedAt: { $gte: start, $lt: end },
    })
        .select("contentId sessionId updatedAt")
        .lean() as IPreviewUsageRow[];
    return rows;
}

function getUsedCount(rows: IPreviewUsageRow[]) {
    const unique = new Set<string>();
    rows.forEach((row) => {
        if (row.sessionId) {
            unique.add(`session:${row.sessionId}`);
            return;
        }
        if (row.contentId) {
            // Legacy rows (before session-tracking) still count toward daily usage.
            unique.add(`legacy:${row.contentId}`);
            return;
        }
        unique.add(`legacy-time:${row.updatedAt || 0}`);
    });
    return unique.size;
}

// GET /api/movies/free-limit?userId=xxx&movieId=slug
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const sessionId = String(searchParams.get("sessionId") || "").trim();

        if (!userId) {
            return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        const now = Date.now();
        const { start, end, dateKey } = getUtcDayBounds(now);
        const dailyLimit = await getDailyLimit();
        const rows = await getTodayPreviewRows(userId, start, end);

        const used = getUsedCount(rows);
        const alreadyConsumedSession = !!sessionId && rows.some((row) => row.sessionId === sessionId);
        const allowed = used < dailyLimit || alreadyConsumedSession;
        const remaining = Math.max(0, dailyLimit - used);

        return NextResponse.json({
            allowed,
            alreadyWatched: alreadyConsumedSession,
            used,
            remaining,
            dailyLimit,
            dateKey,
            locked: !allowed,
        });
    } catch (error) {
        console.error("GET /api/movies/free-limit error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/movies/free-limit { userId, movieId, sessionId }
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const userId = String(body?.userId || "");
        const movieId = String(body?.movieId || "");
        const sessionId = String(body?.sessionId || "").trim();

        if (!userId || !movieId) {
            return NextResponse.json({ error: "userId and movieId are required" }, { status: 400 });
        }

        const now = Date.now();
        const { start, end, dateKey } = getUtcDayBounds(now);
        const dailyLimit = await getDailyLimit();
        const rows = await getTodayPreviewRows(userId, start, end);
        const used = getUsedCount(rows);
        const normalizedSessionId = sessionId || `${movieId}:${now}`;
        const alreadyConsumedSession = rows.some((row) => row.sessionId === normalizedSessionId);

        if (alreadyConsumedSession) {
            return NextResponse.json({
                allowed: true,
                alreadyWatched: true,
                used,
                remaining: Math.max(0, dailyLimit - used),
                dailyLimit,
                dateKey,
                locked: used >= dailyLimit,
            });
        }

        if (used >= dailyLimit) {
            return NextResponse.json({
                allowed: false,
                alreadyWatched: false,
                used,
                remaining: 0,
                dailyLimit,
                dateKey,
                locked: true,
            });
        }

        await UserWatchProgress.create({
            userId,
            contentType: SESSION_CONTENT_TYPE,
            contentId: movieId,
            sessionId: normalizedSessionId,
            progressSeconds: 0,
            durationSeconds: 0,
            isFinished: false,
            updatedAt: now,
            dateKey,
        });

        const nextUsed = used + 1;
        return NextResponse.json({
            allowed: true,
            alreadyWatched: false,
            used: nextUsed,
            remaining: Math.max(0, dailyLimit - nextUsed),
            dailyLimit,
            dateKey,
            locked: nextUsed >= dailyLimit,
        });
    } catch (error) {
        console.error("POST /api/movies/free-limit error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
