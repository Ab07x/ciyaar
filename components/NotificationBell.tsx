"use client";

import { useState } from "react";
import { Bell, BellRing, X, Check } from "lucide-react";
import { usePush } from "@/providers/PushProvider";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
    const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePush();
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Don't render if push not supported
    if (!isSupported) return null;

    const handleToggle = async () => {
        setActionLoading(true);
        try {
            if (isSubscribed) {
                await unsubscribe();
            } else {
                await subscribe();
            }
        } catch (error) {
            console.error("Toggle notification error:", error);
        }
        setActionLoading(false);
        setShowDropdown(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={cn(
                    "relative p-2 rounded-lg transition-all duration-200",
                    isSubscribed
                        ? "text-[#9AE600] hover:bg-[#9AE600]/10"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                    className
                )}
                aria-label={isSubscribed ? "Notifications enabled" : "Enable notifications"}
            >
                {isSubscribed ? (
                    <BellRing size={20} className="animate-pulse" />
                ) : (
                    <Bell size={20} />
                )}

                {/* Status dot */}
                {isSubscribed && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#9AE600] rounded-full" />
                )}

                {/* Unsubscribed indicator - show red dot */}
                {!isSubscribed && !isLoading && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown menu */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    isSubscribed ? "bg-[#9AE600]/20" : "bg-gray-100"
                                )}>
                                    {isSubscribed ? (
                                        <BellRing size={20} className="text-[#9AE600]" />
                                    ) : (
                                        <Bell size={20} className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {isSubscribed ? "Ogeysiisyada Shidhan" : "Ogeysiisyada Damsan"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {isSubscribed ? "Waxaad helaysaa updates" : "Shid si aad u hesho updates"}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleToggle}
                                disabled={actionLoading || isLoading}
                                className={cn(
                                    "w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                                    isSubscribed
                                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                                        : "bg-[#9AE600] text-black hover:bg-[#8BD500]",
                                    (actionLoading || isLoading) && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {actionLoading || isLoading ? (
                                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : isSubscribed ? (
                                    <>
                                        <X size={16} />
                                        Damso
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Shid Ogeysiisyada
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
