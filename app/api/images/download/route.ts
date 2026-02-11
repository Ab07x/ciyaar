import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Media } from "@/lib/models";
import fs from "fs";
import path from "path";

// Allowed image domains for downloading
const ALLOWED_DOMAINS = [
  "image.tmdb.org",         // TMDB
  "m.media-amazon.com",     // IMDB primary
  "ia.media-imdb.com",      // IMDB alternate
  "images-na.ssl-images-amazon.com", // Amazon/IMDB
];

// Download TMDB/IMDB image and save locally
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { tmdbUrl, imageUrl, type = "poster", slug } = await request.json();

    // Support both tmdbUrl (legacy) and imageUrl (new)
    const sourceUrl = imageUrl || tmdbUrl;

    if (!sourceUrl) {
      return NextResponse.json({ error: "imageUrl or tmdbUrl required" }, { status: 400 });
    }

    // Validate the URL is from an allowed domain
    const url = new URL(sourceUrl);
    const isAllowed = ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain));
    if (!isAllowed) {
      return NextResponse.json({ error: "Only TMDB and IMDB URLs allowed" }, { status: 400 });
    }

    // Upgrade to original quality if using lower quality (TMDB only)
    let highQualityUrl = sourceUrl;
    if (sourceUrl.includes("image.tmdb.org")) {
      if (sourceUrl.includes("/w500/") || sourceUrl.includes("/w780/")) {
        highQualityUrl = sourceUrl.replace(/\/w\d+\//, "/original/");
      }
    }

    // Fetch the image
    const imageResponse = await fetch(highQualityUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
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

    // Save media metadata to MongoDB
    await Media.create({
      name: filename,
      type: contentType,
      size: buffer.byteLength,
      url: publicUrl,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      originalUrl: sourceUrl,
    });
  } catch (error) {
    console.error("Image download error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
