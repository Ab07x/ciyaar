import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import fs from "fs";
import path from "path";
import https from "https";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Download an image from URL and save to local filesystem
async function downloadImage(imageUrl: string, savePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            const file = fs.createWriteStream(savePath);
            https.get(imageUrl, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    // Follow redirect
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        https.get(redirectUrl, (res2) => {
                            res2.pipe(file);
                            file.on("finish", () => { file.close(); resolve(true); });
                        }).on("error", () => resolve(false));
                    } else {
                        resolve(false);
                    }
                    return;
                }
                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(savePath);
                    resolve(false);
                    return;
                }
                response.pipe(file);
                file.on("finish", () => { file.close(); resolve(true); });
            }).on("error", () => resolve(false));
        } catch {
            resolve(false);
        }
    });
}

// Generate SEO-friendly filename from movie slug
function slugToFilename(slug: string, type: "poster" | "backdrop"): string {
    // e.g. "ruslaan-2024" → "ruslaan-2024-af-somali-poster.jpg"
    return `${slug}-af-somali-${type}.jpg`;
}

export async function POST(request: NextRequest) {
    try {
        const { limit = 50, offset = 0 } = await request.json().catch(() => ({}));

        // Get all movies from Convex
        const movies = await convex.query(api.movies.listMovies, {
            isPublished: true,
            limit: 250,
        });

        if (!movies || movies.length === 0) {
            return NextResponse.json({ error: "No movies found" }, { status: 404 });
        }

        // Create posters directory
        const postersDir = path.join(process.cwd(), "public", "posters");
        const backdropsDir = path.join(process.cwd(), "public", "backdrops");
        fs.mkdirSync(postersDir, { recursive: true });
        fs.mkdirSync(backdropsDir, { recursive: true });

        const results: any[] = [];
        const moviesToProcess = movies.slice(offset, offset + limit);

        for (const movie of moviesToProcess) {
            const result: any = {
                id: movie._id,
                slug: movie.slug,
                title: movie.title,
                posterDownloaded: false,
                backdropDownloaded: false,
                localPosterUrl: null,
                localBackdropUrl: null,
            };

            // Download poster
            if (movie.posterUrl && movie.posterUrl.includes("image.tmdb.org")) {
                const posterFilename = slugToFilename(movie.slug, "poster");
                const posterPath = path.join(postersDir, posterFilename);

                // Skip if already downloaded
                if (fs.existsSync(posterPath)) {
                    result.posterDownloaded = true;
                    result.localPosterUrl = `/posters/${posterFilename}`;
                    result.skipped = true;
                } else {
                    // Upgrade to original quality
                    const highQualityUrl = movie.posterUrl.replace(/\/w\d+\//, "/original/");
                    const success = await downloadImage(highQualityUrl, posterPath);
                    if (success) {
                        result.posterDownloaded = true;
                        result.localPosterUrl = `/posters/${posterFilename}`;
                    }
                }
            }

            // Download backdrop
            if (movie.backdropUrl && movie.backdropUrl.includes("image.tmdb.org")) {
                const backdropFilename = slugToFilename(movie.slug, "backdrop");
                const backdropPath = path.join(backdropsDir, backdropFilename);

                if (fs.existsSync(backdropPath)) {
                    result.backdropDownloaded = true;
                    result.localBackdropUrl = `/backdrops/${backdropFilename}`;
                    result.skippedBackdrop = true;
                } else {
                    const highQualityUrl = movie.backdropUrl.replace(/\/w\d+\//, "/original/");
                    const success = await downloadImage(highQualityUrl, backdropPath);
                    if (success) {
                        result.backdropDownloaded = true;
                        result.localBackdropUrl = `/backdrops/${backdropFilename}`;
                    }
                }
            }

            // Update movie in Convex with local URL
            if (result.localPosterUrl || result.localBackdropUrl) {
                try {
                    await convex.mutation(api.movies.updateMovieImages, {
                        id: movie._id,
                        ...(result.localPosterUrl && { posterUrl: result.localPosterUrl }),
                        ...(result.localBackdropUrl && { backdropUrl: result.localBackdropUrl }),
                    });
                    result.dbUpdated = true;
                } catch (e: any) {
                    result.dbError = e.message;
                }
            }

            results.push(result);
        }

        const downloaded = results.filter(r => r.posterDownloaded).length;
        const failed = results.filter(r => !r.posterDownloaded && !r.skipped).length;

        return NextResponse.json({
            success: true,
            total: movies.length,
            processed: moviesToProcess.length,
            downloaded,
            failed,
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
