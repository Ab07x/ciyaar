import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";
import fs from "fs";
import path from "path";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

function slugToFilename(slug: string, type: "poster" | "backdrop"): string {
    return `${slug}-af-somali-${type}.jpg`;
}

async function downloadImage(url: string, savePath: string): Promise<boolean> {
    try {
        const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
        if (!res.ok) return false;
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 1000) return false;
        fs.writeFileSync(savePath, buffer);
        return true;
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json().catch(() => ({}));
        const limit = body.limit || 50;
        const offset = body.offset || 0;

        // Fetch ALL movies
        const movies = await Movie.find({ isPublished: true }).lean() as any[];

        if (!movies?.length) {
            return NextResponse.json({ error: "No movies" }, { status: 404 });
        }

        const postersDir = path.join(process.cwd(), "public", "posters");
        const backdropsDir = path.join(process.cwd(), "public", "backdrops");
        fs.mkdirSync(postersDir, { recursive: true });
        fs.mkdirSync(backdropsDir, { recursive: true });

        const results: any[] = [];
        const batch = movies.slice(offset, offset + limit);

        for (const movie of batch) {
            const result: any = { slug: movie.slug, tmdbId: movie.tmdbId };

            const posterFilename = slugToFilename(movie.slug, "poster");
            const posterPath = path.join(postersDir, posterFilename);
            const localPosterUrl = `/posters/${posterFilename}`;

            // Check if file already exists and is valid
            if (fs.existsSync(posterPath) && fs.statSync(posterPath).size > 1000) {
                result.posterOk = true;
                result.skipped = true;

                // Just make sure DB is updated
                if (movie.posterUrl !== localPosterUrl) {
                    await Movie.findByIdAndUpdate(movie._id, { posterUrl: localPosterUrl });
                    result.dbFixed = true;
                }
                results.push(result);
                continue;
            }

            // Get poster URL: either from existing TMDB URL in DB, or reconstruct from tmdbId
            let tmdbPosterUrl = "";

            if (movie.posterUrl && movie.posterUrl.includes("image.tmdb.org")) {
                tmdbPosterUrl = movie.posterUrl.replace(/\/w\d+\//, "/w500/");
            } else if (movie.tmdbId && TMDB_API_KEY) {
                try {
                    const tmdbRes = await fetch(
                        `https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${TMDB_API_KEY}`,
                        { signal: AbortSignal.timeout(10000) }
                    );
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        if (tmdbData.poster_path) {
                            tmdbPosterUrl = `${TMDB_IMAGE_BASE}/w500${tmdbData.poster_path}`;
                        }
                        if (tmdbData.backdrop_path) {
                            const backdropFilename = slugToFilename(movie.slug, "backdrop");
                            const backdropPath = path.join(backdropsDir, backdropFilename);
                            if (!fs.existsSync(backdropPath) || fs.statSync(backdropPath).size < 1000) {
                                const bdUrl = `${TMDB_IMAGE_BASE}/w1280${tmdbData.backdrop_path}`;
                                const bdOk = await downloadImage(bdUrl, backdropPath);
                                result.backdropOk = bdOk;
                                if (bdOk) result.localBackdrop = `/backdrops/${backdropFilename}`;
                            }
                        }
                    }
                } catch (e: any) {
                    result.tmdbError = e.message;
                }
            }

            if (tmdbPosterUrl) {
                const success = await downloadImage(tmdbPosterUrl, posterPath);
                result.posterOk = success;
                if (success) {
                    result.posterSize = fs.statSync(posterPath).size;
                    result.from = tmdbPosterUrl;

                    // Update DB
                    try {
                        await Movie.findByIdAndUpdate(movie._id, {
                            posterUrl: localPosterUrl,
                            ...(result.localBackdrop && { backdropUrl: result.localBackdrop }),
                        });
                        result.dbUpdated = true;
                    } catch (e: any) {
                        result.dbError = e.message;
                    }
                } else {
                    result.failedUrl = tmdbPosterUrl;
                }
            } else {
                result.noPosterSource = true;
            }

            results.push(result);
        }

        const ok = results.filter((r: any) => r.posterOk).length;
        const failed = results.filter((r: any) => !r.posterOk).length;

        return NextResponse.json({
            success: true,
            total: movies.length,
            processed: batch.length,
            postersOk: ok,
            postersFailed: failed,
            nextOffset: offset + limit,
            hasMore: offset + limit < movies.length,
            results,
        });
    } catch (error: any) {
        console.error("Fix images error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
