"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePush } from "@/providers/PushProvider";
import { useToast } from "@/providers/ToastProvider";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface MatchReminderButtonProps {
    matchId: Id<"matches">;
    className?: string;
    variant?: "icon" | "full";
}

export function MatchReminderButton({ matchId, className, variant = "icon" }: MatchReminderButtonProps) {
    const { isSubscribed, subscribe } = usePush();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Get device ID from local storage
    const [deviceId, setDeviceId] = useState<string>("");
    useEffect(() => {
        const id = localStorage.getItem("device_id") || crypto.randomUUID();
        localStorage.setItem("device_id", id);
        setDeviceId(id);
    }, []);

    const isReminded = useQuery(api.reminders.getReminderStatus,
        matchId ? { matchId, deviceId } : "skip"
    );

    const toggleReminder = useMutation(api.reminders.toggleReminder);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isSubscribed) {
            const success = await subscribe();
            if (!success) {
                toast("Fadlan oggolow ogeysiisyada si aad u isticmaasho feature-kan", "error");
                return;
            }
        }

        setIsLoading(true);
        try {
            const result = await toggleReminder({
                matchId,
                deviceId,
            });

            if (result.action === "added") {
                toast("Ogeysiis ayaa laguu soo diri doonaa wakhtiga ciyaarta!", "success");
            } else {
                toast("Ogeysiis dambe laguma soo diri doono ciyaartan.", "info");
            }
        } catch (error) {
            console.error("Failed to toggle reminder", error);
            toast("Waan ka xunnahay, khalad ayaa dhacay.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === "full") {
        return (
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={cn(
                    "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95",
                    isReminded
                        ? "bg-accent-green/20 text-accent-green border border-accent-green/30"
                        : "bg-white/10 text-white hover:bg-white/20 border border-transparent",
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : isReminded ? (
                    <>
                        <BellOff size={18} />
                        <span>Iska Jooji</span>
                    </>
                ) : (
                    <>
                        <Bell size={18} />
                        <span>I soo Xasuusi</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
                "p-2 rounded-lg transition-all duration-200",
                isReminded
                    ? "bg-accent-green text-black shadow-lg shadow-accent-green/20"
                    : "bg-black/40 text-white hover:bg-white/20 border border-white/10",
                className
            )}
            title={isReminded ? "Jooji xasuusinta" : "I soo xasuusi ciyaartan"}
        >
            {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
            ) : isReminded ? (
                <BellOff size={16} />
            ) : (
                <Bell size={16} />
            )}
        </button>
    );
}
