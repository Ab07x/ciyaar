"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Play, Download, Sparkles, MessageSquare } from "lucide-react";

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

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Allow skip after 5 seconds
        const skipTimer = setTimeout(() => {
            setCanSkip(true);
        }, 5000);

        return () => {
            clearInterval(timer);
            clearTimeout(skipTimer);
        };
    }, [onComplete]);

    const features = [
        { icon: Play, label: "Watch", highlight: "Full HD", color: "bg-pink-500" },
        { icon: Download, label: "Download", highlight: "Directly", color: "bg-gray-800" },
        { icon: Sparkles, label: "Watch", highlight: "Without Ads", color: "bg-cyan-500" },
        { icon: MessageSquare, label: "Request", highlight: "Content", color: "bg-pink-400" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src="/premium-ad/premium-bg.png"
                    alt="Premium Background"
                    fill
                    className="object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
                <Link href="/movies" className="text-white/70 hover:text-white flex items-center gap-2 text-sm">
                    <span>&lt;</span> {movieTitle}
                </Link>
                {canSkip ? (
                    <button
                        onClick={onComplete}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                ) : (
                    <div className="text-white/50 text-sm">
                        Skip in {Math.max(0, 5 - (duration - countdown))}s
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl mx-auto px-6 gap-8">
                {/* Left Side - Text */}
                <div className="flex-1 text-center lg:text-left">
                    {/* Arrow decoration */}
                    <div className="hidden lg:block absolute -top-8 left-1/4 text-accent-green text-4xl rotate-45">
                        ↗
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
                        <span className="text-accent-green">Premium</span>
                    </h1>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Membership ?
                    </h2>

                    <p className="text-white/70 text-sm md:text-base mb-8 max-w-md">
                        Get extra features by supporting us with server and development costs, which help keep this site alive and ad-free.
                    </p>

                    <Link
                        href="/pricing"
                        className="inline-block bg-accent-gold hover:bg-accent-gold/90 text-black font-bold px-8 py-4 rounded-lg text-lg transition-all hover:scale-105 uppercase tracking-wide"
                    >
                        CHECK OUR PLANS
                    </Link>

                    {/* Countdown */}
                    <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">{countdown}</span>
                        </div>
                        <span className="text-white/50 text-sm">Video starting in {countdown}s</span>
                    </div>
                </div>

                {/* Center - Celebrity Image */}
                <div className="relative flex-shrink-0 order-first lg:order-none">
                    <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80">
                        <Image
                            src="/premium-ad/movie-celebraty-min.png"
                            alt="Premium"
                            fill
                            className="object-contain drop-shadow-2xl"
                        />
                    </div>
                </div>

                {/* Right Side - Features */}
                <div className="flex-1 flex flex-col gap-3 max-w-xs">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-white font-medium">{feature.label}</span>
                                <span className="text-accent-green font-bold">{feature.highlight}</span>
                            </div>
                            <div className={`w-10 h-10 ${feature.color} rounded-full flex items-center justify-center`}>
                                <feature.icon size={18} className="text-white" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Skip Button (when available) */}
            {canSkip && (
                <button
                    onClick={onComplete}
                    className="absolute bottom-8 right-8 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2"
                >
                    Skip Ad <Play size={16} fill="white" />
                </button>
            )}

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                    className="h-full bg-accent-green transition-all duration-1000 ease-linear"
                    style={{ width: `${((duration - countdown) / duration) * 100}%` }}
                />
            </div>
        </div>
    );
}
