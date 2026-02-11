"use client";

import useSWR from "swr";
import { Users, Loader2, Shirt } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MatchLineupProps {
    matchId: string;
    teamA: string;
    teamB: string;
    teamALogo?: string | null;
    teamBLogo?: string | null;
}

interface Player {
    number: number;
    name: string;
    position: { x: number; y: number };
}

// Default formation positions (4-3-3)
const defaultFormation433: Player[] = [
    { number: 1, name: "Goalkeeper", position: { x: 50, y: 90 } },
    // Defenders
    { number: 2, name: "Right Back", position: { x: 85, y: 70 } },
    { number: 4, name: "Center Back", position: { x: 65, y: 75 } },
    { number: 5, name: "Center Back", position: { x: 35, y: 75 } },
    { number: 3, name: "Left Back", position: { x: 15, y: 70 } },
    // Midfielders
    { number: 6, name: "Midfielder", position: { x: 70, y: 50 } },
    { number: 8, name: "Midfielder", position: { x: 50, y: 45 } },
    { number: 10, name: "Midfielder", position: { x: 30, y: 50 } },
    // Forwards
    { number: 7, name: "Right Wing", position: { x: 80, y: 25 } },
    { number: 9, name: "Striker", position: { x: 50, y: 20 } },
    { number: 11, name: "Left Wing", position: { x: 20, y: 25 } },
];

export function MatchLineup({ matchId, teamA, teamB, teamALogo, teamBLogo }: MatchLineupProps) {
    const [activeTeam, setActiveTeam] = useState<"home" | "away">("home");
    const { data: match } = useSWR(`/api/matches?id=${matchId}`, fetcher);

    if (match === undefined) {
        return (
            <div className="bg-[#333333] rounded-xl border border-[#2a4a6c] p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-6 h-6 animate-spin text-[#E50914]" />
            </div>
        );
    }

    // Get lineup from match or use placeholder
    const lineup = (match as any)?.lineup || null;
    const homeLineup = lineup?.home || { formation: "4-3-3", players: defaultFormation433, substitutes: [] };
    const awayLineup = lineup?.away || { formation: "4-3-3", players: defaultFormation433, substitutes: [] };

    const currentLineup = activeTeam === "home" ? homeLineup : awayLineup;
    const currentTeamName = activeTeam === "home" ? teamA : teamB;

    return (
        <div className="bg-[#333333] rounded-xl border border-[#2a4a6c] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#2a4a6c]">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-[#E50914]" />
                    <h3 className="text-lg font-bold text-white">Lineup</h3>
                </div>

                {/* Team Selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTeam("home")}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                            activeTeam === "home"
                                ? "bg-blue-500 text-white"
                                : "bg-[#2a4a6c] text-gray-300 hover:bg-[#3a5a7c]"
                        )}
                    >
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                            {teamA.charAt(0)}
                        </div>
                        <span className="truncate">{teamA}</span>
                    </button>
                    <button
                        onClick={() => setActiveTeam("away")}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                            activeTeam === "away"
                                ? "bg-red-500 text-white"
                                : "bg-[#2a4a6c] text-gray-300 hover:bg-[#3a5a7c]"
                        )}
                    >
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                            {teamB.charAt(0)}
                        </div>
                        <span className="truncate">{teamB}</span>
                    </button>
                </div>
            </div>

            {/* Formation Display */}
            <div className="p-4 border-b border-[#2a4a6c] text-center bg-[#2a4a6c]/30">
                <span className="text-2xl font-black text-[#E50914]">
                    {currentLineup.formation}
                </span>
                <p className="text-xs text-gray-400 mt-1">{currentTeamName} Formation</p>
            </div>

            {/* Pitch Visualization */}
            <div className="p-4">
                <div className="pitch relative bg-gradient-to-b from-green-700 to-green-800 rounded-xl aspect-[3/4] overflow-hidden shadow-inner">
                    {/* Pitch Lines */}
                    <div className="absolute inset-2 border-2 border-white/30 rounded-lg">
                        {/* Center circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/30 rounded-full" />
                        {/* Center line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30" />
                        {/* Center dot */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />

                        {/* Top penalty area */}
                        <div className="absolute top-0 left-1/4 right-1/4 h-[18%] border-2 border-t-0 border-white/30" />
                        <div className="absolute top-0 left-[35%] right-[35%] h-[8%] border-2 border-t-0 border-white/30" />

                        {/* Bottom penalty area */}
                        <div className="absolute bottom-0 left-1/4 right-1/4 h-[18%] border-2 border-b-0 border-white/30" />
                        <div className="absolute bottom-0 left-[35%] right-[35%] h-[8%] border-2 border-b-0 border-white/30" />
                    </div>

                    {/* Players */}
                    {currentLineup.players.map((player: Player, index: number) => (
                        <div
                            key={player.number}
                            className="player absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                            style={{
                                top: `${player.position.y}%`,
                                left: `${player.position.x}%`
                            }}
                        >
                            <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg transition-transform group-hover:scale-110",
                                activeTeam === "home" ? "bg-blue-400" : "bg-red-400"
                            )}>
                                {player.number}
                            </div>
                            <p className="text-[10px] text-white text-center mt-1 whitespace-nowrap font-medium drop-shadow-lg">
                                {player.name.split(" ").pop()}
                            </p>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                #{player.number} {player.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Substitutes */}
            {currentLineup.substitutes && currentLineup.substitutes.length > 0 && (
                <div className="p-4 border-t border-[#2a4a6c]">
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <Shirt size={14} />
                        Substitutes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {currentLineup.substitutes.map((player: { number: number; name: string }) => (
                            <div
                                key={player.number}
                                className="flex items-center gap-2 bg-[#2a4a6c] px-3 py-1.5 rounded-full text-sm"
                            >
                                <span className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    activeTeam === "home" ? "bg-blue-500/30 text-blue-300" : "bg-red-500/30 text-red-300"
                                )}>
                                    {player.number}
                                </span>
                                <span className="text-gray-300">{player.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No lineup message */}
            {!lineup && (
                <div className="p-4 text-center border-t border-[#2a4a6c]">
                    <p className="text-gray-500 text-xs">
                        Official lineup will be announced closer to kickoff
                    </p>
                </div>
            )}
        </div>
    );
}
