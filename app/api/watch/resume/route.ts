import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserWatchProgress } from "@/lib/models";

// GET /api/watch/resume?userId=...&contentType=...&contentId=...
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = String(searchParams.get("userId") || "").trim();
        const contentType = String(searchParams.get("contentType") || "").trim();
        const contentId = String(searchParams.get("contentId") || "").trim();

        if (!userId || !contentType || !contentId) {
            return NextResponse.json({ position: 0 });
        }

        const row = await UserWatchProgress.findOne({ userId, contentType, contentId })
            .select("progressSeconds durationSeconds updatedAt isFinished")
            .lean<{ progressSeconds?: number; durationSeconds?: number; updatedAt?: number; isFinished?: boolean } | null>();

        return NextResponse.json({
            position: Math.max(0, Number(row?.progressSeconds || 0)),
            duration: Math.max(0, Number(row?.durationSeconds || 0)),
            updatedAt: Number(row?.updatedAt || 0),
            isFinished: Boolean(row?.isFinished),
        });
    } catch (error) {
        console.error("GET /api/watch/resume error:", error);
        return NextResponse.json({ position: 0 });
    }
}
