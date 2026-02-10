import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import fs from "fs";
import path from "path";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Generate SEO-friendly filename from movie slug
function slugToFilename(slug: string, type: "poster" | "backdrop"): string {
    return `${slug}-af-somali-${type}.jpg`;
}

// Download image using fetch (handles redirects properly)
async function downloadImage(url: string, savePath: string): Promise<boolean> {
    try {
        const res = await fetch(url, {
            redirect: "follow",
            signal: AbortSignal.timeout(15000), // 15s timeout per image
        });
        if (!res.ok) return false;

        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 1000) return false; // Skip tiny/empty files

        fs.writeFileSync(savePath, buffer);
        return true;
    } catch (e) {
        console.error(`Download failed for ${url}:`, e);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const limit = body.limit || 50;
        const offset = body.offset || 0;

        // Get all movies from Convex
        const movies = await convex.query(api.movies.listMovies, {
            isPublished: true,
            limit: 250,
        });

        if (!movies || movies.length === 0) {
            return NextResponse.json({ error: "No movies found" }, { status: 404 });
        }

        // Create directories
        const postersDir = path.join(process.cwd(), "public", "posters");
        const backdropsDir = path.join(process.cwd(), "public", "backdrops");
        fs.mkdirSync(postersDir, { recursive: true });
        fs.mkdirSync(backdropsDir, { recursive: true });

        const results: any[] = [];
        const moviesToProcess = movies.slice(offset, offset + limit);

        for (const movie of moviesToProcess) {
            const result: any = {
                slug: movie.slug,
                title: movie.title,
                posterOk: false,
                backdropOk: false,
            };

            // Download poster if it's a TMDB URL
            if (movie.posterUrl && movie.posterUrl.includes("image.tmdb.org")) {
                const posterFilename = slugToFilename(movie.slug, "poster");
                const posterPath = path.join(postersDir, posterFilename);

                if (fs.existsSync(posterPath) && fs.statSync(posterPath).size > 1000) {
                    result.posterOk = true;
                    result.posterSkipped = true;
                } else {
                    // Use original quality
                    const highQUrl = movie.posterUrl.replace(/\/w\d+\//, "/w500/");
                    const success = await downloadImage(highQUrl, posterPath);
                    result.posterOk = success;
                    if (success) {
                        result.posterSize = fs.statSync(posterPath).size;
                    }
                }

                // Update DB with local URL
                if (result.posterOk) {
                    result.localPoster = `/posters/${posterFilename}`;
                }
            } else if (movie.posterUrl && movie.posterUrl.startsWith("/posters/")) {
                // Already local
                result.posterOk = true;
                result.alreadyLocal = true;
            }

            // Download backdrop
            if (movie.backdropUrl && movie.backdropUrl.includes("image.tmdb.org")) {
                const backdropFilename = slugToFilename(movie.slug, "backdrop");
                const backdropPath = path.join(backdropsDir, backdropFilename);

                if (fs.existsSync(backdropPath) && fs.statSync(backdropPath).size > 1000) {
                    result.backdropOk = true;
                    result.backdropSkipped = true;
                } else {
                    const highQUrl = movie.backdropUrl.replace(/\/w\d+\//, "/w780/");
                    const success = await downloadImage(highQUrl, backdropPath);
                    result.backdropOk = success;
                }

                if (result.backdropOk) {
                    result.localBackdrop = `/backdrops/${backdropFilename}`;
                }
            }

            // Update Convex with local paths
            if (result.localPoster || result.localBackdrop) {
                try {
                    await convex.mutation(api.movies.updateMovieImages, {
                        id: movie._id,
                        ...(result.localPoster && { posterUrl: result.localPoster }),
                        ...(result.localBackdrop && { backdropUrl: result.localBackdrop }),
                    });
                    result.dbUpdated = true;
                } catch (e: any) {
                    result.dbError = e.message;
                }
            }

            results.push(result);
        }

        const postersOk = results.filter(r => r.posterOk).length;
        const postersFailed = results.filter(r => !r.posterOk && !r.alreadyLocal).length;

        return NextResponse.json({
            success: true,
            total: movies.length,
            processed: moviesToProcess.length,
            postersDownloaded: postersOk,
            postersFailed,
            nextOffset: offset + limit,
            hasMore: offset + limit < movies.length,
            results,
        });
    } catch (error: any) {
        console.error("Image download batch error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process images" },
            { status: 500 }
        );
    }
}
