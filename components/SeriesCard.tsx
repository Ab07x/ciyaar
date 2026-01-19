"use client";

import Link from "next/link";
import { Play, Lock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeriesCardProps {
    id: string;
    slug: string;
    title: string;
    posterUrl: string;
    seasons: number;
    episodes: number;
    year: string;
    isPremium?: boolean;
    className?: string;
}

export function SeriesCard({
    id,
    slug,
    title,
    posterUrl,
    seasons,
    episodes,
    year,
    isPremium,
    className
}: SeriesCardProps) {
    return (
        <Link
            href={`/series/${slug}`}
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

                {/* Episode Count Badge */}
                <div className="absolute bottom-2 right-2 bg-stadium-dark/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold border border-border-subtle flex items-center gap-1">
                    <Layers size={10} className="text-accent-green" />
                    {episodes} EP
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-accent-green text-black rounded-full p-4 transform scale-50 group-hover:scale-100 transition-transform duration-300">
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
                    <span>{seasons} {seasons === 1 ? 'Season' : 'Seasons'}</span>
                </div>
            </div>
        </Link>
    );
}
