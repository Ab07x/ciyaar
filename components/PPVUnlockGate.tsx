"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { Lock, Play, Tv, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

    // Queries via SWR
    const accessParams = userId
        ? `userId=${userId}&contentType=${contentType}&contentId=${contentId}`
        : `contentType=${contentType}&contentId=${contentId}`;
    const { data: accessCheck } = useSWR(`/api/ppv/check?${accessParams}`, fetcher);

    const { data: globalAd } = useSWR(`/api/ads?slotKey=ppv_unlock`, fetcher);

    // Determine the active ad configuration (Embedded > Global > Fallback)
    const activeAd = (() => {
        // 1. Embedded Ad in PPV Content
        if (accessCheck?.config?.adType) {
            const config = accessCheck.config;
            let network = config.adType;
            let codeHtml = config.adHtml;

            // Handle image type as custom HTML
            if (network === "image" && config.adImageUrl) {
                network = "custom";
                codeHtml = `<a href="${config.adClickUrl || '#'}" target="_blank"><img src="${config.adImageUrl}" style="width:100%;height:100%;object-fit:contain;" /></a>`;
            }

            return {
                network,
                videoUrl: config.adVideoUrl,
                vastUrl: config.adVastUrl,
                codeHtml,
                adsenseClient: config.adAdsenseClient,
                adsenseSlot: config.adAdsenseSlot,
                videoDuration: config.adDuration || DEFAULT_AD_DURATION,
                // Add clickUrl for tracking/handling if needed
                clickUrl: config.adClickUrl,
                skipAfter: config.adSkipAfter
            };
        }

        // 2. Global Ad (if enabled)
        if (globalAd?.enabled) {
            return globalAd;
        }

        return null;
    })();

    // API mutation helpers
    const recordAdWatch = async (params: any) => {
        const res = await fetch("/api/ppv/ad-watch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });
        return res.json();
    };
    const trackAdImpression = async (params: any) => {
        await fetch("/api/ppv/impression", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });
    };

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
    }, [userId, deviceId, contentType, contentId, onUnlock]);

    // Get ad duration from config or use default
    const adDuration = activeAd?.videoDuration || DEFAULT_AD_DURATION;

    // Load and show ad based on type
    const startWatchingAd = useCallback(() => {
        setWatchingAd(true);
        setAdProgress(0);

        // Load AdSense ad if available
        if ((activeAd?.network === "adsense" || activeAd?.network === "ppv") && activeAd?.adsenseClient && adContainerRef.current) {
            try {
                // Remove existing scripts to force reload
                const existing = adContainerRef.current.querySelector('.adsbygoogle');
                if (existing) existing.innerHTML = '';

                (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                (window as any).adsbygoogle.push({});
            } catch (e) {
                console.error("AdSense error:", e);
            }
        }

        // Timer for ad duration
        const duration = activeAd?.videoDuration || DEFAULT_AD_DURATION;
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
    }, [handleAdComplete, activeAd]);

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
                        {activeAd?.videoUrl ? (
                            <div className="w-full h-full bg-black relative z-10">
                                <video
                                    src={activeAd.videoUrl}
                                    autoPlay
                                    muted={false}
                                    playsInline
                                    controls={false}
                                    className="w-full h-full object-contain"
                                    onEnded={() => {
                                        if (adProgress < 100) setAdProgress(100);
                                    }}
                                />
                            </div>
                        ) : activeAd?.vastUrl ? (
                            // VAST/VPAID - render iframe for VAST player
                            <iframe
                                src={activeAd.vastUrl}
                                className="w-full h-full border-0 relative z-10"
                                allow="autoplay"
                            />
                        ) : activeAd?.codeHtml ? (
                            // Custom HTML ad code / Image
                            <div className="w-full h-full flex items-center justify-center relative z-10 bg-black">
                                <div
                                    className="w-full h-full flex items-center justify-center"
                                    dangerouslySetInnerHTML={{ __html: activeAd.codeHtml }}
                                />
                                {activeAd.network === 'custom' && (activeAd.videoDuration || 0) > 0 && (
                                    <div className="absolute inset-0 pointer-events-none" /> // Overlay to prevent interaction if meant to be watched only? Or allow clicks? For Image usually allow.
                                )}
                            </div>
                        ) : activeAd?.adsenseClient && activeAd?.adsenseSlot ? (
                            // AdSense
                            <div className="w-full h-full bg-white relative z-10 flex items-center justify-center">
                                <ins
                                    className="adsbygoogle"
                                    style={{ display: "block", width: "100%", height: "100%" }}
                                    data-ad-client={activeAd.adsenseClient}
                                    data-ad-slot={activeAd.adsenseSlot}
                                    data-ad-format="auto"
                                    data-full-width-responsive="true"
                                />
                            </div>
                        ) : (
                            // Fallback - animated placeholder with branding
                            <div className="text-center relative z-10 p-8 w-full h-full flex flex-col items-center justify-center">
                                {/* Branding */}
                                <div className="absolute top-8 left-0 right-0 flex justify-center opacity-50">
                                    <span className="text-white/30 text-xs font-mono tracking-[0.5em] uppercase">Xayeysiiska Fanbroj</span>
                                </div>

                                {/* Animated rings & Icon */}
                                <div className="relative w-32 h-32 mx-auto mb-8">
                                    <div className="absolute inset-0 border-4 border-accent-green/20 rounded-full animate-[ping_3s_linear_infinite]" />
                                    <div className="absolute inset-0 border-4 border-accent-green/40 rounded-full animate-[ping_3s_linear_infinite_1.5s]" />
                                    <div className="absolute inset-4 border-2 border-accent-gold/40 rounded-full animate-pulse" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-green/10 to-transparent rounded-full backdrop-blur-sm" />

                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Tv className="w-12 h-12 text-accent-green drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                                    </div>
                                </div>

                                <div className="space-y-4 relative">
                                    <h3 className="text-white text-3xl font-black tracking-tight drop-shadow-lg">
                                        FANBROJ
                                        <span className="text-accent-gold ml-2">PREMIUM</span>
                                    </h3>

                                    <p className="text-accent-green font-medium tracking-wide animate-pulse">
                                        Xayeysiiska wuu socda...
                                    </p>

                                    {/* Large Countdown Pill */}
                                    <div className="mt-8">
                                        <div className="inline-flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-2 pr-6 py-2 shadow-2xl">
                                            <div className="w-12 h-12 bg-gradient-to-br from-accent-green to-emerald-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                                                <div className="absolute inset-0 bg-white/20 animate-[spin_4s_linear_infinite] opacity-30" style={{ transformOrigin: 'center 60%' }}></div>
                                                <span className="text-black font-black text-xl relative z-10">
                                                    {Math.ceil(adDuration - (adProgress * adDuration / 100))}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-white font-bold text-sm uppercase tracking-wider">Ilbiriqsi</span>
                                                <span className="text-white/50 text-[10px]">Ka hartay xayeysiiska</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-8 left-0 right-0 text-center">
                                    <p className="text-white/40 text-xs max-w-xs mx-auto">
                                        Daawo xayeysiiska oo dhan si aad u furto content-ka.
                                    </p>
                                </div>
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
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${i < adsWatched
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
