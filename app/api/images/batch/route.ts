import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ImageToDownload {
  movieId: string;
  posterUrl?: string;
  backdropUrl?: string;
}

// Batch download TMDB images for multiple movies
export async function POST(request: NextRequest) {
  try {
    const { movies }: { movies: ImageToDownload[] } = await request.json();

    if (!movies || !Array.isArray(movies)) {
      return NextResponse.json({ error: "movies array required" }, { status: 400 });
    }

    const results = [];

    for (const movie of movies) {
      const movieResult: {
        movieId: string;
        posterUrl?: string;
        backdropUrl?: string;
        errors: string[];
      } = {
        movieId: movie.movieId,
        errors: [],
      };

      // Download poster
      if (movie.posterUrl && movie.posterUrl.includes("image.tmdb.org")) {
        try {
          const url = await downloadAndStore(movie.posterUrl, "poster");
          movieResult.posterUrl = url;
        } catch (e) {
          movieResult.errors.push(`Poster: ${e}`);
        }
      }

      // Download backdrop
      if (movie.backdropUrl && movie.backdropUrl.includes("image.tmdb.org")) {
        try {
          const url = await downloadAndStore(movie.backdropUrl, "backdrop");
          movieResult.backdropUrl = url;
        } catch (e) {
          movieResult.errors.push(`Backdrop: ${e}`);
        }
      }

      results.push(movieResult);

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Batch download error:", error);
    return NextResponse.json(
      { error: "Failed to process batch" },
      { status: 500 }
    );
  }
}

async function downloadAndStore(tmdbUrl: string, type: string): Promise<string> {
  // Upgrade to original quality
  let highQualityUrl = tmdbUrl;
  if (tmdbUrl.includes("/w500/") || tmdbUrl.includes("/w780/")) {
    highQualityUrl = tmdbUrl.replace(/\/w\d+\//, "/original/");
  }

  // Fetch image
  const imageResponse = await fetch(highQualityUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch");
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

  // Upload to Convex
  const uploadUrl = await convex.mutation(api.media.generateUploadUrl, {});
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload");
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
  return publicUrl || "";
}
