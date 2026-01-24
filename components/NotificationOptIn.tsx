"use client";

import { useState } from "react";
import { Bell, BellOff, Check, X } from "lucide-react";
import { usePush } from "@/providers/PushProvider";
import { cn } from "@/lib/utils";

export function NotificationOptIn() {
    const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePush();
    const [isLoading, setIsLoading] = useState(false);
    const [showBanner, setShowBanner] = useState(true);

    if (!isSupported || isSubscribed || permission === "denied" || !showBanner) {
        return null;
    }

    const handleSubscribe = async () => {
        setIsLoading(true);
        const success = await subscribe();
        setIsLoading(false);
        if (success) {
            setShowBanner(false);
        }
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
                        <div className="flex gap-2">
                            <button
                                onClick={handleSubscribe}
                                disabled={isLoading}
                                className="flex-1 bg-accent-green text-black font-bold py-2 px-4 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    "Loading..."
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Oggolow
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowBanner(false)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
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
