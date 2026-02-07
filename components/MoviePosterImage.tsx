"use client";

import { useState } from "react";
import Image from "next/image";
import { Film, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Generate a deterministic color based on string
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
  width,
  height,
  priority = false,
  quality = 80,
  sizes = "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 14vw",
  className,
  fallbackClassName,
}: MoviePosterImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get initials from alt text
  const initials = alt
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const gradientColor = stringToColor(alt);

  // Show fallback if no src or error loading
  if (!src || hasError) {
    return (
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center gap-2",
          `bg-gradient-to-br ${gradientColor}`,
          "border border-white/10",
          fallbackClassName
        )}
      >
        {/* Movie icon placeholder */}
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <Film size={32} className="text-white/40" />
        </div>
        {/* Show initials */}
        <span className="text-white/60 font-bold text-lg tracking-wider">
          {initials || "?"}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c] to-[#0d1b2a]">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent"
            style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Film size={32} className="text-white/20 animate-pulse" />
          </div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={cn(
          "object-cover transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.warn(`[MoviePosterImage] Failed to load: ${src}`);
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </>
  );
}
