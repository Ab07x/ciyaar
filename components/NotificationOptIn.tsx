"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, AlertCircle } from "lucide-react";
import { usePush } from "@/providers/PushProvider";

export function NotificationOptIn() {
    const { isSupported, isSubscribed, permission, subscribe } = usePush();
    const [isLoading, setIsLoading] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check if user dismissed before
        const dismissed = localStorage.getItem("push_banner_dismissed");
        const subscribed = localStorage.getItem("push_subscribed");
        if (!dismissed && !subscribed) {
            setShowBanner(true);
        }
    }, []);

    // Hide banner if subscribed
    useEffect(() => {
        if (isSubscribed) {
            localStorage.setItem("push_subscribed", "true");
            setShowBanner(false);
        }
    }, [isSubscribed]);

    if (!mounted || !isSupported || isSubscribed || permission === "denied" || !showBanner) {
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
                // User denied or something went wrong
                if (Notification.permission === "denied") {
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

    const handleDismiss = () => {
        localStorage.setItem("push_banner_dismissed", "true");
        setShowBanner(false);
    };

    return (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-accent-green/20 to-accent-gold/20 backdrop-blur-lg border border-accent-green/30 rounded-2xl p-4 shadow-2xl">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-accent-green rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell size={20} className="text-black" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">Oggolow Ogeysiisyada</h3>
                        <p className="text-sm text-white/80 mb-3">
                            Hel ogeysiis markii ciyaaraha bilowdo iyo filimada cusub
                        </p>
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm mb-3 bg-red-500/10 p-2 rounded-lg">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleSubscribe}
                                disabled={isLoading}
                                className="flex-1 bg-accent-green text-black font-bold py-2 px-4 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">Loading...</span>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Oggolow
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                title="Xir"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
