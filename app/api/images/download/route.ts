import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Download TMDB image and upload to Convex storage
export async function POST(request: NextRequest) {
  try {
    const { tmdbUrl, type = "poster" } = await request.json();

    if (!tmdbUrl) {
      return NextResponse.json({ error: "tmdbUrl required" }, { status: 400 });
    }

    // Validate it's a TMDB URL
    if (!tmdbUrl.includes("image.tmdb.org")) {
      return NextResponse.json({ error: "Only TMDB URLs allowed" }, { status: 400 });
    }

    // Upgrade to original quality if using lower quality
    let highQualityUrl = tmdbUrl;
    if (tmdbUrl.includes("/w500/") || tmdbUrl.includes("/w780/")) {
      highQualityUrl = tmdbUrl.replace(/\/w\d+\//, "/original/");
    }

    // Fetch the image from TMDB
    const imageResponse = await fetch(highQualityUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image from TMDB" }, { status: 500 });
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
      originalUrl: tmdbUrl,
    });
  } catch (error) {
    console.error("Image download error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
