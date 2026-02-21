"use client";

/**
 * LaunchOfferBanner
 * A/B test: Variant A = "$1 first month" | Variant B = "7-day free trial"
 * Shown at top of page for non-premium users.
 * Dismissable per-session. Tracks impression + click in ConversionEvent.
 *
 * Usage: <LaunchOfferBanner deviceId={deviceId} onCta={() => setShowCheckout(true)} />
 */

import { useState, useEffect } from "react";
import { X, Zap, Gift } from "lucide-react";
import { getABVariant, LAUNCH_OFFER } from "@/lib/offers";

interface Props {
    deviceId: string;
    /** Called when user clicks the CTA — open QuickCheckout in parent */
    onCta: (variant: "A" | "B") => void;
}

const SESSION_KEY = "fbj_launch_banner_dismissed";

export default function LaunchOfferBanner({ deviceId, onCta }: Props) {
    const [dismissed, setDismissed] = useState(true); // start hidden, check session
    const [variant, setVariant]     = useState<"A" | "B">("A");

    useEffect(() => {
        if (sessionStorage.getItem(SESSION_KEY)) return;
        const v = getABVariant(deviceId, "launch_offer");
        setVariant(v);
        setDismissed(false);

        // Track impression
        fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "pageview",
                pageType: "launch_offer_impression",
                date: new Date().toISOString().split("T")[0],
                metadata: { variant: v },
            }),
        }).catch(() => {});
    }, [deviceId]);

    const handleDismiss = () => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setDismissed(true);
    };

    const handleCta = () => {
        // Track click
        fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "pageview",
                pageType: "launch_offer_click",
                date: new Date().toISOString().split("T")[0],
                metadata: { variant },
            }),
        }).catch(() => {});
        handleDismiss();
        onCta(variant);
    };

    if (dismissed) return null;

    const copy = LAUNCH_OFFER[variant];
    const isVariantA = variant === "A";

    return (
        <div className={`w-full py-2.5 px-4 flex items-center justify-between gap-3 text-sm ${
            isVariantA
                ? "bg-gradient-to-r from-green-600 to-emerald-500"
                : "bg-gradient-to-r from-purple-600 to-indigo-500"
        }`}>
            {/* Left: badge + copy */}
            <div className="flex items-center gap-2 min-w-0">
                {isVariantA
                    ? <Zap className="w-4 h-4 text-white flex-shrink-0" />
                    : <Gift className="w-4 h-4 text-white flex-shrink-0" />
                }
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white rounded-full px-2 py-0.5 flex-shrink-0 hidden sm:inline">
                    {copy.badge}
                </span>
                <span className="text-white font-bold truncate">
                    {copy.headlineSo}
                </span>
                <span className="text-white/70 hidden md:inline truncate">
                    — {copy.subSo}
                </span>
            </div>

            {/* Right: CTA + dismiss */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={handleCta}
                    className="text-[11px] font-black bg-white text-black rounded-full px-3 py-1 hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                    {copy.ctaSo}
                </button>
                <button
                    onClick={handleDismiss}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Dismiss offer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
