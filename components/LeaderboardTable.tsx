"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Flame, TrendingUp } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LeaderboardTable({ limit = 10 }: { limit?: number }) {
    const { userId } = useUser();
    const { data: leaderboard } = useSWR(`/api/predictions/leaderboard?limit=${limit}`, fetcher);
    const { data: myStats } = useSWR(
        userId ? `/api/predictions/stats?userId=${userId}` : null,
        fetcher
    );

    if (leaderboard === undefined) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-stadium-card rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="text-center py-12 bg-stadium-card rounded-xl border border-white/5">
                <Trophy className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Hogaaminta Waa Banaan Tahay</h3>
                <p className="text-text-secondary">Noqo qofka ugu horeeya ee dhibco keena!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-stadium-card border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stadium-elevated text-text-secondary text-sm uppercase tracking-wider border-b border-white/5">
                                <th className="p-4 w-16 text-center">#</th>
                                <th className="p-4">User</th>
                                <th className="p-4 text-center">Streak</th>
                                <th className="p-4 text-right">Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leaderboard.map((entry, index) => {
                                const rank = index + 1;
                                const isMe = (userId && entry.userId === userId);

                                return (
                                    <tr
                                        key={entry._id}
                                        className={cn(
                                            "transition-colors hover:bg-white/5",
                                            isMe && "bg-accent-green/10 hover:bg-accent-green/20"
                                        )}
                                    >
                                        <td className="p-4 text-center">
                                            {rank === 1 && <Trophy className="w-6 h-6 text-yellow-400 mx-auto" />}
                                            {rank === 2 && <Medal className="w-6 h-6 text-gray-400 mx-auto" />}
                                            {rank === 3 && <Medal className="w-6 h-6 text-amber-600 mx-auto" />}
                                            {rank > 3 && <span className="font-mono font-bold text-text-secondary">#{rank}</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stadium-elevated to-stadium-dark flex items-center justify-center border border-white/10 text-xs font-bold uppercase">
                                                    {entry.username.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className={cn("font-bold", isMe ? "text-accent-green" : "text-text-primary")}>
                                                        {isMe ? "Adiga" : entry.username}
                                                    </div>
                                                    <div className="text-xs text-text-muted flex items-center gap-1">
                                                        {entry.correctPredictionsCount} saxay
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {entry.streakCount > 2 && (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-bold">
                                                    <Flame size={12} fill="currentColor" />
                                                    {entry.streakCount}
                                                </div>
                                            )}
                                            {entry.streakCount <= 2 && <span className="text-text-muted text-sm">-</span>}
                                        </td>
                                        <td className="p-4 text-right font-black text-lg">
                                            {entry.totalPoints.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Stat Summary (Floating or Fixed if logged in) */}
            {myStats && (
                <div className="bg-gradient-to-r from-stadium-elevated to-stadium-dark border border-accent-green/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent-green/20 rounded-lg text-accent-green">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-text-muted">Dhibcahaaga</div>
                            <div className="text-2xl font-black text-white">{myStats.totalPoints}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-text-muted">Darajada</div>
                        <div className="text-xl font-bold text-accent-green">#{leaderboard.findIndex(l => l.userId === myStats.userId) + 1 || "100+"}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
