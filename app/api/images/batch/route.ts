import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Media } from "@/lib/models";
import fs from "fs";
import path from "path";

interface ImageToDownload {
  movieId: string;
  slug?: string;
  posterUrl?: string;
  backdropUrl?: string;
}

// Batch download TMDB images for multiple movies
export async function POST(request: NextRequest) {
  try {
    await connectDB();
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
          const url = await downloadAndStore(movie.posterUrl, "poster", movie.slug);
          movieResult.posterUrl = url;
        } catch (e) {
          movieResult.errors.push(`Poster: ${e}`);
        }
      }

      // Download backdrop
      if (movie.backdropUrl && movie.backdropUrl.includes("image.tmdb.org")) {
        try {
          const url = await downloadAndStore(movie.backdropUrl, "backdrop", movie.slug);
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

async function downloadAndStore(tmdbUrl: string, type: string, slug?: string): Promise<string> {
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
  const buffer = Buffer.from(imageBuffer);

  // Save locally
  const dir = path.join(process.cwd(), "public", type === "backdrop" ? "backdrops" : "posters");
  fs.mkdirSync(dir, { recursive: true });

  const filename = slug
    ? `${slug}-af-somali-${type}.jpg`
    : `${type}-${Date.now()}.jpg`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);

  const publicUrl = `/${type === "backdrop" ? "backdrops" : "posters"}/${filename}`;

  // Save metadata
  await Media.create({
    name: filename,
    type: contentType,
    size: buffer.byteLength,
    url: publicUrl,
    createdAt: Date.now(),
  });

  return publicUrl;
}
