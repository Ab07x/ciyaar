"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { usePush } from "@/providers/PushProvider";

export function NotificationOptIn() {
    const { isSupported, isSubscribed, subscribe } = usePush();
    const [isLoading, setIsLoading] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Only check if already subscribed - show every time otherwise
        const subscribed = localStorage.getItem("push_subscribed");

        if (!subscribed) {
            // Show after 2 seconds on every page load until subscribed
            setTimeout(() => setShowBanner(true), 2000);
        }
    }, []);

    useEffect(() => {
        if (isSubscribed) {
            localStorage.setItem("push_subscribed", "true");
            setShowBanner(false);
        }
    }, [isSubscribed]);

    // When user closes without subscribing, show again after 10 seconds
    const handleDismiss = () => {
        setShowBanner(false);
        // Show again after 10 seconds if not subscribed
        setTimeout(() => {
            if (!localStorage.getItem("push_subscribed")) {
                setShowBanner(true);
            }
        }, 10000);
    };

    if (!mounted || !isSupported || isSubscribed || !showBanner) {
        return null;
    }

    const handleSubscribe = async () => {
        setIsLoading(true);
        setError("");
        try {
            const success = await subscribe();
            if (success) {
                localStorage.setItem("push_subscribed", "true");
                setShowBanner(false);
            } else {
                if (typeof Notification !== "undefined" && Notification.permission === "denied") {
                    setError("Fadlan u oggolow ogeysiisyada browser-kaaga settings");
                } else {
                    setError("Wax qalad ah ayaa dhacay. Isku day markale.");
                }
            }
        } catch (err) {
            console.error("Push subscription error:", err);
            setError("Wax qalad ah ayaa dhacay");
        }
        setIsLoading(false);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 animate-in fade-in duration-300"
                onClick={handleDismiss}
            />

            {/* Bottom Sheet Style Modal */}
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-[90%]">
                <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] md:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl border-t border-white/10 md:border">

                    {/* Close Button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                    >
                        <X size={18} className="text-white/70" />
                    </button>

                    {/* Animated Bell Icon */}
                    <div className="pt-8 pb-4 flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#9AE600]/30 rounded-full blur-xl animate-pulse" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-[#9AE600] to-[#7BC600] rounded-full flex items-center justify-center shadow-lg shadow-[#9AE600]/30">
                                <Bell size={36} className="text-black animate-[wiggle_1s_ease-in-out_infinite]" />
                            </div>
                            {/* Notification Badge */}
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-bounce">
                                1
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6 text-center">
                        <h3 className="text-2xl font-black text-white mb-2">
                            Hel <span className="text-[#9AE600]">Ogeysiisyo</span> Dhakhso ah! 🔔
                        </h3>
                        <p className="text-white/60 text-sm mb-6">
                            Si aad u hesho warka ugu cusub ee ciyaaraha iyo filimada
                        </p>

                        {/* Features - Horizontal Pills */}
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/80">
                                ⚽ Ciyaaraha Live
                            </span>
                            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/80">
                                🎬 Filimada Cusub
                            </span>
                            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/80">
                                🎁 Offers Gaar ah
                            </span>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* CTA Button */}
                        <button
                            onClick={handleSubscribe}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-[#9AE600] to-[#7BC600] text-black font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-[#9AE600]/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    <span>Loading...</span>
                                </div>
                            ) : (
                                <>
                                    <Bell size={20} />
                                    Oggolow Ogeysiisyada
                                </>
                            )}
                        </button>

                        {/* Dismiss Link */}
                        <button
                            onClick={handleDismiss}
                            className="mt-4 text-white/40 hover:text-white/60 text-sm transition-colors"
                        >
                            Hadda maya, kadib ayaan ogolaanahay
                        </button>
                    </div>
                </div>
            </div>

            {/* Keyframe for bell wiggle animation */}
            <style jsx>{`
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
            `}</style>
        </>
    );
}
