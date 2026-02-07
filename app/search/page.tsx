"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, Loader2, Trophy, Film, Tv, ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const trackSearch = useMutation(api.searchAnalytics.trackSearch);
    const trackSearchClick = useMutation(api.searchAnalytics.trackSearchClick);
    const lastSearchIdRef = useRef<Id<"search_analytics"> | null>(null);
    const trackedQueriesRef = useRef(new Set<string>());
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // @ts-ignore
    const results = useQuery(api.search.searchAll, { query: query.length >= 2 ? query : "" }) as any;

    useEffect(() => {
        // Auto-focus input on mount
        inputRef.current?.focus();
    }, []);

    // Debounced search tracking - fires 1s after typing stops
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (query.length < 2 || results === undefined) return;

        const q = query.toLowerCase().trim();
        if (trackedQueriesRef.current.has(q)) return;

        debounceTimerRef.current = setTimeout(async () => {
            const resultsCount =
                (results?.matches?.length || 0) +
                (results?.movies?.length || 0) +
                (results?.series?.length || 0);

            const deviceId = typeof window !== "undefined"
                ? localStorage.getItem("fanbroj_device_id") || undefined
                : undefined;

            try {
                const searchId = await trackSearch({
                    query,
                    resultsCount,
                    deviceId,
                });
                if (searchId) lastSearchIdRef.current = searchId;
                trackedQueriesRef.current.add(q);
            } catch {
                // Silently fail - analytics shouldn't break the app
            }
        }, 1000);

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [query, results, trackSearch]);

    const handleResultClick = useCallback((slug: string, type: "match" | "movie" | "series") => {
        if (lastSearchIdRef.current) {
            trackSearchClick({
                searchId: lastSearchIdRef.current,
                clickedItem: slug,
                clickedItemType: type,
            }).catch(() => { });
        }
    }, [trackSearchClick]);

    const hasResults = results && (
        (results.matches?.length || 0) > 0 ||
        (results.movies?.length || 0) > 0 ||
        (results.series?.length || 0) > 0
    );

    return (
        <div className="min-h-screen bg-stadium-dark pb-24">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-stadium-dark/95 backdrop-blur-xl border-b border-border-strong p-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-text-muted hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search matches, movies..."
                            className="w-full bg-stadium-elevated border border-border-strong rounded-xl py-3 pl-10 pr-10 text-base text-white focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 placeholder:text-text-muted/50"
                        />
                        {query.length > 0 && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="p-4 space-y-6">
                {/* Loading State */}
                {query.length >= 2 && results === undefined && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
                    </div>
                )}

                {/* No Results */}
                {query.length >= 2 && results && !hasResults && (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No results found</h3>
                        <p className="text-text-muted text-sm">Try searching for "Arsenal", "Somali", or "Breaking Bad"</p>
                    </div>
                )}

                {/* Matches */}
                {results?.matches && results.matches.length > 0 && (
                    <section>
                        <h2 className="flex items-center gap-2 text-sm font-black text-text-muted uppercase tracking-widest mb-3">
                            <Trophy size={14} /> Matches
                        </h2>
                        <div className="space-y-2">
                            {results.matches.map((match: any) => (
                                <Link
                                    key={match._id}
                                    href={`/match/${match.slug}`}
                                    onClick={() => handleResultClick(match.slug, "match")}
                                    className="block bg-stadium-elevated border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-stadium-dark flex items-center justify-center border border-white/10 text-accent-gold">
                                            <Trophy size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{match.teamA} vs {match.teamB}</h3>
                                            <p className="text-xs text-text-muted mt-0.5">{match.leagueName}</p>
                                        </div>
                                        {match.status === "live" && (
                                            <div className="ml-auto bg-accent-red/10 border border-accent-red/20 px-2 py-1 rounded">
                                                <span className="text-[10px] font-black text-accent-red animate-pulse">LIVE</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Movies */}
                {results?.movies && results.movies.length > 0 && (
                    <section>
                        <h2 className="flex items-center gap-2 text-sm font-black text-text-muted uppercase tracking-widest mb-3">
                            <Film size={14} /> Movies
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {results.movies.map((movie: any) => (
                                <Link
                                    key={movie._id}
                                    href={`/movies/${movie.slug}`}
                                    onClick={() => handleResultClick(movie.slug, "movie")}
                                    className="bg-stadium-elevated border border-white/5 rounded-xl overflow-hidden active:scale-[0.98] transition-all"
                                >
                                    <div className="aspect-[2/3] relative">
                                        <Image src={movie.posterUrl} alt={movie.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                                        {movie.isPremium && <span className="absolute top-2 right-2 bg-accent-gold text-black text-[10px] font-bold px-1.5 py-0.5 rounded">PRO</span>}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-bold text-white truncate">{movie.title}</h3>
                                        <p className="text-xs text-text-muted mt-0.5">{movie.releaseDate?.split('-')[0] || "Unknown"}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Series */}
                {results?.series && results.series.length > 0 && (
                    <section>
                        <h2 className="flex items-center gap-2 text-sm font-black text-text-muted uppercase tracking-widest mb-3">
                            <Tv size={14} /> Series
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {results.series.map((show: any) => (
                                <Link
                                    key={show._id}
                                    href={`/series/${show.slug}`}
                                    onClick={() => handleResultClick(show.slug, "series")}
                                    className="bg-stadium-elevated border border-white/5 rounded-xl overflow-hidden active:scale-[0.98] transition-all"
                                >
                                    <div className="aspect-[2/3] relative">
                                        <Image src={show.posterUrl} alt={show.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-bold text-white truncate">{show.title}</h3>
                                        <p className="text-xs text-text-muted mt-0.5">{show.numberOfSeasons} Seasons</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
