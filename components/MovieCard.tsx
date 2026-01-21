"use client";

import Link from "next/link";
import { Play, Star, Lock, Languages } from "lucide-react";
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
            className={cn("group block relative rounded-xl overflow-hidden bg-stadium-elevated card-hover", className)}
        >
            {/* Poster Container */}
            <div className="aspect-[2/3] relative overflow-hidden">
                <img
                    src={posterUrl}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
                    {/* AF-SOMALI Badge */}
                    <div className="badge-af-somali">
                        <Languages size={10} />
                        AF-SOMALI
                    </div>

                    {/* Premium Badge */}
                    {isPremium && (
                        <div className="badge-premium">
                            <Lock size={10} />
                            PREMIUM
                        </div>
                    )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-accent-blue text-white rounded-full p-4 transform scale-50 group-hover:scale-100 transition-transform duration-300">
                        <Play fill="currentColor" size={24} />
                    </div>
                </div>

                {/* Bottom gradient for better text readability */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
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
