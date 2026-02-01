"use client";

import { useState } from "react";
import Image from "next/image";
import { Film } from "lucide-react";
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

  // Show fallback if no src or error loading
  if (!src || hasError) {
    return (
      <div
        className={cn(
          "w-full h-full bg-[#0d1b2a] flex items-center justify-center",
          fallbackClassName
        )}
      >
        <Film size={48} className="text-white/20" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-[#0d1b2a] animate-pulse" />
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
          "object-cover transition-opacity duration-300",
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
