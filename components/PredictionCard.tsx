"use client";

import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Trophy, CheckCircle2, XCircle, Clock, LogIn } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PredictionCardProps {
    matchId: string;
    teamA: string;
    teamB: string;
    kickoffAt: number;
    status: string;
}

export function PredictionCard({ matchId, teamA, teamB, kickoffAt, status }: PredictionCardProps) {
    const { userId } = useUser();

    const { data: userPrediction } = useSWR(
        `/api/predictions?matchId=${matchId}&userId=${userId || ""}`,
        fetcher
    );
    const { data: stats } = useSWR(`/api/predictions/stats?matchId=${matchId}`, fetcher);

    const now = Date.now();
    const isLocked = status !== "upcoming" && kickoffAt <= now;

    const handleVote = async (prediction: "home" | "draw" | "away") => {
        if (!userId) return;
        if (isLocked) return;
        try {
            await fetch("/api/predictions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId, prediction, userId }),
            });
            mutate(`/api/predictions?matchId=${matchId}&userId=${userId || ""}`);
            mutate(`/api/predictions/stats?matchId=${matchId}`);
        } catch (error) {
            console.error("Failed to submit prediction", error);
        }
    };

    if (stats === undefined) return <div className="h-48 bg-stadium-card rounded-xl animate-pulse" />;

    const hasVoted = !!userPrediction;

    return (
        <div className="bg-stadium-card border border-border-subtle rounded-xl overflow-hidden shadow-lg">
            <div className="bg-stadium-elevated p-4 border-b border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="text-accent-gold w-5 h-5" />
                    <h3 className="font-bold text-lg">Saadaali & Guuleyso</h3>
                </div>
                {isLocked && (
                    <span className="text-xs font-bold text-text-muted bg-stadium-dark px-2 py-1 rounded flex items-center gap-1">
                        <Clock size={12} />
                        XIRAN
                    </span>
                )}
            </div>

            <div className="p-4 space-y-4">
                {!hasVoted && !isLocked && (
                    <p className="text-sm text-text-secondary text-center mb-2">
                        {userId ? "Saadaali cidda badinaysa si aad dhibco u hesho!" : "Soo gal si aad u sadaalisid"}
                    </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                    {/* HOME */}
                    <PredictionButton
                        label={teamA}
                        percent={stats.home}
                        isSelected={userPrediction?.prediction === "home"}
                        onClick={() => handleVote("home")}
                        disabled={isLocked || !userId}
                        showStats={hasVoted || isLocked}
                    />

                    {/* DRAW */}
                    <PredictionButton
                        label="Barbaro"
                        percent={stats.draw}
                        isSelected={userPrediction?.prediction === "draw"}
                        onClick={() => handleVote("draw")}
                        disabled={isLocked || !userId}
                        showStats={hasVoted || isLocked}
                        variant="secondary"
                    />

                    {/* AWAY */}
                    <PredictionButton
                        label={teamB}
                        percent={stats.away}
                        isSelected={userPrediction?.prediction === "away"}
                        onClick={() => handleVote("away")}
                        disabled={isLocked || !userId}
                        showStats={hasVoted || isLocked}
                    />
                </div>

                {!userId && (
                    <div className="text-center mt-2">
                        <Link href="/login">
                            <Button variant="ghost" size="sm" leftIcon={<LogIn size={14} />}>
                                Log in to Predict
                            </Button>
                        </Link>
                    </div>
                )}

                {hasVoted && (
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">Saadaashaada:</span>
                            <span className={cn(
                                "font-bold flex items-center gap-1",
                                userPrediction.status === "correct" ? "text-accent-green" :
                                    userPrediction.status === "incorrect" ? "text-accent-red" : "text-text-primary"
                            )}>
                                {userPrediction.prediction === "home" ? teamA : userPrediction.prediction === "away" ? teamB : "Barbaro"}
                                {userPrediction.status === "correct" && <CheckCircle2 size={16} />}
                                {userPrediction.status === "incorrect" && <XCircle size={16} />}
                                {userPrediction.status === "pending" && <span className="text-xs text-text-muted bg-white/10 px-1.5 py-0.5 rounded ml-1">SUGAYAA</span>}
                            </span>
                        </div>
                        {userPrediction.pointsAwarded && (
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-text-muted">Dhibcaha:</span>
                                <span className="font-bold text-accent-gold">+{userPrediction.pointsAwarded} XP</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

interface PredictionButtonProps {
    label: string;
    percent: number;
    isSelected: boolean;
    onClick: () => void;
    disabled: boolean;
    showStats: boolean;
    variant?: "primary" | "secondary";
}

function PredictionButton({ label, percent, isSelected, onClick, disabled, showStats, variant = "primary" }: PredictionButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-24",
                isSelected
                    ? "bg-accent-green/20 border-accent-green ring-1 ring-accent-green"
                    : "bg-white/5 border-white/10 hover:bg-white/10",
                disabled && !isSelected && "opacity-50 cursor-not-allowed hover:bg-white/5"
            )}
        >
            <span className={cn("text-xs font-bold text-center line-clamp-2 w-full mb-1", isSelected ? "text-accent-green" : "text-text-primary")}>
                {label}
            </span>

            {showStats ? (
                <div className="text-lg font-black">{percent}%</div>
            ) : (
                <div className={cn("w-4 h-4 rounded-full border-2 mt-1", isSelected ? "bg-accent-green border-accent-green" : "border-text-muted")} />
            )}
        </button>
    );
}
