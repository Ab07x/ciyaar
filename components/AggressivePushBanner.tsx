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
                        @keyframes pbBellRing {
                            0%, 100% { transform: rotate(0deg); }
                            10% { transform: rotate(-15deg); }
                            20% { transform: rotate(14deg); }
                            30% { transform: rotate(-12deg); }
                            40% { transform: rotate(10deg); }
                            50% { transform: rotate(-6deg); }
                            60% { transform: rotate(4deg); }
                            70% { transform: rotate(-2deg); }
                            80%, 100% { transform: rotate(0deg); }
                        }
                        @keyframes pbBellGlow {
                            0%, 100% { filter: drop-shadow(0 0 4px rgba(229,9,20,0.4)); }
                            50% { filter: drop-shadow(0 0 12px rgba(229,9,20,0.9)) drop-shadow(0 0 20px rgba(229,9,20,0.4)); }
                        }
                        @keyframes pbIconPulse {
                            0%, 100% { box-shadow: 0 0 8px rgba(229,9,20,0.25), 0 0 0 0 rgba(229,9,20,0.3); }
                            50% { box-shadow: 0 0 16px rgba(229,9,20,0.5), 0 0 0 6px rgba(229,9,20,0); }
                        }
                        @keyframes pbBtnPulse {
                            0%, 100% { box-shadow: 0 4px 20px rgba(229,9,20,0.4), 0 0 0 0 rgba(229,9,20,0.3); }
                            50% { box-shadow: 0 4px 28px rgba(229,9,20,0.6), 0 0 0 4px rgba(229,9,20,0); }
                        }
                        @keyframes pbShimmer {
                            0% { transform: translateX(-150%); }
                            100% { transform: translateX(150%); }
                        }
                        @keyframes pbPerfDot {
                            0%, 100% { opacity: 0.12; }
                            50% { opacity: 0.35; }
                        }
                        @keyframes pbConfettiDrift {
                            0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
                            100% { transform: translateY(-60px) rotate(360deg) scale(0); opacity: 0; }
                        }
                        @keyframes pbSuccessGlow {
                            0%, 100% { text-shadow: 0 0 8px rgba(229,9,20,0.3); }
                            50% { text-shadow: 0 0 20px rgba(229,9,20,0.6), 0 0 40px rgba(229,9,20,0.2); }
                        }
                        @keyframes pbLineBreath {
                            0%, 100% { opacity: 0.6; }
                            50% { opacity: 1; }
                        }
                        .pb-push-card {
                            border-radius: 20px 20px 0 0;
                            border-bottom: none;
                        }
                        @media (min-width: 768px) {
                            .pb-push-card {
                                border-radius: 20px;
                                border-bottom: 1px solid rgba(229,9,20,0.2);
                                box-shadow: 0 12px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(229,9,20,0.05), 0 0 60px rgba(229,9,20,0.08);
                            }
                        }
                    `}</style>

                    {/* Mobile backdrop overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9998] md:hidden"
                        style={{ background: "rgba(0,0,0,0.72)" }}
                        onClick={handleDismiss}
                    />

                    {/* Banner card */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="pb-push-card fixed z-[9999] bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto md:w-[360px]"
                        style={{
                            background: "linear-gradient(165deg, #1a0000 0%, #0f0000 40%, #0a0000 70%, #050000 100%)",
                            border: "1px solid rgba(229,9,20,0.2)",
                            boxShadow: "0 -8px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(229,9,20,0.05), 0 0 60px rgba(229,9,20,0.08)",
                            overflow: "hidden",
                        }}
                    >
                        {/* Top accent line */}
                        <div style={{
                            height: "2px",
                            background: "linear-gradient(90deg, transparent, #E50914, #DC2626, #E50914, transparent)",
                            animation: "pbLineBreath 3s ease-in-out infinite",
                        }} />

                        {/* Film perforation strip -- left */}
                        <div
                            className="absolute left-0 inset-y-0 w-[12px] flex flex-col justify-evenly items-center pointer-events-none"
                            style={{ background: "rgba(0,0,0,0.6)", borderRight: "1px solid rgba(229,9,20,0.08)" }}
                        >
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="w-[5px] h-[5px] rounded-sm"
                                    style={{
                                        background: "rgba(229,9,20,0.15)",
                                        animation: `pbPerfDot 3s ease-in-out ${i * 0.3}s infinite`,
                                    }} />
                            ))}
                        </div>

                        {/* Film perforation strip -- right */}
                        <div
                            className="absolute right-0 inset-y-0 w-[12px] flex flex-col justify-evenly items-center pointer-events-none"
                            style={{ background: "rgba(0,0,0,0.6)", borderLeft: "1px solid rgba(229,9,20,0.08)" }}
                        >
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="w-[5px] h-[5px] rounded-sm"
                                    style={{
                                        background: "rgba(229,9,20,0.15)",
                                        animation: `pbPerfDot 3s ease-in-out ${i * 0.3 + 0.15}s infinite`,
                                    }} />
                            ))}
                        </div>

                        {/* Content area */}
                        <div className="relative px-7 py-5" style={{ marginLeft: "12px", marginRight: "12px" }}>

                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10"
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <X size={14} className="text-white/40" />
                            </button>

                            {showSuccess ? (
                                /* Success state */
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                    className="text-center py-4"
                                >
                                    {/* Confetti particles */}
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute"
                                                style={{
                                                    left: `${10 + (i * 7) % 80}%`,
                                                    top: `${50 + (i % 3) * 15}%`,
                                                    width: i % 3 === 0 ? "6px" : i % 3 === 1 ? "4px" : "8px",
                                                    height: i % 3 === 0 ? "6px" : i % 3 === 1 ? "4px" : "3px",
                                                    borderRadius: i % 2 === 0 ? "50%" : "1px",
                                                    background: i % 4 === 0
                                                        ? "#E50914"
                                                        : i % 4 === 1
                                                        ? "#FFD700"
                                                        : i % 4 === 2
                                                        ? "#fff"
                                                        : "#DC2626",
                                                    animation: `pbConfettiDrift ${1.2 + (i % 4) * 0.3}s ease-out ${i * 0.08}s forwards`,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div className="text-4xl mb-3" style={{ animation: "pbSuccessGlow 2s ease-in-out infinite" }}>
                                        🎬
                                    </div>
                                    <p className="font-black text-white text-base" style={{
                                        animation: "pbSuccessGlow 2s ease-in-out infinite",
                                    }}>
                                        Waad ku guuleysatay!
                                    </p>
                                    <p className="text-sm mt-1.5" style={{ color: "rgba(229,9,20,0.7)" }}>
                                        Waxaad helaysaa ogeysiisyada filimada cusub
                                    </p>

                                    <div className="flex items-center justify-center gap-1 mt-3">
                                        <Sparkles size={14} style={{ color: "#E50914" }} />
                                        <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                                            Push notifications activated
                                        </span>
                                        <Sparkles size={14} style={{ color: "#E50914" }} />
                                    </div>
                                </motion.div>
                            ) : (
                                /* Main prompt content */
                                <>
                                    <div className="flex items-start gap-3.5">
                                        {/* Bell icon container */}
                                        <div
                                            className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(229,9,20,0.15), rgba(185,28,28,0.08))",
                                                border: "1px solid rgba(229,9,20,0.25)",
                                                animation: "pbIconPulse 2.5s ease-in-out infinite",
                                            }}
                                        >
                                            <Bell
                                                size={22}
                                                style={{
                                                    color: "#E50914",
                                                    animation: "pbBellRing 3s ease-in-out 0.5s infinite, pbBellGlow 2.5s ease-in-out infinite",
                                                }}
                                            />
                                        </div>

                                        {/* Text content */}
                                        <div className="flex-1 min-w-0 pr-6">
                                            <p className="font-black text-white text-[15px] leading-tight tracking-tight">
                                                Hel Ogeysiis Filimada Cusub!
                                            </p>
                                            <p className="text-[12px] mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>
                                                Marka film cusub la daro, adigu waxaad noqon doontaa kan ugu horreeya!
                                            </p>
                                        </div>
                                    </div>

                                    {/* Content type tags */}
                                    <div className="flex items-center gap-1.5 mt-3.5 flex-wrap">
                                        {[
                                            { label: "Film Cusub", emoji: "\uD83C\uDFAC" },
                                            { label: "Musalsal", emoji: "\uD83D\uDCFA" },
                                            { label: "HD Quality", emoji: "\u2B50" },
                                        ].map((tag) => (
                                            <span
                                                key={tag.label}
                                                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                                style={{
                                                    background: "rgba(229,9,20,0.08)",
                                                    border: "1px solid rgba(229,9,20,0.18)",
                                                    color: "rgba(229,9,20,0.85)",
                                                }}
                                            >
                                                {tag.emoji} {tag.label}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={handleSubscribe}
                                        disabled={isSubscribing}
                                        className="relative mt-4 w-full py-3 rounded-xl font-black text-white text-sm overflow-hidden flex items-center justify-center gap-2 transition-transform active:scale-[0.97] disabled:opacity-60"
                                        style={{
                                            background: "linear-gradient(135deg, #E50914 0%, #DC2626 40%, #B91C1C 100%)",
                                            animation: "pbBtnPulse 2.5s ease-in-out infinite",
                                            minHeight: "48px",
                                        }}
                                    >
                                        {/* Shimmer sweep */}
                                        <span
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
                                                animation: "pbShimmer 2.8s ease-in-out 1s infinite",
                                            }}
                                        />
                                        {isSubscribing ? (
                                            <div
                                                className="w-5 h-5 border-2 rounded-full animate-spin"
                                                style={{
                                                    borderColor: "rgba(255,255,255,0.3)",
                                                    borderTopColor: "#fff",
                                                }}
                                            />
                                        ) : (
                                            <>
                                                <Bell size={16} className="relative" />
                                                <span className="relative tracking-wide">OGGOLOW — Bilaash</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Bottom accent line */}
                        <div style={{
                            height: "2px",
                            background: "linear-gradient(90deg, transparent, #E50914, #DC2626, #E50914, transparent)",
                            animation: "pbLineBreath 3s ease-in-out 1.5s infinite",
                        }} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
