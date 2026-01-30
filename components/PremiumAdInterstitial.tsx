"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Play, Download, Sparkles, MessageSquare } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PremiumAdInterstitialProps {
    onComplete: () => void;
    movieTitle?: string;
    duration?: number; // in seconds, default 10
}

export function PremiumAdInterstitial({
    onComplete,
    movieTitle = "Movie",
    duration = 10
}: PremiumAdInterstitialProps) {
    const [countdown, setCountdown] = useState(duration);
    const [canSkip, setCanSkip] = useState(false);
    const hasCompleted = useRef(false);

    // Fetch interstitial banner from database
    const banner = useQuery(api.promoBanners.getActiveBanner, { type: "interstitial" });

    // Use banner data or defaults
    const headline = banner?.headline || "Premium";
    const subheadline = banner?.subheadline || "Xubin Ka Noqo ?";
    const ctaText = banner?.ctaText || "EEG QORSHAYAASHA";
    const ctaLink = banner?.ctaLink || "/pricing";
    const leftImageUrl = banner?.leftImageUrl || "/premium-ad/movie-celebraty-min.png";
    const backgroundImageUrl = banner?.backgroundImageUrl || "/premium-ad/premium-bg.png";
    const accentColor = banner?.accentColor || "#9AE600";

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Watch for countdown completion - REMOVED AUTO CLOSE
    // useEffect(() => {
    //     if (countdown === 0 && !hasCompleted.current) {
    //         hasCompleted.current = true;
    //         onComplete();
    //     }
    // }, [countdown, onComplete]);

    // Allow skip after 5 seconds
    useEffect(() => {
        const skipTimer = setTimeout(() => {
            setCanSkip(true);
        }, 5000);

        return () => clearTimeout(skipTimer);
    }, []);

    // Handle skip/close click
    const handleClose = () => {
        if (!hasCompleted.current) {
            hasCompleted.current = true;
            onComplete();
        }
    };

    const features = [
        { icon: Play, label: "Daawo", highlight: "Full HD", color: "bg-pink-500" },
        { icon: Download, label: "Download", highlight: "Si toos ah", color: "bg-gray-800" },
        { icon: Sparkles, label: "Daawo", highlight: "Xayeysiis la'aan", color: "bg-cyan-500" },
        { icon: MessageSquare, label: "Codso", highlight: "Muuqaalo", color: "bg-pink-400" },
    ];

    return (

        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black overflow-y-auto overflow-x-hidden touch-pan-y">
            {/* Background Image */}
            <div className="fixed inset-0 pointer-events-none">
                <Image
                    src={backgroundImageUrl}
                    alt="Premium Background"
                    fill
                    className="object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />
            </div>

            {/* Header */}
            <div className="fixed top-0 left-0 right-0 flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={handleClose}
                    className="text-white/70 hover:text-white flex items-center gap-2 text-sm bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
                >
                    <span>&lt;</span> {movieTitle}
                </button>

                {/* Close button always visible if canSkip is true OR countdown is 0 */}
                {(canSkip || countdown === 0) ? (
                    <button
                        onClick={handleClose}
                        className="flex items-center gap-2 text-white hover:bg-white/10 transition-colors bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10"
                    >
                        <span className="text-xs font-bold">CLOSE</span>
                        <X size={18} />
                    </button>
                ) : (
                    <div className="text-white/50 text-xs bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        Skip in {Math.max(0, 5 - (duration - countdown))}s
                    </div>
                )}
            </div>

            {/* Main Content - Scrollable Container */}
            <div className="relative z-10 w-full min-h-full flex flex-col lg:flex-row items-center justify-center lg:justify-between max-w-6xl mx-auto px-6 py-20 lg:py-0 gap-8 lg:gap-12">

                {/* Center - Celebrity Image (Mobile Top) */}
                <div className="relative flex-shrink-0 order-first lg:order-none mt-4 lg:mt-0">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64 lg:w-96 lg:h-96 animate-in fade-in zoom-in duration-700">
                        <Image
                            src={leftImageUrl}
                            alt="Premium"
                            fill
                            className="object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                        />
                    </div>
                </div>

                {/* Left Side - Text */}
                <div className="flex-1 text-center lg:text-left w-full max-w-lg lg:max-w-none">
                    {/* Arrow decoration */}
                    <div className="hidden lg:block absolute -top-8 left-1/4 text-4xl rotate-45 animate-bounce" style={{ color: accentColor }}>
                        ↗
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-1 leading-tight tracking-tight">
                        <span style={{ color: accentColor }}>{headline}</span>
                    </h1>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 lg:mb-6 leading-tight">
                        {subheadline}
                    </h2>

                    <p className="text-white/70 text-sm md:text-base mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
                        Hel faa'iidooyin dheeri ah adigoo nagu taageeraya kharashka server-ka iyo horumarinta, taas oo naga caawinaysa inaan barta sii wadno oo aan ka dhigno xayeysiis la'aan.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8 lg:mb-0">
                        <Link
                            href={ctaLink}
                            className="w-full sm:w-auto bg-accent-gold hover:bg-accent-gold/90 text-black font-black px-8 py-4 rounded-xl text-base md:text-lg transition-all hover:scale-105 uppercase tracking-wide shadow-[0_0_30px_rgba(255,215,0,0.3)]"
                        >
                            {ctaText}
                        </Link>

                        {/* Countdown or Play Button */}
                        {countdown > 0 ? (
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                <span className="text-2xl font-black text-white w-8 text-center">{countdown}</span>
                                <span className="text-white/50 text-xs text-left leading-tight w-24">Video starts automatically</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleClose}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all animate-pulse"
                            >
                                <Play size={20} fill="currentColor" />
                                DAAWAO NOW
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side - Features (Mobile Bottom) */}
                <div className="w-full lg:flex-1 lg:max-w-xs space-y-3 pb-8 lg:pb-0">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group flex items-center justify-between bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-4 hover:bg-white/10 transition-all hover:scale-[1.02] hover:border-white/20"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-white font-bold">{feature.label}</span>
                                <span className="font-bold text-sm" style={{ color: accentColor }}>{feature.highlight}</span>
                            </div>
                            <div className={`w-8 h-8 ${feature.color} rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform`}>
                                <feature.icon size={16} className="text-white" />
                            </div>
                        </div>
                    ))}

                    {/* Extra message for mobile scroll hint */}
                    <p className="text-center text-white/30 text-xs py-2 lg:hidden animate-pulse">
                        Scroll for more details
                    </p>
                </div>
            </div>

            {/* Skip Button (Fixed Bottom Right on Desktop) */}
            {canSkip && countdown > 0 && (
                <div className="fixed bottom-8 right-8 z-20 hidden lg:block">
                    <button
                        onClick={handleClose}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/10 hover:border-white/30"
                    >
                        Ka bood <Play size={16} fill="white" />
                    </button>
                </div>
            )}

            {/* Mobile Skip Button (Fixed Bottom Center) */}
            {canSkip && countdown > 0 && (
                <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center lg:hidden px-4">
                    <button
                        onClick={handleClose}
                        className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/10 shadow-xl"
                    >
                        Ka bood Xayeysiiska <Play size={16} fill="white" />
                    </button>
                </div>
            )}

            {/* Progress Bar (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 h-1.5 bg-white/10 z-30">
                <div
                    className="h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_currentColor]"
                    style={{
                        width: `${((duration - countdown) / duration) * 100}%`,
                        backgroundColor: accentColor,
                        color: accentColor
                    }}
                />
            </div>
        </div>
    );
}
