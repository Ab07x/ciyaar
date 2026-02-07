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
            className={`fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 md:max-w-[320px] transition-all duration-300 ${exiting
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100 animate-in slide-in-from-bottom-2"
                }`}
        >
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg flex items-center gap-3 px-3 py-2.5">
                {/* Bell icon */}
                <div className="shrink-0 w-8 h-8 bg-[#E50914] rounded-lg flex items-center justify-center">
                    <Bell size={14} className="text-white" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-xs font-semibold leading-tight">
                        Ogeysiisyo cusub - Fanbroj.net
                    </p>
                    {error && (
                        <p className="text-red-500 text-[10px] mt-0.5">{error}</p>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={handleSubscribe}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-[#E50914] hover:bg-[#b8070f] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Oggolow"
                        )}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
