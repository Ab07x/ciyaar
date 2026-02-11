
import React from "react";
import Image from "next/image";
import { Star, Crown, Play } from "lucide-react";
import Link from "next/link";

interface TVMovieCardProps {
    movie: any;
    isPremium: boolean;
    priority?: boolean;
}

export function TVMovieCard({ movie, isPremium, priority = false }: TVMovieCardProps) {
    return (
        <Link
            href={`/tv/movies/${movie.slug}`}
            className="group block relative rounded-xl transition-transform duration-200 focus:scale-105 focus:ring-4 focus:ring-white focus:outline-none"
        >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 shadow-lg">
                <Image
                    src={movie.posterUrl || ""}
                    alt={movie.title}
                    fill
                    className="object-cover transition-opacity duration-300 group-focus:opacity-80"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={priority}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-focus:opacity-40 transition-opacity" />

                {/* Premium Badge */}
                {movie.isPremium && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded shadow-md">
                        <Crown size={12} />
                        <span>PREMIUM</span>
                    </div>
                )}

                {/* Rating */}
                {movie.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded">
                        <Star size={12} className="text-yellow-400" fill="currentColor" />
                        {movie.rating.toFixed(1)}
                    </div>
                )}

                {/* Play Icon on Focus */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-focus:opacity-100 transition-opacity duration-200">
                    <div className="bg-white text-black p-3 rounded-full shadow-lg">
                        <Play fill="currentColor" size={24} />
                    </div>
                </div>
            </div>

            <div className="mt-3 px-1">
                <h3 className="text-lg font-bold text-gray-100 truncate group-focus:text-white">
                    {movie.titleSomali || movie.title}
                </h3>
                <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                    <span>{new Date(movie.releaseDate).getFullYear()}</span>
                    {movie.genres && movie.genres.length > 0 && (
                        <>
                            <span className="w-1 h-1 bg-gray-500 rounded-full" />
                            <span className="truncate max-w-[120px]">{movie.genres[0]}</span>
                        </>
                    )}
                </p>
            </div>
        </Link>
    );
}
