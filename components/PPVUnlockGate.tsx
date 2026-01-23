"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import { Lock, Play, Tv, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

interface PPVUnlockGateProps {
    contentType: "match" | "movie";
    contentId: string;
    contentTitle: string;
    children: React.ReactNode;
    onUnlock?: () => void;
}

// Default ad duration (seconds) - can be overridden by ad config
const DEFAULT_AD_DURATION = 15;

export function PPVUnlockGate({
    contentType,
    contentId,
    contentTitle,
    children,
    onUnlock,
}: PPVUnlockGateProps) {
    const { userId, isPremium, isLoading: userLoading } = useUser();
    const [watchingAd, setWatchingAd] = useState(false);
    const [adProgress, setAdProgress] = useState(0);
    const [currentAdsWatched, setCurrentAdsWatched] = useState(0);
    const adContainerRef = useRef<HTMLDivElement>(null);
    const [deviceId] = useState(() => {
        if (typeof window === "undefined") return "";
        let id = localStorage.getItem("device_id");
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("device_id", id);
        }
        return id;
    });

    // Queries
    const accessCheck = useQuery(
        api.ppv.checkAccess,
        userId
            ? { userId: userId, contentType, contentId }
            : { contentType, contentId }
    );

    const ppvAd = useQuery(api.ads.getAdBySlot, { slotKey: "ppv_unlock" });

    // Mutations
    const recordAdWatch = useMutation(api.ppv.recordAdWatch);
    const trackAdImpression = useMutation(api.ppv.trackAdImpression);

    // Handle ad completion
    const handleAdComplete = useCallback(async () => {
        if (!userId) return;

        // Track ad impression
        await trackAdImpression({
            userId: userId,
            deviceId,
            adType: "ppv_unlock",
            adSlot: "ppv_preroll",
            pageType: contentType,
            contentId,
        });

        const result = await recordAdWatch({
            userId: userId,
            deviceId,
            contentType,
            contentId,
        });

        setWatchingAd(false);
        setAdProgress(0);

        if (result.success && result.adsWatched !== undefined) {
            setCurrentAdsWatched(result.adsWatched);
        }

        if (result.isUnlocked && onUnlock) {
            onUnlock();
        }
    }, [userId, deviceId, contentType, contentId, recordAdWatch, trackAdImpression, onUnlock]);

    // Get ad duration from config or use default
    const adDuration = ppvAd?.videoDuration || DEFAULT_AD_DURATION;

    // Load and show ad based on type
    const startWatchingAd = useCallback(() => {
        setWatchingAd(true);
        setAdProgress(0);

        // Load AdSense ad if available
        if ((ppvAd?.network === "adsense" || ppvAd?.network === "ppv") && ppvAd?.adsenseClient && adContainerRef.current) {
            try {
                (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                (window as any).adsbygoogle.push({});
            } catch (e) {
                console.error("AdSense error:", e);
            }
        }

        // Timer for ad duration
        const duration = ppvAd?.videoDuration || DEFAULT_AD_DURATION;
        const interval = setInterval(() => {
            setAdProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    handleAdComplete();
                    return 100;
                }
                return prev + 100 / duration;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [handleAdComplete, ppvAd]);

    // Loading state
    if (userLoading || accessCheck === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-stadium-elevated rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
            </div>
        );
    }

    // If user has access or content is not PPV, show children
    if (accessCheck.hasAccess) {
        return <>{children}</>;
    }

    // PPV Gate UI
    const ppvConfig = accessCheck.config;
    const adsWatched = currentAdsWatched;
    const adsRemaining = ppvConfig ? ppvConfig.minAdsRequired - adsWatched : 0;

    return (
        <div className="relative min-h-[400px] bg-gradient-to-b from-stadium-dark to-stadium-elevated rounded-2xl overflow-hidden">
            {/* Blurred preview background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />

            {/* Ad watching overlay */}
            {watchingAd && (
                <div className="absolute inset-0 z-20 bg-black flex flex-col">
                    {/* Ad container */}
                    <div
                        ref={adContainerRef}
                        className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] relative overflow-hidden"
                    >
                        {/* Background decoration */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-green rounded-full blur-3xl" />
                            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-gold rounded-full blur-3xl" />
                        </div>

                        {/* Video Ad (direct URL) */}
                        {ppvAd?.videoUrl ? (
                            <video
                                src={ppvAd.videoUrl}
                                autoPlay
                                muted={false}
                                playsInline
                                className="w-full h-full object-contain relative z-10"
                                onEnded={() => {
                                    if (adProgress < 100) setAdProgress(100);
                                }}
                            />
                        ) : ppvAd?.vastUrl ? (
                            // VAST/VPAID - render iframe for VAST player
                            <iframe
                                src={ppvAd.vastUrl}
                                className="w-full h-full border-0 relative z-10"
                                allow="autoplay"
                            />
                        ) : ppvAd?.codeHtml ? (
                            // Custom HTML ad code
                            <div
                                className="w-full h-full flex items-center justify-center relative z-10"
                                dangerouslySetInnerHTML={{ __html: ppvAd.codeHtml }}
                            />
                        ) : ppvAd?.adsenseClient && ppvAd?.adsenseSlot ? (
                            // AdSense
                            <ins
                                className="adsbygoogle relative z-10"
                                style={{ display: "block", width: "100%", height: "100%" }}
                                data-ad-client={ppvAd.adsenseClient}
                                data-ad-slot={ppvAd.adsenseSlot}
                                data-ad-format="auto"
                                data-full-width-responsive="true"
                            />
                        ) : (
                            // Fallback - animated placeholder with branding
                            <div className="text-center relative z-10 p-8">
                                {/* Animated rings */}
                                <div className="relative w-32 h-32 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-accent-green/30 rounded-full animate-ping" />
                                    <div className="absolute inset-2 border-4 border-accent-gold/40 rounded-full animate-pulse" />
                                    <div className="absolute inset-4 border-4 border-white/20 rounded-full" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Tv className="w-12 h-12 text-accent-green" />
                                    </div>
                                </div>

                                <h3 className="text-white text-2xl font-black mb-2">
                                    FANBROJ AD
                                </h3>
                                <p className="text-accent-green text-lg font-bold mb-4">
                                    Xayeysiis wuu socda...
                                </p>

                                {/* Countdown */}
                                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                                    <div className="w-10 h-10 bg-accent-green rounded-full flex items-center justify-center">
                                        <span className="text-black font-black text-lg">
                                            {Math.ceil(adDuration - (adProgress * adDuration / 100))}
                                        </span>
                                    </div>
                                    <span className="text-white/80 text-sm">
                                        ilbiriqsi ka hartay
                                    </span>
                                </div>

                                <p className="text-text-muted text-xs mt-6 max-w-xs mx-auto">
                                    Daawo xayeysiiska si aad u furto content-ka. Mahadsanid taageeradaada!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-stadium-dark">
                        <div
                            className="h-full bg-accent-green transition-all duration-1000"
                            style={{ width: `${adProgress}%` }}
                        />
                    </div>

                    {/* Info */}
                    <div className="p-4 bg-stadium-elevated flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-muted">
                                Xayeysiis {adsWatched + 1} / {ppvConfig?.minAdsRequired || 3}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-text-muted">
                                Skip kadib {Math.ceil(adDuration - (adProgress * adDuration / 100))}s
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Lock overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                {/* Lock icon */}
                <div className="w-20 h-20 bg-accent-green/20 rounded-full flex items-center justify-center mb-6">
                    <Tv className="w-10 h-10 text-accent-green" />
                </div>

                <h2 className="text-2xl font-black text-white mb-2">
                    Daawo Xayeysiis si aad u Furto
                </h2>
                <p className="text-text-secondary mb-6 max-w-md">
                    {contentTitle} - Daawo {ppvConfig?.minAdsRequired || 3} xayeysiis oo gaaban si aad u daawato
                </p>

                {/* Ad unlock button */}
                {ppvConfig && (
                    <div className="w-full max-w-sm mb-6">
                        <div className="bg-stadium-hover border border-accent-green/30 rounded-xl p-6">
                            <div className="text-3xl font-black text-accent-green mb-2">
                                BILAASH
                            </div>
                            <p className="text-sm text-text-secondary mb-4">
                                Daawo {ppvConfig.minAdsRequired} xayeysiis oo gaaban
                            </p>

                            <button
                                onClick={startWatchingAd}
                                disabled={!userId}
                                className="w-full py-4 bg-accent-green text-black font-bold rounded-lg hover:bg-accent-green/90 transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
                            >
                                <Tv className="w-5 h-5" />
                                Bilow Daawashada ({adsRemaining} xayeysiis)
                            </button>
                        </div>
                    </div>
                )}

                {/* Progress tracker */}
                {ppvConfig && ppvConfig.adSupportedEnabled && adsWatched > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                        {Array.from({ length: ppvConfig.minAdsRequired }).map(
                            (_, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        i < adsWatched
                                            ? "bg-accent-green text-black"
                                            : "bg-stadium-hover text-text-muted"
                                    }`}
                                >
                                    {i < adsWatched ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-bold">
                                            {i + 1}
                                        </span>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Login prompt */}
                {!userId && (
                    <p className="text-sm text-text-muted">
                        <Link
                            href="/login"
                            className="text-accent-green hover:underline"
                        >
                            Soo gal
                        </Link>{" "}
                        si aad u daawato xayeysiis oo aad u furto
                    </p>
                )}

                {/* Premium upsell */}
                <div className="mt-6 pt-6 border-t border-border-subtle w-full max-w-lg">
                    <p className="text-sm text-text-muted mb-3">
                        Ama ka noqo Premium si aad u hesho dhammaan waxyaabaha!
                    </p>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 text-accent-gold hover:underline font-medium"
                    >
                        <Play className="w-4 h-4" />
                        Premium Features-ka Eeg
                    </Link>
                </div>
            </div>
        </div>
    );
}
