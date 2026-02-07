"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, X, Trophy, Film, Tv, Loader2, Command, ArrowRight, Clock, Star, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getDeviceId } from "@/lib/device";

interface GlobalSearchProps {
    trigger?: React.ReactNode;
}

export function GlobalSearch({ trigger }: GlobalSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Search query
    const results = useQuery(
        api.search.searchAll,
        { query: query.length >= 2 ? query : "" }
    );

    // Analytics
    const trackSearch = useMutation(api.searchAnalytics.trackSearch);
    const trackSearchClick = useMutation(api.searchAnalytics.trackSearchClick);

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Track search after typing stops
    useEffect(() => {
        if (query.length < 2 || results === undefined) return;

        const timer = setTimeout(async () => {
            const resultsCount =
                (results?.matches?.length || 0) +
                (results?.movies?.length || 0) +
                (results?.series?.length || 0);

            try {
                await trackSearch({
                    query: query.trim(),
                    resultsCount,
                    deviceId: getDeviceId(),
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                });
            } catch (e) {
                // Silently fail
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [query, results, trackSearch]);

    const handleSelect = useCallback((path: string) => {
        setIsOpen(false);
        setQuery("");
        router.push(path);
    }, [router]);

    const hasResults = results && (
        results.matches.length > 0 ||
        results.movies.length > 0 ||
        results.series.length > 0
    );

    const isLoading = query.length >= 2 && results === undefined;

    // Recent searches (from localStorage)
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("fanbroj_recent_searches");
        if (stored) {
            setRecentSearches(JSON.parse(stored).slice(0, 5));
        }
    }, [isOpen]);

    const saveRecentSearch = (search: string) => {
        const stored = localStorage.getItem("fanbroj_recent_searches");
        const existing = stored ? JSON.parse(stored) : [];
        const updated = [search, ...existing.filter((s: string) => s !== search)].slice(0, 5);
        localStorage.setItem("fanbroj_recent_searches", JSON.stringify(updated));
    };

    return (
        <>
            {/* Search Trigger */}
            {trigger ? (
                <div onClick={() => setIsOpen(true)}>{trigger}</div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#333333] hover:bg-[#2a4a6c] rounded-full text-gray-400 transition-colors border border-[#2a4a6c]"
                >
                    <Search className="w-4 h-4" />
                    <span className="hidden md:inline text-sm">Raadi...</span>
                    <kbd className="hidden md:inline px-2 py-0.5 bg-[#1a1a2e] rounded text-[10px] font-mono ml-2">
                        <Command className="w-3 h-3 inline mr-0.5" />K
                    </kbd>
                </button>
            )}

            {/* Search Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[#1a1a2e] border border-[#333333] rounded-2xl shadow-2xl z-[201] overflow-hidden"
                        >
                            {/* Search Input */}
                            <div className="flex items-center gap-3 p-4 border-b border-[#333333]">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        if (e.target.value.length >= 2) {
                                            saveRecentSearch(e.target.value);
                                        }
                                    }}
                                    placeholder="Raadi ciyaar, filim, ama musalsal..."
                                    className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-500 text-white"
                                    autoFocus
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery("")}
                                        className="p-1 hover:bg-[#333333] rounded transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-2 py-1 bg-[#333333] hover:bg-[#2a4a6c] rounded text-sm text-gray-400 transition-colors"
                                >
                                    ESC
                                </button>
                            </div>

                            {/* Results */}
                            <div className="max-h-[60vh] overflow-y-auto">
                                {/* Loading */}
                                {isLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#E50914]" />
                                    </div>
                                )}

                                {/* No query - show suggestions */}
                                {!query && (
                                    <div className="p-4">
                                        {/* Recent Searches */}
                                        {recentSearches.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="px-2 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    Recent Searches
                                                </h3>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {recentSearches.map((search, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setQuery(search)}
                                                            className="px-3 py-1.5 bg-[#333333] hover:bg-[#2a4a6c] rounded-full text-sm text-gray-300 transition-colors"
                                                        >
                                                            {search}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quick Links */}
                                        <h3 className="px-2 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Quick Links
                                        </h3>
                                        <div className="mt-2 space-y-1">
                                            {[
                                                { href: "/ciyaar?filter=live", label: "Live Matches", icon: Trophy, color: "text-red-400" },
                                                { href: "/movies", label: "Movies", icon: Film, color: "text-blue-400" },
                                                { href: "/series", label: "Series", icon: Tv, color: "text-green-400" },
                                            ].map((link) => (
                                                <button
                                                    key={link.href}
                                                    onClick={() => handleSelect(link.href)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#333333] transition-colors group"
                                                >
                                                    <link.icon className={cn("w-5 h-5", link.color)} />
                                                    <span className="text-gray-300 group-hover:text-white transition-colors">
                                                        {link.label}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Results */}
                                {query.length >= 2 && !isLoading && hasResults && (
                                    <div className="p-2">
                                        {/* Matches */}
                                        {results.matches.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                    <Trophy className="w-3 h-3 text-[#E50914]" />
                                                    CIYAARO ({results.matches.length})
                                                </h3>
                                                {results.matches.slice(0, 5).map((match: any) => (
                                                    <button
                                                        key={match._id}
                                                        onClick={() => handleSelect(`/match/${match.slug}`)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#333333] transition-colors group"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-[#333333] flex items-center justify-center">
                                                            <Trophy className="w-5 h-5 text-[#E50914]" />
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="font-medium text-white group-hover:text-[#E50914] transition-colors">
                                                                {match.teamA} vs {match.teamB}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{match.leagueName}</p>
                                                        </div>
                                                        {match.status === "live" && (
                                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                                LIVE
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Movies */}
                                        {results.movies.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                    <Film className="w-3 h-3 text-blue-400" />
                                                    FILIMO ({results.movies.length})
                                                </h3>
                                                {results.movies.slice(0, 5).map((movie: any) => (
                                                    <button
                                                        key={movie._id}
                                                        onClick={() => handleSelect(`/movies/${movie.slug}`)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#333333] transition-colors group"
                                                    >
                                                        <div className="w-10 h-14 rounded overflow-hidden bg-[#333333] flex-shrink-0">
                                                            {movie.posterUrl ? (
                                                                <Image src={movie.posterUrl} alt={movie.title} fill sizes="40px" className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Film className="w-5 h-5 text-gray-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                                                {movie.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span>{movie.releaseDate?.split("-")[0]}</span>
                                                                {movie.rating && (
                                                                    <span className="flex items-center gap-1 text-[#E50914]">
                                                                        <Star className="w-3 h-3 fill-current" />
                                                                        {movie.rating.toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {movie.isPremium && (
                                                            <span className="px-2 py-1 bg-[#E50914]/20 text-[#E50914] text-xs font-bold rounded">
                                                                VIP
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Series */}
                                        {results.series.length > 0 && (
                                            <div>
                                                <h3 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                    <Tv className="w-3 h-3 text-green-400" />
                                                    MUSALSAL ({results.series.length})
                                                </h3>
                                                {results.series.slice(0, 5).map((show: any) => (
                                                    <button
                                                        key={show._id}
                                                        onClick={() => handleSelect(`/series/${show.slug}`)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#333333] transition-colors group"
                                                    >
                                                        <div className="w-10 h-14 rounded overflow-hidden bg-[#333333] flex-shrink-0">
                                                            {show.posterUrl ? (
                                                                <Image src={show.posterUrl} alt={show.title} fill sizes="40px" className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Tv className="w-5 h-5 text-gray-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="font-medium text-white group-hover:text-green-400 transition-colors">
                                                                {show.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {show.numberOfSeasons} Seasons
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* No Results */}
                                {query.length >= 2 && !isLoading && !hasResults && (
                                    <div className="p-8 text-center">
                                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                        <p className="text-gray-400">
                                            Lama helin natiijo "{query}"
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Isku day erey kale
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-3 bg-[#0d1b2a] border-t border-[#333333] flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-[#333333] rounded text-[10px]">↵</kbd>
                                        select
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-[#333333] rounded text-[10px]">esc</kbd>
                                        close
                                    </span>
                                </div>
                                <span>Powered by Fanbroj</span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
