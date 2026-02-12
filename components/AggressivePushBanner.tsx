"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Zap, Gift, Sparkles, AlertTriangle } from "lucide-react";
import { usePush } from "@/providers/PushProvider";

/**
 * Aggressive Push Notification CTA Banner
 * - Slides in from Right to Left
 * - Big and prominent
 * - Shows on mobile and desktop
 * - Persists until user subscribes (no cooldown)
 * - Somali language with high CTR copy
 */
export function AggressivePushBanner() {
    const { isSubscribed, isSupported, subscribe, isLoading } = usePush();
    const [isVisible, setIsVisible] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [dismissedAt, setDismissedAt] = useState<number | null>(null);

    // Check if should show the banner
    useEffect(() => {
        // Don't show if already subscribed
        if (isSubscribed) {
            setIsVisible(false);
            return;
        }

        // Don't show if notifications not supported
        if (!isSupported) {
            setIsVisible(false);
            return;
        }

        // Check if dismissed recently (only 30 seconds cooldown - very aggressive)
        const dismissedTime = localStorage.getItem("fanbroj_push_banner_dismissed");
        if (dismissedTime) {
            const elapsed = Date.now() - parseInt(dismissedTime);
            const cooldown = 30 * 1000; // 30 seconds only!
            if (elapsed < cooldown) {
                // Set timer to show again after cooldown
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, cooldown - elapsed);
                return () => clearTimeout(timer);
            }
        }

        // Show after 2 seconds delay
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, [isSubscribed, isSupported]);

    // Handle subscribe
    const handleSubscribe = async () => {
        setIsSubscribing(true);
        try {
            const success = await subscribe();
            if (success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setIsVisible(false);
                }, 2000);
            }
        } catch (error) {
            console.error("[AggressivePushBanner] Subscribe error:", error);
        } finally {
            setIsSubscribing(false);
        }
    };

    // Handle dismiss - very short cooldown
    const handleDismiss = () => {
        localStorage.setItem("fanbroj_push_banner_dismissed", Date.now().toString());
        setIsVisible(false);

        // Show again in 30 seconds
        setTimeout(() => {
            if (!isSubscribed) {
                setIsVisible(true);
            }
        }, 30 * 1000);
    };

    // Don't render if subscribed (don't hide on isLoading - causes flash)
    if (isSubscribed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop overlay for mobile - semi-transparent */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
                        onClick={handleDismiss}
                    />

                    {/* Main Banner - slides from RIGHT to LEFT */}
                    <motion.div
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            duration: 0.5
                        }}
                        className="fixed z-[9999] 
              bottom-4 right-4 left-4 md:bottom-8 md:right-8 md:left-auto
              max-w-lg w-full md:w-auto
              bg-gradient-to-r from-[#E50914] via-[#ff3d47] to-[#E50914]
              rounded-2xl shadow-2xl shadow-red-500/30
              border border-white/20
              overflow-hidden"
                    >
                        {/* Animated background particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-4 -left-4 w-20 h-20 bg-yellow-400/30 rounded-full blur-2xl animate-pulse" />
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-500/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "0.5s" }} />
                        </div>

                        {/* Content */}
                        <div className="relative p-5 md:p-6">
                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} className="text-white" />
                            </button>

                            {showSuccess ? (
                                /* Success State */
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-16 h-16 mx-auto mb-3 bg-green-500 rounded-full flex items-center justify-center">
                                        <Sparkles size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-1">
                                        🎉 Waad ku guuleysatay!
                                    </h3>
                                    <p className="text-white/80 text-sm">
                                        Hadda waxaad helaysaa ogeysiisyada cusub
                                    </p>
                                </motion.div>
                            ) : (
                                /* Main CTA Content */
                                <div className="flex flex-col gap-4">
                                    {/* Header with icon */}
                                    <div className="flex items-start gap-4">
                                        {/* Animated bell icon */}
                                        <div className="relative flex-shrink-0">
                                            <motion.div
                                                animate={{
                                                    rotate: [0, -10, 10, -10, 10, 0],
                                                    scale: [1, 1.1, 1]
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    repeat: Infinity,
                                                    repeatDelay: 2
                                                }}
                                                className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center shadow-lg"
                                            >
                                                <Bell size={28} className="text-[#E50914]" />
                                            </motion.div>
                                            {/* Notification dot */}
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-black text-black animate-bounce">
                                                !
                                            </span>
                                        </div>

                                        {/* Text content */}
                                        <div className="flex-1 pr-6">
                                            <h2 className="text-lg md:text-xl font-black text-white leading-tight mb-1">
                                                🔔 HA KA MAQNAAN CIYAARAHA!
                                            </h2>
                                            <p className="text-white/90 text-sm md:text-base font-medium">
                                                Hel ogeysiisyo toos ah - LIVE, Filimada Cusub & Wararka!
                                            </p>
                                        </div>
                                    </div>

                                    {/* Benefits list */}
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-white font-semibold">
                                            <Zap size={12} /> Live Alerts
                                        </span>
                                        <span className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-white font-semibold">
                                            <Gift size={12} /> Filimada Cusub
                                        </span>
                                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-400/30 rounded-full text-yellow-100 font-semibold">
                                            ⚡ FREE
                                        </span>
                                    </div>

                                    {/* CTA Button - Big and prominent */}
                                    <motion.button
                                        onClick={handleSubscribe}
                                        disabled={isSubscribing}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-4 px-6 bg-white hover:bg-gray-100 
                      text-[#E50914] font-black text-lg md:text-xl 
                      rounded-xl shadow-lg
                      flex items-center justify-center gap-3
                      disabled:opacity-70 transition-all
                      uppercase tracking-wide"
                                    >
                                        {isSubscribing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <Bell size={24} className="animate-pulse" />
                                                OGGOLOW HADDA! 🚀
                                            </>
                                        )}
                                    </motion.button>

                                    {/* Urgency text */}
                                    <p className="text-center text-white/70 text-xs flex items-center justify-center gap-1">
                                        <AlertTriangle size={12} />
                                        Ha seegine - Waa bilaash oo daciifa!
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
