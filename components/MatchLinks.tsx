"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

export function MatchLinks({ limit = 3 }: { limit?: number }) {
    const matches = useQuery(api.matches.getMatchesByStatus);

    if (!matches) return null;

    const allMatches = [...matches.live, ...matches.upcoming];
    const displayMatches = allMatches.slice(0, limit);

    if (displayMatches.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayMatches.map((match) => (
                <Link
                    key={match._id}
                    href={`/match/${match.slug}`}
                    className="flex items-center gap-3 p-4 bg-stadium-dark border border-border-strong rounded-xl hover:border-accent-green transition-all group"
                >
                    <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green group-hover:bg-accent-green group-hover:text-black transition-colors">
                        <PlayCircle size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-none mb-1">
                            {match.teamA} vs {match.teamB}
                        </p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">
                            {match.leagueName}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
