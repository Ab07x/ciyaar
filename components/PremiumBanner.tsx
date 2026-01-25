"use client";

import Link from "next/link";
import { Crown, Sparkles, Zap, Check } from "lucide-react";

interface PremiumBannerProps {
    className?: string;
}

export function PremiumBanner({ className }: PremiumBannerProps) {
    const features = [
        "Dhammaan channels premium",
        "Khibrad xayeysiis la'aan ah",
        "Tayada daawashada HD/4K",
        "Taageero gaar ah",
    ];

    return (
        <div className={`relative overflow-hidden rounded-3xl ${className}`}>
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-gold via-amber-500 to-orange-500 animate-gradient" />

            {/* Glass overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Sparkle decorations */}
            <div className="absolute top-4 right-8 text-white/20">
                <Sparkles size={48} />
            </div>
            <div className="absolute bottom-6 left-12 text-white/10">
                <Sparkles size={32} />
            </div>

            {/* Content */}
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                {/* Left: Icon & Text */}
                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                        <Crown size={16} />
                        XUBINIMADA PREMIUM
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                        Ku Raaxayso LIVE TV
                        <span className="block text-accent-green">Bilaa Xayeysiis!</span>
                    </h2>
                    <ul className="space-y-2 mb-6">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-white/90">
                                <Check size={16} className="text-accent-green flex-shrink-0" />
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right: CTA */}
                <div className="flex flex-col items-center gap-3">
                    <Link
                        href="/pricing"
                        className="group flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-black text-lg hover:bg-accent-green transition-colors shadow-2xl"
                    >
                        <Zap size={20} className="group-hover:animate-bounce" />
                        Iibso Hadda
                    </Link>
                    <span className="text-white/60 text-sm">Bilowga $0.25/ciyaar kaliya</span>
                </div>
            </div>
        </div>
    );
}
