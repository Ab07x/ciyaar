"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { usePush } from "@/providers/PushProvider";

const STORAGE_KEY = "push_prompt_state";
const INITIAL_DELAY_MS = 3000;

interface PromptState {
    showCount: number;
    lastDismissed: number;
    subscribed: boolean;
}

function getPromptState(): PromptState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    if (localStorage.getItem("push_subscribed") === "true") {
        return { showCount: 0, lastDismissed: 0, subscribed: true };
    }
    return { showCount: 0, lastDismissed: 0, subscribed: false };
}

function savePromptState(state: PromptState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.subscribed) {
        localStorage.setItem("push_subscribed", "true");
    }
}

export function NotificationOptIn() {
    const { isSupported, isSubscribed, subscribe } = usePush();
    const [isLoading, setIsLoading] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        setMounted(true);
        const state = getPromptState();
        if (state.subscribed) return;

        const timer = setTimeout(() => {
            const currentState = getPromptState();
            if (!currentState.subscribed) {
                setShowBanner(true);
            }
        }, INITIAL_DELAY_MS);

        return () => clearTimeout(timer);
    }, []);

    const closeBanner = useCallback(() => {
        setExiting(true);
        setTimeout(() => {
            setShowBanner(false);
            setExiting(false);
        }, 300);
    }, []);

    const handleDismiss = () => {
        savePromptState({
            ...getPromptState(),
            showCount: getPromptState().showCount + 1,
            lastDismissed: Date.now(),
        });
        closeBanner();
    };

    const handleSubscribe = async () => {
        setIsLoading(true);
        setError("");
        try {
            const success = await subscribe();
            if (success) {
                savePromptState({ ...getPromptState(), subscribed: true });
                closeBanner();
            } else {
                if (typeof Notification !== "undefined" && Notification.permission === "denied") {
                    setError("Browser settings-ka ka oggolow ogeysiisyada");
                } else {
                    setError("Isku day markale");
                }
            }
        } catch (err) {
            console.error("Push subscription error:", err);
            setError("Isku day markale");
        }
        setIsLoading(false);
    };

    if (!mounted || !isSupported || isSubscribed || !showBanner) {
        return null;
    }

    return (
        <div
            className={`fixed bottom-20 md:bottom-6 left-4 right-4 md:right-auto md:left-6 z-50 w-full md:max-w-[420px] transition-all duration-300 ${exiting
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100 animate-in slide-in-from-bottom-2"
                }`}
        >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl flex items-center gap-4 px-5 py-4">
                {/* App Icon */}
                <div className="shrink-0 w-14 h-14 bg-black rounded-xl overflow-hidden shadow-sm">
                    <img src="/icon-192.png" alt="Fanbroj" className="w-full h-full object-cover" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-base font-bold leading-tight mb-1">
                        Ogeysiisyo cusub
                    </p>
                    <p className="text-gray-500 text-xs line-clamp-2 leading-snug">
                        La soco filimada iyo ciyaaraha cusub ee tooska ah. Iska qor hadda!
                    </p>
                    {error && (
                        <p className="text-red-500 text-[10px] mt-1 font-medium bg-red-50 px-2 py-0.5 rounded-md inline-block">{error}</p>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                    <button
                        onClick={handleSubscribe}
                        disabled={isLoading}
                        className="px-4 py-2 bg-[#E50914] hover:bg-[#b8070f] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Oggolow"
                        )}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium underline decoration-gray-300 underline-offset-2"
                    >
                        May, mahadsanid
                    </button>
                </div>
            </div>
        </div>
    );
}
