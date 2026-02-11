"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type RamadanVariant = "full" | "slim" | "player";

interface RamadanBannerProps {
    variant?: RamadanVariant;
    className?: string;
}

// Ramadan 2026 approximate dates
const RAMADAN_START = new Date("2026-02-17T00:00:00");
const RAMADAN_END = new Date("2026-03-20T23:59:59");

function isRamadanPeriod(): boolean {
    const now = new Date();
    return now >= RAMADAN_START && now <= RAMADAN_END;
}

const DISMISS_KEY = "ramadan-banner-2026-dismissed";

export function RamadanBanner({ variant = "full", className = "" }: RamadanBannerProps) {
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        if (!isRamadanPeriod()) return;
        const stored = localStorage.getItem(DISMISS_KEY);
        if (!stored) {
            setDismissed(false);
        }
    }, []);

    if (dismissed || !isRamadanPeriod()) return null;

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem(DISMISS_KEY, "true");
    };

    if (variant === "slim") {
        return (
            <div className={`relative overflow-hidden bg-gradient-to-r from-[#0D4A3A] via-[#0B3D30] to-[#0D4A3A] border-y border-[#D4AF37]/30 ${className}`}>
                {/* Stars */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-[#D4AF37] rounded-full animate-pulse"
                            style={{
                                top: `${20 + Math.random() * 60}%`,
                                left: `${5 + i * 12}%`,
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: `${1.5 + Math.random()}s`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative flex items-center justify-center gap-3 py-2 px-4">
                    {/* Crescent */}
                    <span className="text-[#D4AF37] text-lg">&#9790;</span>

                    <p className="text-white/90 text-sm font-medium">
                        <span className="text-[#D4AF37] font-bold">Ramadan Kariim!</span>
                        {" "}Bisha Barakaysan oo Idiin Mubaarik
                    </p>

                    <span className="text-[#D4AF37] text-lg">&#9790;</span>

                    <button
                        onClick={handleDismiss}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        );
    }

    if (variant === "player") {
        return (
            <div className={`relative overflow-hidden bg-gradient-to-r from-[#0D4A3A] to-[#0B3D30] rounded-lg border border-[#D4AF37]/20 ${className}`}>
                <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[#D4AF37] text-base">&#9790;</span>
                        <span className="text-white/80 text-xs font-medium">
                            <span className="text-[#D4AF37] font-bold">Ramadan Mubarak</span>
                            {" "}- Bisha Barakaysan
                        </span>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-0.5 text-white/40 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
        );
    }

    // Full variant
    return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-[#0D4A3A] via-[#0A3529] to-[#0D4A3A] border-y border-[#D4AF37]/30 ${className}`}>
            {/* Geometric pattern overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="islamic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                        <circle cx="30" cy="30" r="10" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
                </svg>
            </div>

            {/* Animated stars */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-[#D4AF37] rounded-full"
                        style={{
                            top: `${10 + Math.random() * 80}%`,
                            left: `${3 + Math.random() * 94}%`,
                            animation: `ramadan-twinkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-5xl mx-auto px-4 py-6 md:py-8 text-center">
                {/* Crescent and text */}
                <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="text-[#D4AF37] text-3xl md:text-4xl" style={{ filter: "drop-shadow(0 0 8px rgba(212,175,55,0.4))" }}>&#9790;</span>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
                        Ramadan <span className="text-[#D4AF37]">Kariim</span>
                    </h2>
                    <span className="text-[#D4AF37] text-3xl md:text-4xl" style={{ transform: "scaleX(-1)", filter: "drop-shadow(0 0 8px rgba(212,175,55,0.4))" }}>&#9790;</span>
                </div>

                {/* Arabic style text */}
                <p className="text-[#D4AF37]/80 text-lg md:text-xl font-semibold mb-2" style={{ fontFamily: "serif" }}>
                    &#x0631;&#x0645;&#x0636;&#x0627;&#x0646; &#x0645;&#x0628;&#x0627;&#x0631;&#x0643;
                </p>

                {/* Somali message */}
                <p className="text-white/80 text-sm md:text-base">
                    Bisha Barakaysan oo Idiin Mubaarik
                </p>

                {/* Decorative line */}
                <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" style={{ animation: "ramadan-twinkle 2s ease-in-out infinite" }} />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
                </div>
            </div>

            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                aria-label="Close Ramadan banner"
            >
                <X size={16} />
            </button>

            {/* CSS animation */}
            <style jsx>{`
                @keyframes ramadan-twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}
