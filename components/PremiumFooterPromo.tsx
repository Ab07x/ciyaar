"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { X, Crown } from "lucide-react";
import { useState, useEffect } from "react";

export function PremiumFooterPromo() {
    const { isPremium } = useUser();
    const [isVisible, setIsVisible] = useState(true);
    const pathname = usePathname();

    // Don't show on pricing page or if user is already premium
    if (isPremium || pathname === "/pricing" || !isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="max-w-4xl mx-auto bg-[var(--bg-elevated)]/95 backdrop-blur-md border border-[var(--color-premium)]/30 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-shine pointer-events-none" />

                {/* Content */}
                <div className="flex items-center gap-4 z-10 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-premium)] to-yellow-600 flex items-center justify-center shadow-lg shadow-[var(--color-premium)]/20 flex-shrink-0">
                        <Crown className="text-black" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-tight">
                            Get Premium Access
                        </h3>
                        <p className="text-gray-300 text-sm">
                            Remove ads & unlock all movies/series
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="flex w-full md:w-auto gap-3 z-10">
                    <Link
                        href="/pricing"
                        className="flex-1 md:flex-none text-center bg-[var(--color-premium)] text-black px-6 py-2.5 rounded-xl font-bold hover:brightness-110 transition-colors shadow-lg shadow-[var(--color-premium)]/10 whitespace-nowrap"
                    >
                        Upgrade Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
