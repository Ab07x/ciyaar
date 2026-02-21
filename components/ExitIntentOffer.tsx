"use client";

import { useEffect, useRef, useState } from "react";
import { X, Zap, Gift } from "lucide-react";
import useSWR from "swr";
import { PLAN_OPTIONS, getPlanPrice } from "@/lib/plans";

const fetcher = (url: string) => fetch(url).then(r => r.json());

/*
 * ExitIntentOffer
 * Shows a bottom-sheet offer when the user moves their cursor toward the top
 * of the viewport (about to leave) OR after 40 seconds of idle inactivity.
 * Shows max once per session — stored in sessionStorage.
 */
export default function ExitIntentOffer({ plan = "monthly" }: { plan?: "monthly" | "yearly" }) {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const shownRef = useRef(false);

    const { data: settings } = useSWR("/api/settings", fetcher);
    const { data: geo } = useSWR("/api/geo", fetcher);
    const geoMultiplier: number = (geo as any)?.multiplier ?? 1;

    const monthlyOption = PLAN_OPTIONS.find(p => p.id === "monthly")!;
    const yearlyOption  = PLAN_OPTIONS.find(p => p.id === "yearly")!;
    const monthlyPrice  = Math.round(getPlanPrice(settings, monthlyOption) * geoMultiplier * 100) / 100;
    const yearlyPrice   = Math.round(getPlanPrice(settings, yearlyOption)  * geoMultiplier * 100) / 100;
    const yearlySavePct = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

    const show = () => {
        if (shownRef.current) return;
        if (sessionStorage.getItem("fanbroj_exit_shown")) return;
        shownRef.current = true;
        sessionStorage.setItem("fanbroj_exit_shown", "1");
        setVisible(true);
        // Track
        fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "pageview", pageType: "exit_intent_shown", date: new Date().toISOString().split("T")[0] }),
        }).catch(() => {});
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (sessionStorage.getItem("fanbroj_exit_shown")) return;

        // Exit intent: cursor leaves toward the top
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY < 60) show();
        };

        // Idle timer: 40 seconds on page without action
        let idleTimer: ReturnType<typeof setTimeout>;
        const resetIdle = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(show, 40_000);
        };

        document.addEventListener("mouseleave", handleMouseLeave);
        ["mousemove", "keydown", "scroll", "click"].forEach(ev => document.addEventListener(ev, resetIdle, { passive: true }));
        resetIdle();

        return () => {
            document.removeEventListener("mouseleave", handleMouseLeave);
            ["mousemove", "keydown", "scroll", "click"].forEach(ev => document.removeEventListener(ev, resetIdle));
            clearTimeout(idleTimer);
        };
    }, []);

    if (!visible || dismissed) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
                onClick={() => setDismissed(true)}
            />

            {/* Bottom sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-300">
                <div className="max-w-lg mx-auto bg-[#0b1018] border border-white/10 rounded-t-2xl p-5 pb-8">
                    {/* Dismiss */}
                    <button
                        onClick={() => setDismissed(true)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <Gift size={16} className="text-yellow-400" />
                        <span className="text-xs font-black text-yellow-400 uppercase tracking-widest">Offer Gaar Ah</span>
                    </div>

                    <h2 className="text-xl font-black text-white mb-1">
                        Intaadan tago — daawo mar kale!
                    </h2>
                    <p className="text-sm text-gray-400 mb-5">
                        Premium furan maanta — bilaa xayeysiis, 12,000+ filim, ciyaaro live HD.
                    </p>

                    <div className="space-y-3">
                        {/* Monthly */}
                        <a
                            href="/pay?plan=monthly&auth=signup&ref=exit_intent"
                            className="flex items-center justify-between p-3.5 rounded-xl border-2 border-green-400 bg-green-500/10 hover:bg-green-500/20 transition-all"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-white">Monthly</span>
                                    <span className="text-[10px] bg-green-500 text-black font-black px-1.5 py-0.5 rounded-full">POPULAR</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">30 maalmood • Isla markiiba furmaa</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white">${monthlyPrice.toFixed(2)}</p>
                                <p className="text-[10px] text-green-400">bishii</p>
                            </div>
                        </a>

                        {/* Yearly */}
                        <a
                            href="/pay?plan=yearly&auth=signup&ref=exit_intent"
                            className="flex items-center justify-between p-3.5 rounded-xl border-2 border-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-all"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-white">Yearly</span>
                                    <span className="text-[10px] bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded-full">SAVE {yearlySavePct}%</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">365 + 60 maalmood bonus • 5 devices</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white">${yearlyPrice.toFixed(2)}</p>
                                <p className="text-[10px] text-yellow-400">sanad oo dhan</p>
                            </div>
                        </a>
                    </div>

                    {/* Trust */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-[11px] text-gray-500">
                        <span>🔒 SSL Secure</span>
                        <span>⚡ Isla markiiba furmaa</span>
                        <span>👥 39,246 users this month</span>
                        <span>💬 WhatsApp 24/7</span>
                    </div>

                    <button
                        onClick={() => setDismissed(true)}
                        className="mt-4 w-full text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                        No thanks, I&apos;ll keep watching for free
                    </button>
                </div>
            </div>
        </>
    );
}
