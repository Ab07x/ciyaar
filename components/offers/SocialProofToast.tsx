"use client";

/**
 * SocialProofToast
 * Shows "Axmed from Minneapolis just subscribed" notifications in the bottom-left.
 * Cycles through items fetched from /api/offers/social-proof every 6–14 seconds.
 * Respects sessionStorage so it only shows the first 4 toasts per session.
 *
 * Usage: <SocialProofToast /> — drop in any layout/page, renders nothing for premium users.
 */

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ProofItem {
    name: string;
    city: string;
    plan: string;
    secsAgo: number;
}

const PLAN_LABELS: Record<string, string> = {
    monthly: "Monthly Pro",
    yearly:  "Elite Yearly",
    weekly:  "Weekly Plus",
    match:   "Starter",
};

function formatAgo(secsAgo: number): string {
    if (secsAgo < 60)        return `${secsAgo}s ago`;
    if (secsAgo < 3600)      return `${Math.floor(secsAgo / 60)}m ago`;
    return `${Math.floor(secsAgo / 3600)}h ago`;
}

const SESSION_KEY = "fbj_sp_count";
const MAX_PER_SESSION = 4;

export default function SocialProofToast() {
    const [items, setItems]       = useState<ProofItem[]>([]);
    const [current, setCurrent]   = useState<ProofItem | null>(null);
    const [visible, setVisible]   = useState(false);
    const indexRef                = useRef(0);
    const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shownCount              = useRef(0);

    // Fetch items once
    useEffect(() => {
        const count = parseInt(sessionStorage.getItem(SESSION_KEY) ?? "0", 10);
        if (count >= MAX_PER_SESSION) return;
        shownCount.current = count;

        fetch("/api/offers/social-proof")
            .then(r => r.ok ? r.json() : null)
            .then((d: { items: ProofItem[] } | null) => {
                if (d?.items?.length) setItems(d.items);
            })
            .catch(() => {});
    }, []);

    // Cycle through items
    useEffect(() => {
        if (!items.length) return;

        const showNext = () => {
            const count = parseInt(sessionStorage.getItem(SESSION_KEY) ?? "0", 10);
            if (count >= MAX_PER_SESSION) return;

            const item = items[indexRef.current % items.length];
            indexRef.current++;
            shownCount.current++;
            sessionStorage.setItem(SESSION_KEY, String(shownCount.current));

            setCurrent(item);
            setVisible(true);

            // Auto-hide after 5s
            timerRef.current = setTimeout(() => {
                setVisible(false);
                // Schedule next toast in 8–14s
                if (shownCount.current < MAX_PER_SESSION) {
                    const delay = 8000 + Math.random() * 6000;
                    timerRef.current = setTimeout(showNext, delay);
                }
            }, 5000);
        };

        // First toast: 8–15s after mount (don't interrupt page load)
        const initial = 8000 + Math.random() * 7000;
        timerRef.current = setTimeout(showNext, initial);

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [items]);

    if (!current) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-4 left-4 z-[9990] transition-all duration-500 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
        >
            <div className="flex items-center gap-3 bg-[#111] border border-white/15 rounded-xl px-3 py-2.5 shadow-xl max-w-[240px]">
                {/* Avatar initial */}
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 font-black text-sm">{current.name[0]}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold leading-tight truncate">
                        {current.name}
                        <span className="text-gray-400 font-normal"> from {current.city}</span>
                    </p>
                    <p className="text-green-400 text-[10px] flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        {PLAN_LABELS[current.plan] ?? current.plan} · {formatAgo(current.secsAgo)}
                    </p>
                </div>

                <button
                    onClick={() => setVisible(false)}
                    className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0 -mr-0.5"
                    aria-label="Dismiss"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
