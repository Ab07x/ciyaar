"use client";

import { useEffect, useState, useRef } from "react";
import { getCountdownValues } from "@/lib/date-utils";

interface CountdownTimerProps {
    kickoffAt: number;
    onComplete?: () => void;
}

export function CountdownTimer({ kickoffAt, onComplete }: CountdownTimerProps) {
    const [countdown, setCountdown] = useState(getCountdownValues(kickoffAt));
    const hasCalledComplete = useRef(false);

    useEffect(() => {
        // If already started, don't set up interval
        const initialValues = getCountdownValues(kickoffAt);
        if (initialValues.isStarted) {
            setCountdown(initialValues);
            return;
        }

        const interval = setInterval(() => {
            const values = getCountdownValues(kickoffAt);
            setCountdown(values);

            // Only call onComplete ONCE when countdown finishes
            if (values.isStarted && onComplete && !hasCalledComplete.current) {
                hasCalledComplete.current = true;
                clearInterval(interval);
                if (onComplete) onComplete();
                // Don't auto-reload, just update UI
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [kickoffAt, onComplete]);

    if (countdown.isStarted) {
        return (
            <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full mb-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-yellow-500 text-sm font-medium">SOO SOCDA</span>
                </div>
                <p className="text-xl font-bold text-text-secondary mb-2">
                    Ciyaartu waa ay bilaaban lahayd
                </p>
                <p className="text-sm text-text-muted mb-4">
                    Waxaan sugaynaa in la bilaabo ciyaarta...
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-stadium-elevated border border-border-subtle text-white font-bold rounded-lg hover:bg-stadium-hover transition-colors"
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-4 py-8">
            <div className="text-center">
                <div className="text-4xl font-bold text-accent-green">
                    {countdown.days}
                </div>
                <div className="text-xs text-text-muted mt-1">Maalmood</div>
            </div>
            <div className="text-3xl text-text-muted">:</div>
            <div className="text-center">
                <div className="text-4xl font-bold text-accent-green">
                    {String(countdown.hours).padStart(2, "0")}
                </div>
                <div className="text-xs text-text-muted mt-1">Saacadood</div>
            </div>
            <div className="text-3xl text-text-muted">:</div>
            <div className="text-center">
                <div className="text-4xl font-bold text-accent-green">
                    {String(countdown.minutes).padStart(2, "0")}
                </div>
                <div className="text-xs text-text-muted mt-1">Daqiiqo</div>
            </div>
            <div className="text-3xl text-text-muted">:</div>
            <div className="text-center">
                <div className="text-4xl font-bold text-accent-green">
                    {String(countdown.seconds).padStart(2, "0")}
                </div>
                <div className="text-xs text-text-muted mt-1">Ilbiriqsi</div>
            </div>
        </div>
    );
}
