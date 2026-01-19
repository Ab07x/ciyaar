"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { useUser } from "@/providers/UserProvider";
import { useState } from "react";
import { Film, Crown, Star, Calendar, Play, Lock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MoviesPage() {
    const movies = useQuery(api.movies.listMovies, { isPublished: true });
    const { isPremium } = useUser();
    const [filter, setFilter] = useState<"all" | "dubbed" | "premium">("all");
    const [genreFilter, setGenreFilter] = useState<string | null>(null);

    if (!movies) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    // Get unique genres
    const allGenres = Array.from(new Set(movies.flatMap((m) => m.genres))).slice(0, 10);

    // Filter movies
    let filteredMovies = movies;
    if (filter === "dubbed") {
        filteredMovies = movies.filter((m) => m.isDubbed);
    } else if (filter === "premium") {
        filteredMovies = movies.filter((m) => m.isPremium);
    }
    if (genreFilter) {
        filteredMovies = filteredMovies.filter((m) => m.genres.includes(genreFilter));
    }

    const dubbedMovies = movies.filter((m) => m.isDubbed);
    const premiumMovies = movies.filter((m) => m.isPremium);

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative py-12 md:py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-stadium-dark to-stadium-dark" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Film size={24} className="text-purple-400" />
                        <span className="text-purple-400 font-bold">FILIMADA</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                        Daawo <span className="text-accent-green">Filimada</span> Cusub
                    </h1>
                    <p className="text-xl text-text-secondary max-w-2xl">
                        Filimada ugu cusub ee Hollywood iyo Bollywood – qaar ka mid ah waa Af-Somali!
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 pb-16">
                <AdSlot slotKey="movies_top" className="mb-8" />

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex gap-2 p-1 bg-stadium-elevated rounded-xl border border-border-strong">
                        {[
                            { id: "all", label: "Dhammaan" },
                            { id: "dubbed", label: "Af-Somali" },
                            { id: "premium", label: "Premium" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                                    filter === f.id
                                        ? "bg-accent-green text-black"
                                        : "text-text-secondary hover:text-white"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Genre filter */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <Filter size={16} className="text-text-muted" />
                        {allGenres.map((genre) => (
                            <button
                                key={genre}
                                onClick={() => setGenreFilter(genreFilter === genre ? null : genre)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                                    genreFilter === genre
                                        ? "bg-purple-500 text-white"
                                        : "bg-stadium-hover text-text-muted hover:text-white"
                                )}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Movies Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredMovies.map((movie) => {
                        const isLocked = movie.isPremium && !isPremium;
                        return (
                            <Link
                                key={movie._id}
                                href={`/movies/${movie.slug}`}
                                className="group relative rounded-2xl overflow-hidden bg-stadium-elevated border border-border-strong hover:border-accent-green transition-all card-hover"
                            >
                                <div className="relative aspect-[2/3]">
                                    {movie.posterUrl ? (
                                        <img
                                            src={movie.posterUrl}
                                            alt={movie.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-stadium-dark flex items-center justify-center">
                                            <Film size={48} className="text-text-muted/30" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    {/* Play button */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-14 h-14 rounded-full bg-accent-green/90 flex items-center justify-center">
                                            {isLocked ? (
                                                <Lock size={24} className="text-black" />
                                            ) : (
                                                <Play size={24} className="text-black ml-1" fill="black" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {movie.isPremium && (
                                            <div className="flex items-center gap-1 bg-accent-gold px-2 py-0.5 rounded text-xs font-bold text-black">
                                                <Crown size={10} />
                                                PREMIUM
                                            </div>
                                        )}
                                        {movie.isDubbed && (
                                            <div className="bg-accent-green px-2 py-0.5 rounded text-xs font-bold text-black">
                                                AF-SOMALI
                                            </div>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    {movie.rating && movie.rating > 0 && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded">
                                            <Star size={12} className="text-accent-gold" fill="currentColor" />
                                            <span className="text-xs font-bold">{movie.rating.toFixed(1)}</span>
                                        </div>
                                    )}

                                    {/* Title at bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h3 className="font-bold text-sm line-clamp-2">
                                            {movie.titleSomali || movie.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                                            <span>{movie.releaseDate?.split("-")[0]}</span>
                                            {movie.runtime && <span>• {movie.runtime} min</span>}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {filteredMovies.length === 0 && (
                    <div className="text-center py-16">
                        <Film size={64} className="mx-auto mb-4 text-text-muted/30" />
                        <p className="text-text-muted">Ma jiraan filimo la mid ah filter-kaaga.</p>
                    </div>
                )}

                <AdSlot slotKey="movies_bottom" className="mt-12" />
            </div>
        </div>
    );
}
