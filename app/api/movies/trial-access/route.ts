import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserMovieTrial } from "@/lib/models";
import { buildTrialAliasSet, resolveTrialMovie } from "@/lib/trial-movie";

// GET /api/movies/trial-access?userId=...&movieId=...
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = String(searchParams.get("userId") || "").trim();
        const movieId = String(searchParams.get("movieId") || "").trim();

        if (!userId || !movieId) {
            return NextResponse.json({ active: false, expiresAt: 0, remainingSeconds: 0 });
        }

        const now = Date.now();
        const resolvedMovie = await resolveTrialMovie(movieId);
        const requestedAliases = new Set<string>(resolvedMovie.aliases);

        const activeTrials = await UserMovieTrial.find({
            userId,
            expiresAt: { $gt: now },
        })
            .sort({ expiresAt: -1 })
            .limit(50)
            .lean<Array<{ movieId?: string; movieAliases?: string[]; expiresAt?: number; trialHours?: number; code?: string }>>();

        const trial = activeTrials.find((row) => {
            const rowAliases = new Set<string>();
            buildTrialAliasSet(row.movieId || "").forEach((alias) => rowAliases.add(alias));
            if (Array.isArray(row.movieAliases)) {
                for (const alias of row.movieAliases) {
                    buildTrialAliasSet(alias).forEach((nextAlias) => rowAliases.add(nextAlias));
                }
            }
            for (const alias of rowAliases) {
                if (requestedAliases.has(alias)) return true;
            }
            return false;
        });

        const expiresAt = Number(trial?.expiresAt || 0);
        const remainingSeconds = expiresAt > now
            ? Math.max(0, Math.floor((expiresAt - now) / 1000))
            : 0;

        return NextResponse.json({
            active: remainingSeconds > 0,
            expiresAt,
            remainingSeconds,
            trialHours: Number(trial?.trialHours || 0),
            code: String(trial?.code || ""),
        });
    } catch (error) {
        console.error("GET /api/movies/trial-access error:", error);
        return NextResponse.json({ active: false, expiresAt: 0, remainingSeconds: 0 });
    }
}
