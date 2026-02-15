import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserMovieTrial } from "@/lib/models";

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
        const trial = await UserMovieTrial.findOne({
            userId,
            movieId,
            expiresAt: { $gt: now },
        })
            .sort({ expiresAt: -1 })
            .lean<{ expiresAt?: number; trialHours?: number; code?: string } | null>();

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
