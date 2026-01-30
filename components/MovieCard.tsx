"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    isLocked?: boolean; // New prop
}

export function MovieCard({
    id,
    slug,
    title,
    posterUrl,
    year,
    rating,
    isPremium,
    className,
    isLocked = false,
}: MovieCardProps) {
    const [imgError, setImgError] = useState(false); // Added state for image error

    return (
        <Link
            href={`/movies/${slug}`}
            className={cn(
                "group block relative rounded-lg overflow-hidden bg-[#0d1117] border border-white/5 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                isLocked && "opacity-90 grayscale-[0.3]",
                className
            )}
        >
            {/* Poster Container */}
            <div className="aspect-[2/3] relative overflow-hidden bg-white/5">
                <div className="relative w-full h-full">
                    {posterUrl && !imgError ? (
                        <Image
                            src={posterUrl}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex flex-col items-center justify-center text-white/30 gap-2">
                            <Play size={32} className="opacity-50" />
                            <span className="text-xs font-bold text-center px-2 line-clamp-2">{title}</span>
                        </div>
                    )}
                </div>

                {/* Top Badges */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start z-10">
                    {/* AF-SOMALI Badge */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white text-[8px] md:text-[9px] font-bold uppercase rounded">
                        <Languages size={8} />
                        <span className="hidden sm:inline">AF-SOMALI</span>
                    </div>

                    {/* Premium Badge */}
                    {isPremium && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[8px] md:text-[9px] font-bold uppercase rounded">
                            <Lock size={8} />
                            <span className="hidden sm:inline">PREMIUM</span>
                        </div>
                    )}
                </div>

                {/* Rating Badge */}
                {rating && rating > 0 && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold rounded">
                        <Star size={10} className="text-yellow-400" fill="currentColor" />
                        {rating.toFixed(1)}
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 md:bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isLocked ? (
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                            <Lock size={20} className="md:w-6 md:h-6 text-white" />
                        </div>
                    ) : (
                        <div className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-2 py-1 md:px-4 md:py-2 rounded-full flex items-center gap-1 md:gap-2 text-[10px] md:text-sm shadow-lg transform scale-100 md:scale-90 md:group-hover:scale-100 transition-transform">
                            Daawo NOW
                            <Play size={12} className="md:w-4 md:h-4" fill="currentColor" />
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="p-2 md:p-3 bg-[#0d1117]">
                <h3 className="font-bold text-white text-xs md:text-sm truncate mb-0.5" title={title}>
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400">
                    <span>{year}</span>
                </div>
            </div>
        </Link>
    );
}
