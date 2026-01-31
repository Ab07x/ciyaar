"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface MatchStatsProps {
    matchId: Id<"matches">;
    teamA: string;
    teamB: string;
}

interface StatBarProps {
    label: string;
    homeValue: number;
    awayValue: number;
    suffix?: string;
}

function StatBar({ label, homeValue, awayValue, suffix = "" }: StatBarProps) {
    const total = homeValue + awayValue || 1;
    const homePercent = (homeValue / total) * 100;
    const awayPercent = (awayValue / total) * 100;

    return (
        <div className="stat-bar">
            <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-white">{homeValue}{suffix}</span>
                <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
                <span className="font-bold text-white">{awayValue}{suffix}</span>
            </div>
            <div className="flex h-2 gap-1 rounded-full overflow-hidden bg-[#1a1a2e]">
                <div
                    className="bg-blue-500 transition-all duration-700 ease-out rounded-l-full"
                    style={{ width: `${homePercent}%` }}
                />
                <div
                    className="bg-red-500 transition-all duration-700 ease-out rounded-r-full"
                    style={{ width: `${awayPercent}%` }}
                />
            </div>
        </div>
    );
}

export function MatchStats({ matchId, teamA, teamB }: MatchStatsProps) {
    // Try to fetch stats from the match
    const match = useQuery(api.matches.getMatchById, { id: matchId });

    if (match === undefined) {
        return (
            <div className="bg-[#333333] rounded-xl border border-[#2a4a6c] p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#f0ad4e]" />
            </div>
        );
    }

    // Get stats from match or use defaults
    const stats = (match as any)?.stats || null;

    // If no stats available, show placeholder
    if (!stats) {
        return (
            <div className="bg-[#333333] rounded-xl border border-[#2a4a6c] p-6">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-[#f0ad4e]" />
                    <h3 className="text-lg font-bold text-white">Match Statistics</h3>
                </div>

                {/* Team Headers */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2a4a6c]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-400 font-bold text-xs">{teamA.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-white">{teamA}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{teamB}</span>
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 font-bold text-xs">{teamB.charAt(0)}</span>
                        </div>
                    </div>
                </div>

                {/* Placeholder Stats */}
                <div className="space-y-5">
                    <StatBar label="Possession" homeValue={50} awayValue={50} suffix="%" />
                    <StatBar label="Shots" homeValue={0} awayValue={0} />
                    <StatBar label="Shots on Target" homeValue={0} awayValue={0} />
                    <StatBar label="Corners" homeValue={0} awayValue={0} />
                    <StatBar label="Fouls" homeValue={0} awayValue={0} />
                </div>

                <p className="text-center text-gray-500 text-xs mt-6 pt-4 border-t border-[#2a4a6c]">
                    Statistics will update during the match
                </p>
            </div>
        );
    }

    const statItems = [
        { label: "Possession", home: stats.possession?.home || 50, away: stats.possession?.away || 50, suffix: "%" },
        { label: "Shots", home: stats.shots?.home || 0, away: stats.shots?.away || 0 },
        { label: "Shots on Target", home: stats.shotsOnTarget?.home || 0, away: stats.shotsOnTarget?.away || 0 },
        { label: "Corners", home: stats.corners?.home || 0, away: stats.corners?.away || 0 },
        { label: "Fouls", home: stats.fouls?.home || 0, away: stats.fouls?.away || 0 },
        { label: "Yellow Cards", home: stats.yellowCards?.home || 0, away: stats.yellowCards?.away || 0 },
        { label: "Red Cards", home: stats.redCards?.home || 0, away: stats.redCards?.away || 0 },
        { label: "Offsides", home: stats.offsides?.home || 0, away: stats.offsides?.away || 0 },
    ];

    return (
        <div className="bg-[#333333] rounded-xl border border-[#2a4a6c] p-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-[#f0ad4e]" />
                <h3 className="text-lg font-bold text-white">Match Statistics</h3>
            </div>

            {/* Team Headers */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2a4a6c]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-400 font-bold text-xs">{teamA.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{teamA}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{teamB}</span>
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 font-bold text-xs">{teamB.charAt(0)}</span>
                    </div>
                </div>
            </div>

            {/* Stats List */}
            <div className="space-y-5">
                {statItems.map((stat) => (
                    <StatBar
                        key={stat.label}
                        label={stat.label}
                        homeValue={stat.home}
                        awayValue={stat.away}
                        suffix={stat.suffix}
                    />
                ))}
            </div>
        </div>
    );
}
