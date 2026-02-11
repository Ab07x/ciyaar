"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { Search, Loader2, Trophy, Calendar, Film, Tv } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDeviceId } from "@/lib/device";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SearchBox() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [lastTrackedQuery, setLastTrackedQuery] = useState("");
    const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Use unified search via SWR
    const { data: results } = useSWR(
        query.length >= 2 ? `/api/search?q=${encodeURIComponent(query)}` : null,
        fetcher,
        { dedupingInterval: 300 }
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search tracking - track after user stops typing
    useEffect(() => {
        if (query.length < 2 || query === lastTrackedQuery) return;
        if (results === undefined) return; // Wait for results

        const timer = setTimeout(async () => {
            const resultsCount =
                (results?.matches?.length || 0) +
                (results?.movies?.length || 0) +
                (results?.series?.length || 0);

            try {
                const res = await fetch("/api/data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "search-track",
                        query: query.trim(),
                        resultsCount,
                        deviceId: getDeviceId(),
                        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                    }),
                });
                const data = await res.json();
                if (data?.searchId) {
                    setCurrentSearchId(data.searchId);
                }
                setLastTrackedQuery(query);
            } catch (e) {
                console.error("Failed to track search:", e);
            }
        }, 1000); // Track 1 second after user stops typing

        return () => clearTimeout(timer);
    }, [query, results, lastTrackedQuery]);

    const handleSelect = useCallback(async (path: string, itemType: "match" | "movie" | "series", slug: string) => {
        // Track the click if we have a search ID
        if (currentSearchId) {
            try {
                await fetch("/api/data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "search-click",
                        searchId: currentSearchId,
                        clickedItem: slug,
                        clickedItemType: itemType,
                    }),
                });
            } catch (e) {
                console.error("Failed to track search click:", e);
            }
        }

        setIsOpen(false);
        setQuery("");
        setCurrentSearchId(null);
        router.push(path);
    }, [currentSearchId, router]);

    const hasResults = results && (results.matches.length > 0 || results.movies.length > 0 || results.series.length > 0);

    return (
        <div className="relative w-full max-w-sm" ref={searchRef}>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-green transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Raadi Ciyaar, Filim ama Musalsal..."
                    className="w-full bg-stadium-elevated border border-border-strong rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 transition-all placeholder:text-text-muted/50 text-white"
                />
                {query.length >= 2 && results === undefined && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
                )}
            </div>

            {/* Results Dropdown - Fixed position on mobile */}
            {isOpen && query.length >= 2 && hasResults && (
                <div
                    className="fixed inset-x-0 top-[120px] mx-4 md:absolute md:inset-auto md:top-full md:left-0 md:right-0 md:mx-0 md:mt-2 bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto"
                    style={{ zIndex: 999999 }}
                >

                    {/* Matches */}
                    {results.matches.length > 0 && (
                        <div>
                            <div className="p-2 border-b border-white/5 bg-white/5 flex items-center gap-2">
                                <Trophy size={12} className="text-text-muted" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Ciyaaro
                                </span>
                            </div>
                            {results.matches.map((match: any) => (
                                <button
                                    key={match._id}
                                    onClick={() => handleSelect(`/match/${match.slug}`, "match", match.slug)}
                                    className="w-full text-left p-3 hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0 group bg-[#1a1a2e]"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-stadium-dark border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-accent-green/30 transition-colors">
                                        <Trophy className="w-5 h-5 text-accent-gold" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate group-hover:text-accent-green transition-colors">
                                            {match.teamA} vs {match.teamB}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-text-muted truncate">
                                                {match.leagueName}
                                            </span>
                                        </div>
                                    </div>
                                    {match.status === "live" && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent-red/10 border border-accent-red/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
                                            <span className="text-[10px] font-black text-accent-red">LIVE</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Movies */}
                    {results.movies.length > 0 && (
                        <div>
                            <div className="p-2 border-b border-white/5 bg-white/5 flex items-center gap-2">
                                <Film size={12} className="text-text-muted" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Filimo
                                </span>
                            </div>
                            {results.movies.map((movie: any) => (
                                <button
                                    key={movie._id}
                                    onClick={() => handleSelect(`/movies/${movie.slug}`, "movie", movie.slug)}
                                    className="w-full text-left p-3 hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0 group bg-[#1a1a2e]"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-stadium-dark border border-white/10 overflow-hidden flex-shrink-0 group-hover:border-accent-blue/30 transition-colors relative">
                                        <Image src={movie.posterUrl} alt={movie.title} fill sizes="40px" className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate group-hover:text-accent-blue transition-colors">
                                            {movie.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-text-muted truncate">
                                                {movie.releaseDate?.split('-')[0]}
                                            </span>
                                            {movie.isPremium && <span className="text-[10px] text-accent-gold font-bold bg-accent-gold/10 px-1 rounded">PREMIUM</span>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Series */}
                    {results.series.length > 0 && (
                        <div>
                            <div className="p-2 border-b border-white/5 bg-white/5 flex items-center gap-2">
                                <Tv size={12} className="text-text-muted" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Musalsal
                                </span>
                            </div>
                            {results.series.map((show: any) => (
                                <button
                                    key={show._id}
                                    onClick={() => handleSelect(`/series/${show.slug}`, "series", show.slug)}
                                    className="w-full text-left p-3 hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0 group bg-[#1a1a2e]"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-stadium-dark border border-white/10 overflow-hidden flex-shrink-0 group-hover:border-accent-green/30 transition-colors relative">
                                        <Image src={show.posterUrl} alt={show.title} fill sizes="40px" className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate group-hover:text-accent-green transition-colors">
                                            {show.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-text-muted truncate">
                                                {show.firstAirDate?.split('-')[0]}
                                            </span>
                                            <span className="text-[10px] text-text-muted/70">{show.numberOfSeasons} Seasons</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-2 bg-white/5 border-t border-white/5">
                        <p className="text-[10px] text-center text-text-muted">
                            Si aad u hesho natiijooyin badan, fadlan ku qor magaca buuxifa
                        </p>
                    </div>
                </div>
            )}

            {isOpen && query.length >= 2 && results && !hasResults && (
                <div
                    className="fixed inset-x-0 top-[120px] mx-4 md:absolute md:inset-auto md:top-full md:left-0 md:right-0 md:mx-0 md:mt-2 bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl p-6 text-center"
                    style={{ zIndex: 999999 }}
                >
                    <p className="text-sm text-text-muted">Lama helin wax ciyaar, filim ama musalsal ah oo la mid ah "{query}"</p>
                </div>
            )}
        </div>
    );
}
