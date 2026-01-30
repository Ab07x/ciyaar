"use client";

import Link from "next/link";
import { Play, Lock, Layers, Tv } from "lucide-react";
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
            className={cn("group block relative rounded-xl overflow-hidden bg-stadium-elevated card-hover", className)}
        >
            {/* Poster Container */}
            <div className="aspect-[2/3] relative overflow-hidden bg-white/5">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                        <Tv size={24} className="opacity-50" />
                        <span className="text-[10px] uppercase font-bold text-center px-2">{title}</span>
                    </div>
                )}

                {/* Premium Badge */}
                {isPremium && (
                    <div className="absolute top-2 left-2 badge-premium z-10">
                        <Lock size={10} />
                        PREMIUM
                    </div>
                )}

                {/* Seasons/Episodes Badge - More prominent */}
                <div className="absolute bottom-2 right-2 bg-accent-green text-black px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 z-10">
                    <Layers size={12} />
                    {seasons} Season{seasons !== 1 && "s"} • {episodes} EP
                </div>

                {/* Series indicator */}
                <div className="absolute top-2 right-2 bg-stadium-dark/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-accent-green flex items-center gap-1 z-10">
                    <Tv size={10} />
                    MUSALSAL
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-accent-green text-black rounded-full p-4 transform scale-50 group-hover:scale-100 transition-transform duration-300">
                        <Play fill="currentColor" size={24} />
                    </div>
                </div>

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="font-semibold text-text-primary text-sm truncate mb-1" title={title}>
                    {title}
                </h3>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{year}</span>
                    <span className="text-accent-green font-medium">{episodes} Episode{episodes !== 1 && "s"}</span>
                </div>
            </div>
        </Link>
    );
}
