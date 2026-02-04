import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Download image, convert to WebP with SEO-friendly filename
async function downloadAndConvertToLocal(
    tmdbUrl: string,
    slug: string,
    type: "poster" | "backdrop"
): Promise<string | null> {
    if (!tmdbUrl) return null;

    try {
        // Use original quality for best results
        let highQualityUrl = tmdbUrl;
        if (tmdbUrl.includes("/w500/") || tmdbUrl.includes("/w780/")) {
            highQualityUrl = tmdbUrl.replace(/\/w\d+\//, "/original/");
        }

        const response = await fetch(highQualityUrl);
        if (!response.ok) {
            console.error(`Failed to fetch: ${highQualityUrl}`);
            return null;
        }

        const uploadDir = path.join(process.cwd(), "public", "movies");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // SEO-friendly filename with WebP extension and fanproj-af-somali suffix
        const filename = `${slug}-${type}-fanproj-af-somali.webp`;
        const filePath = path.join(uploadDir, filename);

        // Get image buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert to WebP with optimal quality
        const quality = type === "poster" ? 85 : 80;
        await sharp(buffer)
            .webp({ quality, effort: 6 })
            .toFile(filePath);

        console.log(`✓ Saved: /movies/${filename}`);
        return `/movies/${filename}`;
    } catch (error) {
        console.error(`Error processing ${type}:`, error);
        return null;
    }
}

// Migrate existing TMDB images to local WebP files with SEO filenames
// Usage: POST /api/images/migrate?limit=10&skip=0
export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");

    try {
        // Get all movies
        const allMovies = await convex.query(api.movies.listMovies, {});

        // Filter only movies with TMDB URLs (not yet migrated)
        const moviesToMigrate = allMovies.filter(
            (m) =>
                m.posterUrl?.includes("image.tmdb.org") ||
                m.backdropUrl?.includes("image.tmdb.org")
        );

        const totalToMigrate = moviesToMigrate.length;
        const batch = moviesToMigrate.slice(skip, skip + limit);

        const results = {
            totalMovies: allMovies.length,
            totalNeedMigration: totalToMigrate,
            alreadyMigrated: allMovies.length - totalToMigrate,
            batchStart: skip,
            batchEnd: skip + batch.length,
            processed: 0,
            success: 0,
            failed: 0,
            details: [] as Array<{
                title: string;
                slug: string;
                status: "success" | "failed" | "skipped";
                posterUrl?: string;
                backdropUrl?: string;
                error?: string;
            }>,
            nextBatch:
                skip + limit < totalToMigrate
                    ? `/api/images/migrate?limit=${limit}&skip=${skip + limit}`
                    : null,
        };

        for (const movie of batch) {
            const detail: (typeof results.details)[0] = {
                title: movie.title,
                slug: movie.slug,
                status: "skipped",
            };

            try {
                let posterUrl = movie.posterUrl;
                let backdropUrl = movie.backdropUrl;
                let updated = false;

                // Migrate poster to local WebP
                if (movie.posterUrl?.includes("image.tmdb.org")) {
                    console.log(`Processing poster for: ${movie.title} (${movie.slug})`);
                    const newUrl = await downloadAndConvertToLocal(
                        movie.posterUrl,
                        movie.slug,
                        "poster"
                    );
                    if (newUrl) {
                        posterUrl = newUrl;
                        detail.posterUrl = newUrl;
                        updated = true;
                    }
                }

                // Migrate backdrop to local WebP
                if (movie.backdropUrl?.includes("image.tmdb.org")) {
                    console.log(`Processing backdrop for: ${movie.title} (${movie.slug})`);
                    const newUrl = await downloadAndConvertToLocal(
                        movie.backdropUrl,
                        movie.slug,
                        "backdrop"
                    );
                    if (newUrl) {
                        backdropUrl = newUrl;
                        detail.backdropUrl = newUrl;
                        updated = true;
                    }
                }

                // Update movie in database
                if (updated) {
                    await convex.mutation(api.movies.updateMovieImages, {
                        id: movie._id,
                        posterUrl,
                        backdropUrl,
                    });
                    detail.status = "success";
                    results.success++;
                }
            } catch (error) {
                detail.status = "failed";
                detail.error = String(error);
                results.failed++;
                console.error(`Failed to migrate ${movie.title}:`, error);
            }

            results.processed++;
            results.details.push(detail);

            // Delay between movies to avoid rate limiting
            await new Promise((r) => setTimeout(r, 1000));
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { error: "Migration failed", details: String(error) },
            { status: 500 }
        );
    }
}

// GET to check migration status
export async function GET() {
    try {
        const allMovies = await convex.query(api.movies.listMovies, {});

        const withTmdbPoster = allMovies.filter((m) =>
            m.posterUrl?.includes("image.tmdb.org")
        ).length;

        const withTmdbBackdrop = allMovies.filter((m) =>
            m.backdropUrl?.includes("image.tmdb.org")
        ).length;

        const withLocalImages = allMovies.filter((m) =>
            m.posterUrl?.startsWith("/movies/")
        ).length;

        const fullyMigrated = allMovies.filter(
            (m) =>
                !m.posterUrl?.includes("image.tmdb.org") &&
                !m.backdropUrl?.includes("image.tmdb.org")
        ).length;

        return NextResponse.json({
            total: allMovies.length,
            needsMigration: {
                posters: withTmdbPoster,
                backdrops: withTmdbBackdrop,
            },
            localImages: withLocalImages,
            fullyMigrated,
            percentComplete:
                allMovies.length > 0
                    ? Math.round((fullyMigrated / allMovies.length) * 100)
                    : 100,
            howToMigrate: "POST /api/images/migrate?limit=10&skip=0",
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
