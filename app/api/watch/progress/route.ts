import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserWatchProgress } from "@/lib/models";

// POST /api/watch/progress
// Body: { userId, contentType, contentId, seriesId?, progressSeconds, durationSeconds }
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        const userId = String(body?.userId || "").trim();
        const contentType = String(body?.contentType || "").trim();
        const contentId = String(body?.contentId || "").trim();
        const seriesId = body?.seriesId ? String(body.seriesId).trim() : undefined;
        const progressSeconds = Math.max(0, Number(body?.progressSeconds || 0));
        const durationSeconds = Math.max(0, Number(body?.durationSeconds || 0));

        if (!userId || !contentType || !contentId) {
            return NextResponse.json(
                { error: "userId, contentType, contentId are required" },
                { status: 400 }
            );
        }

        const isFinished =
            durationSeconds > 0 && progressSeconds >= Math.max(durationSeconds * 0.92, durationSeconds - 90);

        const now = Date.now();
        const existing = await UserWatchProgress.findOne({ userId, contentType, contentId }).lean<Record<string, unknown> | null>();

        if (!existing?._id) {
            await UserWatchProgress.create({
                userId,
                contentType,
                contentId,
                seriesId,
                progressSeconds: Math.floor(progressSeconds),
                durationSeconds: Math.floor(durationSeconds),
                isFinished,
                updatedAt: now,
            });
            return NextResponse.json({ success: true, created: true });
        }

        const mergedProgress = Math.max(Number(existing.progressSeconds || 0), Math.floor(progressSeconds));
        const mergedDuration = Math.max(Number(existing.durationSeconds || 0), Math.floor(durationSeconds));
        const mergedFinished = Boolean(existing.isFinished) || isFinished;
        const mergedSeriesId = String(existing.seriesId || seriesId || "");

        await UserWatchProgress.updateOne(
            { _id: existing._id },
            {
                $set: {
                    progressSeconds: mergedProgress,
                    durationSeconds: mergedDuration,
                    isFinished: mergedFinished,
                    updatedAt: now,
                    seriesId: mergedSeriesId || undefined,
                },
            }
        );

        return NextResponse.json({ success: true, created: false });
    } catch (error) {
        console.error("POST /api/watch/progress error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
