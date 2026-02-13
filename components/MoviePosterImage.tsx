"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Optimize TMDB image URLs by replacing /original/ with sized versions.
 * /original/ serves full-res images (1261x1892px, 400KB+).
 * For poster cards displayed at ~320px wide, /w500/ is plenty.
 */
export function optimizeImageUrl(url: string | null | undefined, size: "poster" | "backdrop" = "poster"): string | null | undefined {
  if (!url) return url;
  if (url.includes("image.tmdb.org/t/p/original")) {
    const tmdbSize = size === "backdrop" ? "w1280" : "w500";
    return url.replace("/t/p/original", `/t/p/${tmdbSize}`);
  }
  return url;
}

interface MoviePosterImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  className?: string;
  fallbackClassName?: string;
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "from-red-900/50 to-red-950",
    "from-blue-900/50 to-blue-950",
    "from-purple-900/50 to-purple-950",
    "from-green-900/50 to-green-950",
    "from-orange-900/50 to-orange-950",
    "from-teal-900/50 to-teal-950",
    "from-pink-900/50 to-pink-950",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function MoviePosterImage({
  src,
  alt,
  fill = true,
  className,
  fallbackClassName,
  priority = false,
}: MoviePosterImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initials = alt
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const gradientColor = stringToColor(alt);

  const optimizedSrc = optimizeImageUrl(src, "poster");

  // Show fallback if no src or error loading
  if (!optimizedSrc || hasError) {
    return (
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center gap-2",
          `bg-gradient-to-br ${gradientColor}`,
          "border border-white/10",
          fallbackClassName
        )}
      >
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <Film size={32} className="text-white/40" />
        </div>
        <span className="text-white/60 font-bold text-lg tracking-wider">
          {initials || "?"}
        </span>
      </div>
    );
  }

  // Use plain <img> for local images (already optimized, no need for Next.js processing)
  // This fixes the "received null" errors and makes images load instantly
  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c] to-[#0d1b2a]">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn(
          fill ? "absolute inset-0 w-full h-full object-cover" : "object-cover",
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </>
  );
}
