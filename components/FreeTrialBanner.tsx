"use client";

import { useState, useEffect } from "react";
import { X, Gift, Share2, MessageCircle, Users, Sparkles, Clock } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@/lib/utils";

const SHARE_PLATFORMS = [
    {
        name: "WhatsApp",
        icon: MessageCircle,
        color: "bg-[#25D366]",
        getUrl: (url: string, text: string) =>
            `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
    },
];

export function FreeTrialBanner() {
    const { isPremium, isLoading } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [shareCount, setShareCount] = useState(0);
    const [showShareOptions, setShowShareOptions] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Check if user has dismissed the banner recently
        const dismissedUntil = localStorage.getItem("freeTrialDismissedUntil");
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
            setIsDismissed(true);
            return;
        }

        // Get share count
        const savedShareCount = localStorage.getItem("freeTrialShareCount");
        if (savedShareCount) {
            setShareCount(parseInt(savedShareCount));
        }

        // Show banner after a short delay
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Dismiss for 24 hours
        localStorage.setItem("freeTrialDismissedUntil", (Date.now() + 24 * 60 * 60 * 1000).toString());
        setTimeout(() => setIsDismissed(true), 300);
    };

    const handleShare = (platform: typeof SHARE_PLATFORMS[0]) => {
        const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://fanbroj.net";
        const shareText = "🎬 Daawo filimada ugu fiican AF-SOMALI! 14 Maalmood FREE Trial - Fanbroj TV";

        window.open(platform.getUrl(shareUrl, shareText), "_blank", "width=600,height=400");

        // Increment share count
        const newCount = shareCount + 1;
        setShareCount(newCount);
        localStorage.setItem("freeTrialShareCount", newCount.toString());

        // If shared 3 times, show success
        if (newCount >= 3) {
            localStorage.setItem("freeTrialUnlocked", "true");
        }
    };

    // Don't show for premium users or if loading
    if (!mounted || isLoading || isPremium || isDismissed) return null;

    const requiredShares = 3;
    const sharesRemaining = Math.max(0, requiredShares - shareCount);
    const progressPercent = Math.min(100, (shareCount / requiredShares) * 100);

    return (
        <div
            className={cn(
                "fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 transition-all duration-500 transform",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
        >
            <div className="relative bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f0f23] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 animate-pulse" />

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
                >
                    <X size={18} />
                </button>

                <div className="relative p-5">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Gift size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-yellow-400" />
                                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                                    Special Offer
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-white">
                                14 Maalmood FREE Trial
                            </h3>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-300 mb-4">
                        La wadaag <span className="font-bold text-white">3 saaxiibood</span> WhatsApp-ka si aad u hesho{" "}
                        <span className="font-bold text-[#9AE600]">14 maalmood PREMIUM</span> bilaash ah!
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Users size={12} />
                                {shareCount} / {requiredShares} shared
                            </span>
                            {sharesRemaining > 0 ? (
                                <span className="text-xs text-orange-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    {sharesRemaining} more needed
                                </span>
                            ) : (
                                <span className="text-xs text-[#9AE600] font-bold">
                                    ✓ Unlocked!
                                </span>
                            )}
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#9AE600] to-[#7BC400] rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Share Button */}
                    <button
                        onClick={() => handleShare(SHARE_PLATFORMS[0])}
                        className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20BD5C] hover:to-[#0E7A6D] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    >
                        <MessageCircle size={20} />
                        <span>La Wadaag WhatsApp</span>
                        <Share2 size={16} />
                    </button>

                    {/* Terms */}
                    <p className="text-[10px] text-gray-500 text-center mt-3">
                        Ka dib markii aad wadaagto 3 jeer, Premium-ka bilaashka ah wuu bilaabmi doonaa
                    </p>
                </div>

                {/* Bottom accent line */}
                <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
            </div>
        </div>
    );
}
