"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Loader2, Trophy, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SearchBox() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const results = useQuery(api.matches.searchMatches, { query: query.length >= 2 ? query : "" });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (slug: string) => {
        setIsOpen(false);
        setQuery("");
        router.push(`/match/${slug}`);
    };

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
                    placeholder="Search ciyaar..."
                    className="w-full bg-stadium-elevated border border-border-strong rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/20 transition-all placeholder:text-text-muted/50"
                />
                {query.length >= 2 && results === undefined && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && query.length >= 2 && results && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-stadium-elevated border border-border-strong rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-border-strong/50 bg-stadium-dark/30">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest px-2">
                            Ciyaarta natiijada
                        </span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                        {results.map((match) => (
                            <button
                                key={match._id}
                                onClick={() => handleSelect(match.slug)}
                                className="w-full text-left p-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-border-strong/30 last:border-0 group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-stadium-dark border border-border-strong flex items-center justify-center flex-shrink-0 group-hover:border-accent-green/30 transition-colors">
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
                                        <span className="w-1 h-1 rounded-full bg-border-strong" />
                                        <div className="flex items-center gap-1 text-[10px] text-text-muted">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(match.kickoffAt).toLocaleDateString()}
                                        </div>
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
                    <div className="p-2 bg-stadium-dark/30 border-t border-border-strong/50">
                        <p className="text-[10px] text-center text-text-muted">
                            Si aad u hesho natiijooyin badan, fadlan ku qor magaca buuxifa
                        </p>
                    </div>
                </div>
            )}

            {isOpen && query.length >= 2 && results && results.length === 0 && (
                <div className="absolute top-full mt-2 w-full bg-stadium-elevated border border-border-strong rounded-xl shadow-2xl p-6 text-center z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-text-muted">Lama helin wax ciyaar ah oo la mid ah "{query}"</p>
                </div>
            )}
        </div>
    );
}
