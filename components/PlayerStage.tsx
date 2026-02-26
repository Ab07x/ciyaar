"use client";

import { useState } from "react";
import { Badge } from "./Badge";
import { CountdownTimer } from "./CountdownTimer";
import { StreamPlayer } from "./StreamPlayer";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@/lib/utils";
import { MessageSquare, Crown, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Embed { label: string; url: string; type?: "m3u8" | "iframe" | "video" | "auto"; isProtected?: boolean; }

interface PlayerStageProps {
    match: {
        _id: string;
        status: "live" | "upcoming" | "finished";
        kickoffAt: number;
        embeds: Embed[];
        isPremium: boolean;
        requiredPlan?: "match" | "weekly" | "monthly" | "yearly" | null;
        summary?: string | null;
        thumbnailUrl?: string | null;
    };
    settings: {
        whatsappNumber: string;
        freeMoviePreviewMinutes?: number;
        freeMovieTimerSpeedMultiplier?: number;
    };
    className?: string;
}

// Background image for loading state
const LOADING_POSTER = "/img/Gemini_Generated_Image_w45vpxw45vpxw45v.png";
const DEFAULT_FREE_MATCH_PREVIEW_MINUTES = 26;
const DEFAULT_FREE_MATCH_TIMER_SPEED_MULTIPLIER = 12;

export function PlayerStage({ match, settings, className }: PlayerStageProps) {
    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const { isPremium } = useUser();
    const [isTimerFinished, setIsTimerFinished] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const isPreviewMode = !!match.isPremium && !isPremium;
    const freePreviewMinutesRaw = Number(settings?.freeMoviePreviewMinutes);
    const freePreviewMinutes = Number.isFinite(freePreviewMinutesRaw) && freePreviewMinutesRaw > 0
        ? Math.min(DEFAULT_FREE_MATCH_PREVIEW_MINUTES, freePreviewMinutesRaw)
        : DEFAULT_FREE_MATCH_PREVIEW_MINUTES;
    const freeTimerSpeedMultiplierRaw = Number(settings?.freeMovieTimerSpeedMultiplier);
    const freeTimerSpeedMultiplier = Number.isFinite(freeTimerSpeedMultiplierRaw) && freeTimerSpeedMultiplierRaw > 0
        ? Math.max(DEFAULT_FREE_MATCH_TIMER_SPEED_MULTIPLIER, freeTimerSpeedMultiplierRaw)
        : DEFAULT_FREE_MATCH_TIMER_SPEED_MULTIPLIER;
    const pricingHref = `/pricing?src=match-preview&content=match&id=${encodeURIComponent(match._id)}&plan=match`;
    const whatsappNumber = String(settings?.whatsappNumber || "+252618274188").replace(/\D/g, "");
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Salaan Fanbroj, waxaan rabaa Match Pass/VIP si aan u sii daawado ciyaar live. Match: ${match._id}`
    )}`;

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Upcoming
    if (match.status === "upcoming") {
        return (
            <div className={cn("player-stage bg-stadium-elevated flex flex-col items-center justify-center p-8", className)}>
                <Badge variant="upcoming" className="mb-4" />
                {!isTimerFinished && <h3 className="text-xl font-bold mb-6">Ciyaartu weli ma bilaaban</h3>}
                <CountdownTimer kickoffAt={match.kickoffAt} onComplete={() => setIsTimerFinished(true)} />
            </div>
        );
    }

    // Finished
    if (match.status === "finished") {
        return (
            <div className={cn("player-stage bg-stadium-elevated flex flex-col items-center justify-center p-8 text-center", className)}>
                <Badge variant="finished" className="mb-4" />
                <h3 className="text-2xl font-bold mb-4">Ciyaartu way dhamaatay</h3>
                {match.summary && <p className="text-text-secondary max-w-lg mx-auto mb-6">{match.summary}</p>}
                <div className="bg-stadium-hover p-6 rounded-xl border border-border-subtle"><p className="text-text-muted italic">Natiijooyinka iyo dib-u-eegista ciyaarta ayaa lasoo gelin doonaa dhowaan.</p></div>
            </div>
        );
    }

    // Live
    const activeEmbed = match.embeds[activeEmbedIndex];
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="player-stage bg-black rounded-2xl overflow-hidden border border-border-subtle shadow-2xl">
                {activeEmbed?.url ? (
                    <StreamPlayer
                        key={`${activeEmbed.url}-${refreshKey}`}
                        source={{
                            url: activeEmbed.url,
                            label: activeEmbed.label,
                            type: activeEmbed.type || "auto",
                            isProtected: activeEmbed.isProtected
                        }}
                        loadingPoster={match.thumbnailUrl || LOADING_POSTER}
                        showRefreshMessage={true}
                        className="absolute inset-0"
                        trackParams={{
                            contentType: "match",
                            contentId: match._id,
                        }}
                        conversionGate={{
                            enabled: isPreviewMode,
                            previewSeconds: freePreviewMinutes * 60,
                            reachedDailyLimit: false,
                            timerSpeedMultiplier: freeTimerSpeedMultiplier,
                            ctaHref: "/pricing",
                            forceRedirectOnLock: false,
                            contentLabel: "ciyaartan live",
                            paywallTitle: "Waqtiga free-ga ee ciyaartan wuu dhammaaday",
                            paywallMessage: "Si aad u sii wadato daawashada ciyaarta tooska ah, iibso Match Pass ama VIP hadda.",
                            primaryCtaLabel: "IIBSO MATCH PASS",
                            whatsappMessage: "Salaan Fanbroj, waxaan rabaa Match Pass si aan u sii daawado ciyaartan live.",
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-text-muted">Lama hayo linkiyadii ciyaarta.</div>
                )}
            </div>

            {isPreviewMode && (
                <p className="text-center text-xs text-yellow-300 -mt-1">
                    Free Preview: {freePreviewMinutes} daqiiqo • Timer x{freeTimerSpeedMultiplier}
                </p>
            )}

            {/* Refresh Button & Server Switcher */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                {/* Refresh Button - Quick stream re-init */}
                <button
                    type="button"
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-500 hover:to-green-600 transition-all active:scale-95 shadow-lg"
                >
                    <RefreshCw size={18} />
                    <span className="hidden sm:inline">Refresh / Cusboonaysii</span>
                    <span className="sm:hidden">Refresh</span>
                </button>

                {/* Server Switcher */}
                {match.embeds.length > 1 && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Bedel Link:</span>
                        {match.embeds.map((embed, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setActiveEmbedIndex(index)}
                                className={cn(
                                    "px-4 py-2 text-sm font-semibold rounded-md border transition-all",
                                    activeEmbedIndex === index
                                        ? "bg-accent-green text-black border-accent-green"
                                        : "bg-stadium-elevated text-text-secondary border-border-subtle hover:border-text-muted"
                                )}
                            >
                                {embed.label || `Link ${index + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isPreviewMode && (
                <div className="bg-[#061a2d]/95 border border-[#1b4d86] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-sm sm:text-base">Ramadan — Ciyaarta sii wad</p>
                        <p className="text-gray-300 text-xs sm:text-sm">Iibso Match Pass hadda — isla markiiba furmaa. WhatsApp 24/7.</p>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                        <Link
                            href="/pricing"
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Crown size={16} />
                            MATCH PASS
                        </Link>
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white font-black text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <MessageSquare size={16} />
                            WhatsApp
                        </a>
                    </div>
                </div>
            )}

            {/* Help Message */}
            <div className="bg-gradient-to-r from-[#1a3a5c] to-[#0d1b2a] border border-[#2a4a6c] rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="text-sm">
                    <p className="text-white/90 font-medium">Hadii Muqaalka Kaa Cuslaado Ama Cilad Ku Timaado, Fadlan Riix "Refresh" Batoonka 🔄</p>
                    <p className="text-white/60 mt-1">If the video freezes or has issues, please click the "Refresh" button above</p>
                </div>
            </div>
        </div>
    );
}
