import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Migrate existing TMDB images to self-hosted
// Usage: POST /api/images/migrate?limit=50&skip=0
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "50");
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
        status: "success" | "failed" | "skipped";
        posterUrl?: string;
        backdropUrl?: string;
        error?: string;
      }>,
      nextBatch: skip + limit < totalToMigrate ? `/api/images/migrate?limit=${limit}&skip=${skip + limit}` : null,
    };

    for (const movie of batch) {
      const detail: typeof results.details[0] = {
        title: movie.title,
        status: "skipped",
      };

      try {
        let posterUrl = movie.posterUrl;
        let backdropUrl = movie.backdropUrl;
        let updated = false;

        // Migrate poster
        if (movie.posterUrl?.includes("image.tmdb.org")) {
          console.log(`Downloading poster for: ${movie.title}`);
          const newUrl = await downloadAndStore(movie.posterUrl, "poster");
          if (newUrl) {
            posterUrl = newUrl;
            detail.posterUrl = newUrl;
            updated = true;
          }
        }

        // Migrate backdrop
        if (movie.backdropUrl?.includes("image.tmdb.org")) {
          console.log(`Downloading backdrop for: ${movie.title}`);
          const newUrl = await downloadAndStore(movie.backdropUrl, "backdrop");
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
      await new Promise((r) => setTimeout(r, 500));
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
      fullyMigrated,
      percentComplete: Math.round((fullyMigrated / allMovies.length) * 100),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function downloadAndStore(
  tmdbUrl: string,
  type: string
): Promise<string | null> {
  try {
    // Use w780 for good quality without being too large
    let optimizedUrl = tmdbUrl;
    if (tmdbUrl.includes("/original/")) {
      optimizedUrl = tmdbUrl.replace("/original/", "/w780/");
    } else if (tmdbUrl.includes("/w500/")) {
      optimizedUrl = tmdbUrl.replace("/w500/", "/w780/");
    }

    const imageResponse = await fetch(optimizedUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to fetch: ${optimizedUrl}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Get upload URL
    const uploadUrl = await convex.mutation(api.media.generateUploadUrl, {});

    // Upload to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      console.error("Failed to upload to Convex storage");
      return null;
    }

    const { storageId } = await uploadResponse.json();

    // Save metadata
    await convex.mutation(api.media.saveMedia, {
      storageId,
      name: `${type}-${Date.now()}`,
      type: contentType,
      size: imageBuffer.byteLength,
    });

    // Get public URL
    const publicUrl = await convex.query(api.media.getMediaUrl, { storageId });
    return publicUrl;
  } catch (error) {
    console.error("Download/store error:", error);
    return null;
  }
}
