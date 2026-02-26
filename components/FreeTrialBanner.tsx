"use client";

import { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@/lib/utils";

const REQUIRED_SHARES = 3;

export function FreeTrialBanner() {
    const { isPremium, isLoading } = useUser();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [shareCount, setShareCount] = useState(0);
    const [justShared, setJustShared] = useState(false);

    useEffect(() => {
        setMounted(true);
        const dismissedUntil = localStorage.getItem("ftDismissedUntil");
        if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
            setDismissed(true);
            return;
        }
        const saved = Number(localStorage.getItem("ftShareCount") || "0");
        setShareCount(saved);
        const t = setTimeout(() => setVisible(true), 3500);
        return () => clearTimeout(t);
    }, []);

    if (!mounted || isLoading || isPremium || dismissed) return null;

    const remaining = Math.max(0, REQUIRED_SHARES - shareCount);
    const isUnlocked = shareCount >= REQUIRED_SHARES;

    const handleDismiss = () => {
        setVisible(false);
        localStorage.setItem("ftDismissedUntil", String(Date.now() + 24 * 60 * 60 * 1000));
        setTimeout(() => setDismissed(true), 400);
    };

    const handleShare = () => {
        const url = typeof window !== "undefined" ? window.location.origin : "https://fanbroj.net";
        const text = "🎬 Daawo filimada ugu fiican Hindi Af Somali — Fanbroj! Hel 14 maalmood bilaash ah:";
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank", "width=600,height=400");

        const next = Math.min(REQUIRED_SHARES, shareCount + 1);
        setShareCount(next);
        localStorage.setItem("ftShareCount", String(next));
        if (next >= REQUIRED_SHARES) localStorage.setItem("ftUnlocked", "true");
        setJustShared(true);
        setTimeout(() => setJustShared(false), 1800);
    };

    return (
        <>
            <style>{`
                @keyframes ftSlideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
                @keyframes ftPop {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.18); }
                    100% { transform: scale(1); }
                }
                @keyframes ftGlow {
                    0%,100% { box-shadow: 0 0 0 rgba(34,197,94,0); }
                    50%     { box-shadow: 0 0 18px rgba(34,197,94,0.45); }
                }
            `}</style>

            <div
                className={cn(
                    "fixed z-[9990] transition-all duration-400",
                    /* mobile: full-width slim strip above bottom nav */
                    "bottom-[72px] left-3 right-3",
                    /* desktop: compact card bottom-right */
                    "md:bottom-6 md:left-auto md:right-5 md:w-[340px]",
                    visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none translate-y-4",
                )}
                style={visible ? { animation: "ftSlideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both" } : {}}
            >
                {/* Card */}
                <div className="relative rounded-2xl overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg,#052e16 0%,#064e3b 50%,#065f46 100%)",
                        border: "1px solid rgba(52,211,153,0.25)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(52,211,153,0.08)",
                    }}>

                    {/* top shimmer line */}
                    <div style={{
                        height: "2px",
                        background: "linear-gradient(90deg,transparent,rgba(52,211,153,0.7),transparent)",
                    }} />

                    {/* Close */}
                    <button onClick={handleDismiss}
                        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10"
                        style={{ background: "rgba(255,255,255,0.08)" }}>
                        <X size={13} className="text-white/60" />
                    </button>

                    <div className="px-4 pt-3.5 pb-4">
                        {isUnlocked ? (
                            /* ── Unlocked state ── */
                            <div className="text-center py-1">
                                <div className="text-2xl mb-1">🎉</div>
                                <p className="font-black text-white text-sm">Premium Bilaash Wuu Furmay!</p>
                                <p className="text-emerald-300/70 text-xs mt-0.5">14 maalmood wuu bilaabmayaa</p>
                            </div>
                        ) : (
                            /* ── Main state ── */
                            <div className="flex items-center gap-3 md:block">

                                {/* Mobile: horizontal layout | Desktop: stacked */}
                                <div className="flex-1 md:mb-3">
                                    {/* Label + headline */}
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">
                                            Special Offer
                                        </span>
                                    </div>
                                    <h3 className="text-white font-black text-sm md:text-base leading-tight">
                                        🎁 14 Maalmood{" "}
                                        <span style={{ color: "#4ade80" }}>BILAASH</span>
                                    </h3>
                                    <p className="text-white/55 text-[11px] mt-0.5 hidden md:block">
                                        La wadaag 3 saaxiibood WhatsApp-ka
                                    </p>
                                </div>

                                {/* Progress dots */}
                                <div className="flex items-center gap-1.5 md:mb-3">
                                    {Array.from({ length: REQUIRED_SHARES }).map((_, i) => (
                                        <div key={i}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-500"
                                            style={i < shareCount ? {
                                                background: "linear-gradient(135deg,#4ade80,#16a34a)",
                                                color: "#000",
                                                animation: i === shareCount - 1 && justShared ? "ftPop 0.4s ease" : undefined,
                                                boxShadow: "0 0 8px rgba(74,222,128,0.5)",
                                            } : {
                                                background: "rgba(255,255,255,0.08)",
                                                border: "1px solid rgba(255,255,255,0.15)",
                                                color: "rgba(255,255,255,0.3)",
                                            }}>
                                            {i < shareCount ? "✓" : i + 1}
                                        </div>
                                    ))}
                                    {remaining > 0 && (
                                        <span className="text-[10px] text-white/40 ml-1 hidden md:inline">
                                            {remaining} baahi
                                        </span>
                                    )}
                                </div>

                                {/* Share button */}
                                <button onClick={handleShare}
                                    className="flex items-center gap-2 rounded-xl font-black text-white text-[13px] transition-transform active:scale-95 flex-shrink-0 md:w-full md:justify-center"
                                    style={{
                                        background: "linear-gradient(135deg,#25D366,#128C7E)",
                                        padding: "8px 14px",
                                        boxShadow: "0 2px 12px rgba(37,211,102,0.35)",
                                        animation: "ftGlow 2s ease-in-out infinite",
                                    }}>
                                    <MessageCircle size={15} />
                                    <span className="hidden sm:inline">La Wadaag</span>
                                    <span className="sm:hidden">Wadaag</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
