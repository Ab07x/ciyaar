"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    className?: string;
    priority?: boolean;
    aspectRatio?: string;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
    onLoad?: () => void;
}

/**
 * Mobile-optimized image component with:
 * - Lazy loading by default
 * - Blur placeholder
 * - Responsive sizes
 * - Error handling
 * - Loading states
 */
export function OptimizedImage({
    src,
    alt,
    width,
    height,
    fill = false,
    className,
    priority = false,
    aspectRatio,
    objectFit = "cover",
    onLoad
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setIsLoading(false);
        setError(true);
    };

    if (error) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-stadium-elevated text-text-muted",
                    className
                )}
                style={aspectRatio ? { aspectRatio } : undefined}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", className)} style={aspectRatio ? { aspectRatio } : undefined}>
            {isLoading && (
                <div className="absolute inset-0 bg-stadium-elevated animate-pulse" />
            )}
            <Image
                src={src}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                fill={fill}
                className={cn(
                    "transition-opacity duration-300",
                    isLoading ? "opacity-0" : "opacity-100",
                    objectFit === "cover" && "object-cover",
                    objectFit === "contain" && "object-contain",
                    objectFit === "fill" && "object-fill",
                    objectFit === "none" && "object-none",
                    objectFit === "scale-down" && "object-scale-down"
                )}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                quality={85}
                sizes={fill ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : undefined}
                onLoad={handleLoad}
                onError={handleError}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />
        </div>
    );
}
