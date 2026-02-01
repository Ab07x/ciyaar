"use client";

import { useState } from "react";

interface DownloadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function useImageDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImage = async (
    tmdbUrl: string,
    type: "poster" | "backdrop" = "poster"
  ): Promise<DownloadResult> => {
    if (!tmdbUrl || !tmdbUrl.includes("image.tmdb.org")) {
      return { success: false, error: "Invalid TMDB URL" };
    }

    setIsDownloading(true);
    try {
      const response = await fetch("/api/images/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbUrl, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true, url: data.url };
    } catch (error) {
      return { success: false, error: "Failed to download image" };
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadMovieImages = async (movie: {
    posterUrl?: string;
    backdropUrl?: string;
  }): Promise<{
    posterUrl?: string;
    backdropUrl?: string;
    errors: string[];
  }> => {
    const result: {
      posterUrl?: string;
      backdropUrl?: string;
      errors: string[];
    } = { errors: [] };

    setIsDownloading(true);

    try {
      // Download poster
      if (movie.posterUrl?.includes("image.tmdb.org")) {
        const posterResult = await downloadImage(movie.posterUrl, "poster");
        if (posterResult.success && posterResult.url) {
          result.posterUrl = posterResult.url;
        } else {
          result.errors.push(`Poster: ${posterResult.error}`);
        }
      }

      // Download backdrop
      if (movie.backdropUrl?.includes("image.tmdb.org")) {
        const backdropResult = await downloadImage(movie.backdropUrl, "backdrop");
        if (backdropResult.success && backdropResult.url) {
          result.backdropUrl = backdropResult.url;
        } else {
          result.errors.push(`Backdrop: ${backdropResult.error}`);
        }
      }
    } finally {
      setIsDownloading(false);
    }

    return result;
  };

  return {
    downloadImage,
    downloadMovieImages,
    isDownloading,
  };
}
