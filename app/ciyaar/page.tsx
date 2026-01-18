"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/EmptyState";
import { AdSlot } from "@/components/AdSlot";
import { useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

type FilterStatus = "all" | "live" | "upcoming" | "finished";

function ArchiveContent() {
    const searchParams = useSearchParams();
    const leagueIdParam = searchParams.get("league");
    const [filter, setFilter] = useState<FilterStatus>("all");
    const matches = useQuery(api.matches.listMatches, {
        status: filter === "all" ? undefined : filter as any,
        leagueId: leagueIdParam || undefined
    });

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black mb-2 uppercase italic tracking-tighter">
                        Daawo Ciyaar Live iyo Jadwalka Maanta
                    </h1>
                    <p className="text-text-secondary text-lg">Halkan kala soco dhammaan ciyaaraha live-ka ah iyo natiijooyinka kubadda cagta.</p>
                </div>

                {/* Filters */}
                <div className="flex border border-border-strong rounded-lg overflow-hidden bg-stadium-elevated">
                    {(["all", "live", "upcoming", "finished"] as FilterStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={cn(
                                "px-4 py-2 text-xs font-black uppercase transition-colors tracking-widest",
                                filter === status
                                    ? "bg-accent-green text-black"
                                    : "hover:bg-stadium-hover text-text-muted hover:text-white"
                            )}
                        >
                            {status === "all" ? "DHAMMAAN" : status === "live" ? "LIVE" : status === "upcoming" ? "SOO SOCDA" : "DHAMAAD"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-border-strong w-full" />

            <AdSlot slotKey="archive_sidebar" className="my-6" />

            {matches === undefined ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
                </div>
            ) : matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {matches.map((match) => (
                        <MatchCard key={match._id} {...match} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    message="Lama helin wax ciyaaro ah."
                    hint="Fadlan isku day filter kale."
                />
            )}
        </>
    );
}

export default function CiyaarArchivePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div></div>}>
            <ArchiveContent />
        </Suspense>
    );
}
