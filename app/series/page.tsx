"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { AdSlot } from "@/components/AdSlot";
import { useUser } from "@/providers/UserProvider";
import { useState } from "react";
import { Tv, Crown, Star, Play, Lock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SeriesPage() {
    const series = useQuery(api.series.listSeries, { isPublished: true });
    const { isPremium } = useUser();
    const [filter, setFilter] = useState<"all" | "dubbed" | "premium">("all");
    const [genreFilter, setGenreFilter] = useState<string | null>(null);

    if (!series) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    // Get unique genres
    const allGenres = Array.from(new Set(series.flatMap((s) => s.genres))).slice(0, 10);

    // Filter series
    let filteredSeries = series;
    if (filter === "dubbed") {
        filteredSeries = series.filter((s) => s.isDubbed);
    } else if (filter === "premium") {
        filteredSeries = series.filter((s) => s.isPremium);
    }
    if (genreFilter) {
        filteredSeries = filteredSeries.filter((s) => s.genres.includes(genreFilter));
    }

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative py-12 md:py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-stadium-dark to-stadium-dark" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Tv size={24} className="text-blue-400" />
                        <span className="text-blue-400 font-bold">MUSALSAL</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                        Daawo <span className="text-accent-green">Musalsal</span> Cusub
                    </h1>
                    <p className="text-xl text-text-secondary max-w-2xl">
                        Musalsaladii ugu dambeeyay ee Caalamka, Turkey, iyo kuwo kale oo Af-Somali ah!
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 pb-16">
                <AdSlot slotKey="series_top" className="mb-8" />

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
                                        ? "bg-blue-500 text-white"
                                        : "bg-stadium-hover text-text-muted hover:text-white"
                                )}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Series Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredSeries.map((s) => {
                        const isLocked = s.isPremium && !isPremium;
                        return (
                            <Link
                                key={s._id}
                                href={`/series/${s.slug}`}
                                className="group relative rounded-2xl overflow-hidden bg-stadium-elevated border border-border-strong hover:border-accent-green transition-all card-hover"
                            >
                                <div className="relative aspect-[2/3]">
                                    {s.posterUrl ? (
                                        <Image
                                            src={s.posterUrl}
                                            alt={s.title}
                                            fill
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-stadium-dark flex items-center justify-center">
                                            <Tv size={48} className="text-text-muted/30" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    {/* Play button */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isLocked ? (
                                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                                                <Lock size={24} className="text-white" />
                                            </div>
                                        ) : (
                                            <div className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                Daawo NOW
                                                <Play size={16} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {s.isPremium && (
                                            <div className="flex items-center gap-1 bg-accent-gold px-2 py-0.5 rounded text-xs font-bold text-black">
                                                <Crown size={10} />
                                                PREMIUM
                                            </div>
                                        )}
                                        {s.isDubbed && (
                                            <div className="bg-accent-green px-2 py-0.5 rounded text-xs font-bold text-black">
                                                AF-SOMALI
                                            </div>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    {s.rating && s.rating > 0 && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded">
                                            <Star size={12} className="text-accent-gold" fill="currentColor" />
                                            <span className="text-xs font-bold">{s.rating.toFixed(1)}</span>
                                        </div>
                                    )}

                                    {/* Title at bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h3 className="font-bold text-sm line-clamp-2">
                                            {s.titleSomali || s.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                                            <span>{s.firstAirDate?.split("-")[0]}</span>
                                            <span>• {s.numberOfSeasons} Seasons</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {filteredSeries.length === 0 && (
                    <div className="text-center py-16">
                        <Tv size={64} className="mx-auto mb-4 text-text-muted/30" />
                        <p className="text-text-muted">Ma jiraan musalsal la mid ah filter-kaaga.</p>
                    </div>
                )}

                <AdSlot slotKey="series_bottom" className="mt-12" />
            </div>
        </div>
    );
}
