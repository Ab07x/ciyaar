"use client";

import { useState, useEffect, useMemo } from "react";
import { Share2, Eye, MessageCircle, Copy, Check, Users, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareableWidgetProps {
    title: string;
    url?: string;
    type?: "movie" | "series" | "match";
    className?: string;
    variant?: "floating" | "inline" | "compact";
}

// Generate realistic fake view counts based on content type
function generateFakeViews(type: string): number {
    const baseViews = {
        movie: { min: 15000, max: 850000 },
        series: { min: 25000, max: 1200000 },
        match: { min: 50000, max: 2500000 },
    };

    const range = baseViews[type as keyof typeof baseViews] || baseViews.movie;
    return Math.floor(Math.random() * (range.max - range.min) + range.min);
}

// Format number with K/M suffix
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}

// Generate current "watching now" count
function generateLiveCount(views: number): number {
    const percentage = Math.random() * 0.02 + 0.005; // 0.5% - 2% of total views
    return Math.floor(views * percentage);
}

export function ShareableWidget({
    title,
    url,
    type = "movie",
    className,
    variant = "floating"
}: ShareableWidgetProps) {
    const [copied, setCopied] = useState(false);
    const [showWidget, setShowWidget] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Generate fake stats once and memoize
    const stats = useMemo(() => {
        const views = generateFakeViews(type);
        return {
            views,
            liveCount: generateLiveCount(views),
            shares: Math.floor(views * (Math.random() * 0.1 + 0.05)), // 5-15% of views
        };
    }, [type]);

    // Animate live count changes
    const [liveCount, setLiveCount] = useState(stats.liveCount);

    useEffect(() => {
        setMounted(true);

        // Simulate live count changes
        const interval = setInterval(() => {
            setLiveCount(prev => {
                const change = Math.floor(Math.random() * 20) - 8; // -8 to +12
                return Math.max(10, prev + change);
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    const shareToWhatsApp = () => {
        const text = `🎬 ${title}\n\n👀 ${formatNumber(stats.views)} views\n🔴 ${formatNumber(liveCount)} watching now\n\n${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    if (!mounted) return null;

    // Compact variant - just stats
    if (variant === "compact") {
        return (
            <div className={cn("flex items-center gap-4 text-sm", className)}>
                <div className="flex items-center gap-1.5 text-gray-400">
                    <Eye size={14} />
                    <span className="font-semibold">{formatNumber(stats.views)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-red-400 font-semibold">{formatNumber(liveCount)} live</span>
                </div>
                <button
                    onClick={shareToWhatsApp}
                    className="flex items-center gap-1.5 text-[#25D366] hover:underline"
                >
                    <Share2 size={14} />
                    <span className="font-semibold">Share</span>
                </button>
            </div>
        );
    }

    // Inline variant
    if (variant === "inline") {
        return (
            <div className={cn(
                "bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm rounded-xl p-4 border border-white/10",
                className
            )}>
                {/* Stats Row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        {/* Total Views */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Eye size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Views</p>
                                <p className="text-sm font-bold text-white">{formatNumber(stats.views)}</p>
                            </div>
                        </div>

                        {/* Live Count */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center relative">
                                <Users size={16} className="text-red-400" />
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Watching</p>
                                <p className="text-sm font-bold text-red-400">{formatNumber(liveCount)}</p>
                            </div>
                        </div>

                        {/* Shares */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <TrendingUp size={16} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Shares</p>
                                <p className="text-sm font-bold text-green-400">{formatNumber(stats.shares)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={shareToWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
                    >
                        <MessageCircle size={18} />
                        WhatsApp
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
                    >
                        {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        );
    }

    // Floating variant (default)
    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={() => setShowWidget(true)}
                className={cn(
                    "fixed bottom-32 md:bottom-24 left-4 z-40 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform",
                    className
                )}
            >
                <Share2 size={22} />
                {/* Live badge */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-[8px] font-bold">
                        {formatNumber(liveCount).replace(/\..+/, "")}
                    </span>
                </span>
            </button>

            {/* Modal */}
            {showWidget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f23] rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="font-bold text-white">La Wadaag</h3>
                            <button
                                onClick={() => setShowWidget(false)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <Eye size={20} className="text-blue-400 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-white">{formatNumber(stats.views)}</p>
                                    <p className="text-xs text-gray-400">Views</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center relative">
                                    <div className="absolute top-2 right-2">
                                        <span className="flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                    </div>
                                    <Users size={20} className="text-red-400 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-red-400">{formatNumber(liveCount)}</p>
                                    <p className="text-xs text-gray-400">Live</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <TrendingUp size={20} className="text-green-400 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-green-400">{formatNumber(stats.shares)}</p>
                                    <p className="text-xs text-gray-400">Shares</p>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-sm text-white font-medium line-clamp-2">{title}</p>
                            </div>

                            {/* Share Buttons */}
                            <div className="space-y-2">
                                <button
                                    onClick={shareToWhatsApp}
                                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-white font-bold py-3 px-4 rounded-xl transition-colors"
                                >
                                    <MessageCircle size={20} />
                                    La Wadaag WhatsApp
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={20} className="text-green-400" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={20} />
                                            Copy Link
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
