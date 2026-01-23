"use client";

import { useState, useEffect, useCallback } from "react";
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

export function PPVUnlockGate({
    contentType,
    contentId,
    contentTitle,
    children,
    onUnlock,
}: PPVUnlockGateProps) {
    const { user, isPremium, isLoading: userLoading } = useUser();
    const [watchingAd, setWatchingAd] = useState(false);
    const [adProgress, setAdProgress] = useState(0);
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
        user?._id
            ? { userId: user._id, contentType, contentId }
            : { contentType, contentId }
    );

    // Mutations
    const recordAdWatch = useMutation(api.ppv.recordAdWatch);

    // Handle ad completion
    const handleAdComplete = useCallback(async () => {
        if (!user?._id) return;

        const result = await recordAdWatch({
            userId: user._id,
            deviceId,
            contentType,
            contentId,
        });

        setWatchingAd(false);
        setAdProgress(0);

        if (result.isUnlocked && onUnlock) {
            onUnlock();
        }
    }, [user?._id, deviceId, contentType, contentId, recordAdWatch, onUnlock]);

    // Simulate ad watching (in production, integrate with AdSense)
    const startWatchingAd = useCallback(() => {
        setWatchingAd(true);
        setAdProgress(0);

        // Simulate 15-second ad
        const interval = setInterval(() => {
            setAdProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    handleAdComplete();
                    return 100;
                }
                return prev + 100 / 15; // 15 seconds
            });
        }, 1000);

        // In production, you would:
        // 1. Load an AdSense rewarded ad
        // 2. Wait for ad completion callback
        // 3. Call handleAdComplete() when ad finishes
    }, [handleAdComplete]);

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
    const adsWatched = 0; // Will be updated from purchase record if exists
    const adsRemaining = ppvConfig ? ppvConfig.minAdsRequired - adsWatched : 0;

    return (
        <div className="relative min-h-[400px] bg-gradient-to-b from-stadium-dark to-stadium-elevated rounded-2xl overflow-hidden">
            {/* Blurred preview background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />

            {/* Lock overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                {/* Lock icon */}
                <div className="w-20 h-20 bg-accent-gold/20 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-accent-gold" />
                </div>

                <h2 className="text-2xl font-black text-white mb-2">
                    Pay-Per-View Content
                </h2>
                <p className="text-text-secondary mb-6 max-w-md">
                    {contentTitle} waxaa loo baahan yahay inaad bixiso ama aad daawato
                    xayaysiis si aad u furto
                </p>

                {/* Pricing options */}
                {ppvConfig && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-6">
                        {/* Paid option */}
                        <div className="bg-stadium-hover border border-accent-gold/30 rounded-xl p-6">
                            <div className="text-3xl font-black text-accent-gold mb-2">
                                ${ppvConfig.price.toFixed(2)}
                            </div>
                            <p className="text-sm text-text-secondary mb-4">
                                Bixi oo isla markiiba daawo
                            </p>
                            <Link
                                href={`/checkout/ppv?type=${contentType}&id=${contentId}`}
                                className="block w-full py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold/90 transition-colors text-center"
                            >
                                Iibso Hadda
                            </Link>
                        </div>

                        {/* Ad-supported option */}
                        {ppvConfig.adSupportedEnabled && (
                            <div className="bg-stadium-hover border border-accent-green/30 rounded-xl p-6">
                                <div className="text-xl font-bold text-accent-green mb-2">
                                    Bilaash!
                                </div>
                                <p className="text-sm text-text-secondary mb-4">
                                    Daawo {ppvConfig.minAdsRequired} xayeysiis si aad u furto
                                </p>

                                {watchingAd ? (
                                    <div className="space-y-3">
                                        <div className="relative h-2 bg-stadium-dark rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-accent-green transition-all duration-1000"
                                                style={{ width: `${adProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-text-muted">
                                            Xayeysiiska wuu socda...{" "}
                                            {Math.round(adProgress)}%
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={startWatchingAd}
                                        disabled={!user}
                                        className="w-full py-3 bg-accent-green text-black font-bold rounded-lg hover:bg-accent-green/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Tv className="w-4 h-4" />
                                        Daawo Xayeysiis ({adsRemaining} hartay)
                                    </button>
                                )}
                            </div>
                        )}
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
                {!user && (
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
