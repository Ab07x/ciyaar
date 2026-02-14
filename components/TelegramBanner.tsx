"use client";

import { useState, useEffect } from "react";
import { X, Users, ArrowRight, MessageCircle } from "lucide-react";

const TELEGRAM_URL = "https://t.me/FanprojPr";
const DISMISS_KEY = "fanbroj_tg_dismissed";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function TelegramBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DURATION) {
            return;
        }
        // Show after a short delay for better UX
        const timer = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setVisible(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    };

    if (!visible) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0088cc] via-[#0099dd] to-[#00aaee] shadow-lg shadow-[#0088cc]/20">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: "1s" }} />
                    <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: "0.5s" }} />
                </div>

                <div className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
                    {/* Left: Icon + Text */}
                    <div className="flex items-center gap-4 flex-1">
                        {/* Telegram Icon */}
                        <div className="hidden sm:flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-white font-black text-sm md:text-lg leading-tight">
                                🚀 Ku soo biir Telegram Channel-keena!
                            </h3>
                            <p className="text-white/80 text-xs md:text-sm mt-0.5">
                                Hel wararka ugu cusub ee filimada, ciyaaraha, iyo qiimo jaban 💰
                            </p>
                        </div>
                    </div>

                    {/* Right: CTA + Close */}
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        <a
                            href={TELEGRAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-2 bg-white text-[#0088cc] font-bold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all transform hover:scale-105 text-sm shadow-lg"
                        >
                            <Users size={16} />
                            Ku soo biir
                            <ArrowRight size={14} />
                        </a>
                        {/* Mobile CTA */}
                        <a
                            href={TELEGRAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sm:hidden inline-flex items-center gap-1.5 bg-white text-[#0088cc] font-bold px-4 py-2 rounded-lg text-xs"
                        >
                            Ku biir
                            <ArrowRight size={12} />
                        </a>
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Floating Telegram button (bottom-right, always visible)
export function TelegramFloatingButton() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 group"
            title="Join our Telegram"
        >
            <div className="relative">
                {/* Pulse ring */}
                <div className="absolute inset-0 bg-[#0088cc] rounded-full animate-ping opacity-30" />

                {/* Button */}
                <div className="relative w-14 h-14 bg-[#0088cc] hover:bg-[#006699] rounded-full flex items-center justify-center shadow-xl shadow-[#0088cc]/30 transition-all transform group-hover:scale-110">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/90 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap">
                        Telegram 📣
                    </div>
                </div>
            </div>
        </a>
    );
}
