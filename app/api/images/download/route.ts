import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Allowed image domains for downloading
const ALLOWED_DOMAINS = [
  "image.tmdb.org",         // TMDB
  "m.media-amazon.com",     // IMDB primary
  "ia.media-imdb.com",      // IMDB alternate
  "images-na.ssl-images-amazon.com", // Amazon/IMDB
];

// Download TMDB/IMDB image and upload to Convex storage
export async function POST(request: NextRequest) {
  try {
    const { tmdbUrl, imageUrl, type = "poster" } = await request.json();

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

    // Get upload URL from Convex
    const uploadUrl = await convex.mutation(api.media.generateUploadUrl, {});

    // Upload to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 });
    }

    const { storageId } = await uploadResponse.json();

    // Save media metadata
    await convex.mutation(api.media.saveMedia, {
      storageId,
      name: `${type}-${Date.now()}`,
      type: contentType,
      size: imageBuffer.byteLength,
    });

    // Get the public URL
    const publicUrl = await convex.query(api.media.getMediaUrl, { storageId });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      storageId,
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

