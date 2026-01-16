"use client";

import { useEffect, useState } from "react";
import { getCountdownValues } from "@/lib/date-utils";

interface CountdownTimerProps {
    kickoffAt: number;
    onComplete?: () => void;
}

export function CountdownTimer({ kickoffAt, onComplete }: CountdownTimerProps) {
    const [countdown, setCountdown] = useState(getCountdownValues(kickoffAt));

    useEffect(() => {
        const interval = setInterval(() => {
            const values = getCountdownValues(kickoffAt);
            setCountdown(values);

            if (values.isStarted && onComplete) {
                onComplete();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [kickoffAt, onComplete]);

    if (countdown.isStarted) {
        return (
            <div className="text-center py-8">
                <p className="text-2xl font-bold text-accent-green mb-2">
                    ✅ Ciyaartu hadda way bilaabatay
                </p>
                <p className="text-text-secondary">Dib u cusboonaysii boggan</p>
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
