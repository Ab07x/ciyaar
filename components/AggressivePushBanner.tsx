"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Sparkles } from "lucide-react";
import { usePush } from "@/providers/PushProvider";

export function AggressivePushBanner() {
    const { isSubscribed, isSupported, subscribe, isLoading } = usePush();
    const [isVisible, setIsVisible] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (isSubscribed || !isSupported) { setIsVisible(false); return; }

        const dismissedTime = localStorage.getItem("fanbroj_push_banner_dismissed");
        if (dismissedTime) {
            const elapsed = Date.now() - parseInt(dismissedTime);
            const cooldown = 30_000;
            if (elapsed < cooldown) {
                const t = setTimeout(() => setIsVisible(true), cooldown - elapsed);
                return () => clearTimeout(t);
            }
        }
        const t = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(t);
    }, [isSubscribed, isSupported]);

    const handleSubscribe = async () => {
        setIsSubscribing(true);
        try {
            const ok = await subscribe();
            if (ok) { setShowSuccess(true); setTimeout(() => setIsVisible(false), 2200); }
        } catch { /* ignore */ } finally { setIsSubscribing(false); }
    };

    const handleDismiss = () => {
        localStorage.setItem("fanbroj_push_banner_dismissed", Date.now().toString());
        setIsVisible(false);
        setTimeout(() => { if (!isSubscribed) setIsVisible(true); }, 30_000);
    };

    if (isSubscribed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    <style>{`
                        @keyframes pbBellSway {
                            0%,100% { transform: rotate(0deg); }
                            20%     { transform: rotate(-12deg); }
                            40%     { transform: rotate(10deg); }
                            60%     { transform: rotate(-8deg); }
                            80%     { transform: rotate(6deg); }
                        }
                        @keyframes pbGlow {
                            0%,100% { box-shadow: 0 0 12px rgba(245,166,35,0.3); }
                            50%     { box-shadow: 0 0 28px rgba(245,166,35,0.65); }
                        }
                        @keyframes pbShimmer {
                            from { transform: translateX(-130%); }
                            to   { transform: translateX(130%); }
                        }
                        @keyframes pbDot {
                            0%,100% { opacity: 0.15; }
                            50%     { opacity: 0.45; }
                        }
                    `}</style>

                    {/* Mobile backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[9998] md:hidden"
                        onClick={handleDismiss}
                    />

                    {/* Card */}
                    <motion.div
                        initial={{ x: "110%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "110%", opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="fixed z-[9999] bottom-4 right-4 left-4 md:bottom-8 md:right-8 md:left-auto md:w-[340px]"
                        style={{
                            borderRadius: "20px",
                            background: "linear-gradient(160deg,#180e03 0%,#0e0a00 55%,#0a0500 100%)",
                            border: "1px solid rgba(245,166,35,0.22)",
                            boxShadow: "0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,166,35,0.06)",
                            overflow: "hidden",
                        }}
                    >
                        {/* Film perforation dots — left */}
                        <div className="absolute left-0 inset-y-0 w-[14px] flex flex-col justify-evenly items-center pointer-events-none"
                            style={{ background: "rgba(0,0,0,0.5)", borderRight: "1px solid rgba(245,166,35,0.1)" }}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="w-[6px] h-[6px] rounded-sm"
                                    style={{
                                        background: "rgba(245,166,35,0.15)",
                                        animation: `pbDot 3s ease-in-out ${i * 0.35}s infinite`,
                                    }} />
                            ))}
                        </div>
                        {/* Film perforation dots — right */}
                        <div className="absolute right-0 inset-y-0 w-[14px] flex flex-col justify-evenly items-center pointer-events-none"
                            style={{ background: "rgba(0,0,0,0.5)", borderLeft: "1px solid rgba(245,166,35,0.1)" }}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="w-[6px] h-[6px] rounded-sm"
                                    style={{
                                        background: "rgba(245,166,35,0.15)",
                                        animation: `pbDot 3s ease-in-out ${i * 0.35 + 0.17}s infinite`,
                                    }} />
                            ))}
                        </div>

                        {/* Top gold line */}
                        <div style={{ height: "2px", background: "linear-gradient(90deg,transparent,rgba(245,166,35,0.65),transparent)" }} />

                        {/* Content */}
                        <div className="relative px-6 py-4 pl-7 pr-7">
                            {/* Close */}
                            <button onClick={handleDismiss}
                                className="absolute top-3 right-5 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10"
                                style={{ background: "rgba(255,255,255,0.07)" }}>
                                <X size={13} className="text-white/50" />
                            </button>

                            {showSuccess ? (
                                /* Success */
                                <motion.div
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-3"
                                >
                                    <div className="text-3xl mb-2">🎬</div>
                                    <p className="font-black text-white text-sm">Waad ku guuleysatay!</p>
                                    <p className="text-[#f5a623]/70 text-xs mt-0.5">Waxaad helaysaa ogeysiisyada filimada cusub</p>
                                </motion.div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    {/* Bell icon with glow */}
                                    <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: "rgba(245,166,35,0.1)",
                                            border: "1px solid rgba(245,166,35,0.25)",
                                            animation: "pbGlow 2.5s ease-in-out infinite",
                                        }}>
                                        <Bell
                                            size={20}
                                            style={{
                                                color: "#f5a623",
                                                animation: "pbBellSway 3.5s ease-in-out 1s infinite",
                                                filter: "drop-shadow(0 0 6px rgba(245,166,35,0.5))",
                                            }}
                                        />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0 pr-5">
                                        <p className="font-black text-white text-sm leading-tight">
                                            🎬 Filimada Cusub Af Somali
                                        </p>
                                        <p className="text-white/45 text-[11px] mt-0.5 leading-snug">
                                            Hel ogeysiis kasta marka film Hindi cusub la daro
                                        </p>

                                        {/* Tags */}
                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            {["🎞 Film Cusub", "📺 Musalas", "⭐ Bilaash"].map((tag) => (
                                                <span key={tag}
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                    style={{
                                                        background: "rgba(245,166,35,0.1)",
                                                        border: "1px solid rgba(245,166,35,0.2)",
                                                        color: "rgba(245,166,35,0.8)",
                                                    }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!showSuccess && (
                                /* CTA */
                                <button onClick={handleSubscribe} disabled={isSubscribing}
                                    className="relative mt-3.5 w-full py-2.5 rounded-xl font-black text-black text-sm overflow-hidden flex items-center justify-center gap-2 transition-transform active:scale-[0.97] disabled:opacity-60"
                                    style={{
                                        background: "linear-gradient(135deg,#ffd54f 0%,#f5a623 50%,#c8790a 100%)",
                                        boxShadow: "0 3px 16px rgba(245,166,35,0.35)",
                                    }}>
                                    {/* shimmer */}
                                    <span className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.38) 50%,transparent 70%)",
                                            animation: "pbShimmer 2.6s ease-in-out infinite",
                                        }} />
                                    {isSubscribing ? (
                                        <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Bell size={15} />
                                            <span className="relative">OGGOLOW — Bilaash</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Bottom gold line */}
                        <div style={{ height: "2px", background: "linear-gradient(90deg,transparent,rgba(245,166,35,0.65),transparent)" }} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
