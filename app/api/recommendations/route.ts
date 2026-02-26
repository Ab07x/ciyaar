import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserWatchProgress, Movie, Series } from "@/lib/models";

interface LeanProgress {
    contentId?: string;
    contentType?: string;
    progressSeconds?: number;
    durationSeconds?: number;
    isFinished?: boolean;
    updatedAt?: number;
}

interface LeanMovie {
    _id: unknown;
    slug?: string;
    title?: string;
    posterUrl?: string;
    runtime?: number;
    isPremium?: boolean;
}

interface LeanSeries {
    _id: unknown;
    slug?: string;
    title?: string;
    posterUrl?: string;
    isPremium?: boolean;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ continueWatching: [] });
    }

    await connectDB();

    // Fetch user's recent watch progress (5–95% complete, not finished)
    const progressItems = await UserWatchProgress.find({
        userId,
        isFinished: { $ne: true },
        progressSeconds: { $gt: 0 },
    })
        .sort({ updatedAt: -1 })
        .limit(12)
        .lean<LeanProgress[]>();

    if (!progressItems.length) {
        return NextResponse.json({ continueWatching: [] });
    }

    const continueWatching = [];

    for (const item of progressItems) {
        const id = item.contentId;
        if (!id) continue;

        const percent = item.durationSeconds
            ? Math.round(((item.progressSeconds ?? 0) / item.durationSeconds) * 100)
            : 0;

        // Skip if < 5% or > 92% (essentially finished)
        if (percent < 5 || percent > 92) continue;

        if (item.contentType === "movie") {
            const movie = await Movie.findById(id)
                .select("slug title posterUrl runtime isPremium")
                .lean<LeanMovie | null>();
            if (movie) {
                continueWatching.push({
                    id: String(movie._id),
                    type: "movie",
                    slug: movie.slug,
                    title: movie.title,
                    posterUrl: movie.posterUrl,
                    progressSeconds: item.progressSeconds ?? 0,
                    durationSeconds: item.durationSeconds ?? (movie.runtime ?? 90) * 60,
                    percent,
                    isPremium: movie.isPremium,
                    href: `/movies/${movie.slug}`,
                });
            }
        } else if (item.contentType === "series" || item.contentType === "episode") {
            const series = await Series.findById(id)
                .select("slug title posterUrl isPremium")
                .lean<LeanSeries | null>();
            if (series) {
                continueWatching.push({
                    id: String(series._id),
                    type: "series",
                    slug: series.slug,
                    title: series.title,
                    posterUrl: series.posterUrl,
                    progressSeconds: item.progressSeconds ?? 0,
                    durationSeconds: item.durationSeconds ?? 2700,
                    percent,
                    isPremium: series.isPremium,
                    href: `/series/${series.slug}`,
                });
            }
        }

        if (continueWatching.length >= 10) break;
    }

    return NextResponse.json(
        { continueWatching },
        { headers: { "Cache-Control": "no-store" } }
    );
}
