"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Loader2, Trophy, Calendar, Film, Tv } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SearchBox() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Use unified search query
    // @ts-ignore - api.search might not be generated yet in types
    const results = useQuery(api.search.searchAll, { query: query.length >= 2 ? query : "" });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (path: string) => {
        setIsOpen(false);
        setQuery("");
        router.push(path);
    };

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
                    className="w-full bg-stadium-elevated border border-border-strong rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 transition-all placeholder:text-text-muted/50"
                />
                {query.length >= 2 && results === undefined && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && query.length >= 2 && hasResults && (
                <div className="absolute top-full mt-2 w-full bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto ring-1 ring-black/50">

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
                                    onClick={() => handleSelect(`/match/${match.slug}`)}
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
                                    onClick={() => handleSelect(`/movies/${movie.slug}`)}
                                    className="w-full text-left p-3 hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0 group bg-[#1a1a2e]"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-stadium-dark border border-white/10 overflow-hidden flex-shrink-0 group-hover:border-accent-blue/30 transition-colors relative">
                                        <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
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
                                    onClick={() => handleSelect(`/series/${show.slug}`)}
                                    className="w-full text-left p-3 hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0 group bg-[#1a1a2e]"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-stadium-dark border border-white/10 overflow-hidden flex-shrink-0 group-hover:border-accent-green/30 transition-colors relative">
                                        <img src={show.posterUrl} alt={show.title} className="w-full h-full object-cover" />
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
                <div className="absolute top-full mt-2 w-full bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl p-6 text-center z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-text-muted">Lama helin wax ciyaar, filim ama musalsal ah oo la mid ah "{query}"</p>
                </div>
            )}
        </div>
    );
}
