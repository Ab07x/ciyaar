"use client";

import Link from "next/link";
import { Play, Star, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieCardProps {
    id: string;
    slug: string;
    title: string;
    posterUrl: string;
    year: string;
    rating?: number;
    isPremium?: boolean;
    className?: string;
}

export function MovieCard({
    id,
    slug,
    title,
    posterUrl,
    year,
    rating,
    isPremium,
    className
}: MovieCardProps) {
    return (
        <Link
            href={`/movies/${slug}`}
            className={cn("group block relative rounded-xl overflow-hidden bg-stadium-elevated", className)}
        >
            {/* Poster Container */}
            <div className="aspect-[2/3] relative overflow-hidden">
                <img
                    src={posterUrl}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Premium Badge */}
                {isPremium && (
                    <div className="absolute top-2 left-2 bg-accent-gold text-black text-xs font-bold px-2 py-1 rounded bg-opacity-90 flex items-center gap-1 z-10">
                        <Lock size={12} />
                        PREMIUM
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-accent-blue text-white rounded-full p-4 transform scale-50 group-hover:scale-100 transition-transform duration-300">
                        <Play fill="currentColor" size={24} />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="font-semibold text-text-primary text-sm truncate mb-1" title={title}>
                    {title}
                </h3>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{year}</span>
                    {rating && rating > 0 && (
                        <div className="flex items-center gap-1 text-accent-gold">
                            <Star size={12} fill="currentColor" />
                            <span>{rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
