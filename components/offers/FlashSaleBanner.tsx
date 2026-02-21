"use client";

/**
 * FlashSaleBanner
 * Automatically shows during Ramadan, Eid al-Fitr, Somali Independence Day.
 * Includes live countdown timer. Links to /pricing with offer code pre-filled,
 * or calls onCta() to open QuickCheckout inline.
 *
 * Usage: <FlashSaleBanner onCta={(sale) => openCheckoutWithCode(sale.offerCode)} />
 */

import { useState, useEffect, useRef } from "react";
import { X, Clock } from "lucide-react";
import { getActiveFlashSale, getFlashSaleRemainingMs, type FlashSale } from "@/lib/offers";

interface Props {
    /** Open inline checkout with discount code pre-applied */
    onCta?: (sale: FlashSale) => void;
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return "00:00:00";
    const totalSecs = Math.floor(ms / 1000);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const SESSION_KEY = "fbj_flash_dismissed";

export default function FlashSaleBanner({ onCta }: Props) {
    const [sale, setSale]           = useState<FlashSale | null>(null);
    const [remaining, setRemaining] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const activeSale = getActiveFlashSale();
        if (!activeSale) return;
        if (sessionStorage.getItem(`${SESSION_KEY}_${activeSale.id}`)) return;

        setSale(activeSale);
        setRemaining(getFlashSaleRemainingMs(activeSale));

        intervalRef.current = setInterval(() => {
            const ms = getFlashSaleRemainingMs(activeSale);
            setRemaining(ms);
            if (ms <= 0 && intervalRef.current) {
                clearInterval(intervalRef.current);
                setSale(null);
            }
        }, 1000);

        // Track impression
        fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "pageview",
                pageType: "flash_sale_impression",
                date: new Date().toISOString().split("T")[0],
                metadata: { saleId: activeSale.id, discountPct: activeSale.discountPct },
            }),
        }).catch(() => {});

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const handleDismiss = () => {
        if (sale) sessionStorage.setItem(`${SESSION_KEY}_${sale.id}`, "1");
        setDismissed(true);
    };

    const handleCta = () => {
        if (!sale) return;
        fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "pageview",
                pageType: "flash_sale_click",
                date: new Date().toISOString().split("T")[0],
                metadata: { saleId: sale.id, discountPct: sale.discountPct },
            }),
        }).catch(() => {});
        handleDismiss();
        if (onCta) {
            onCta(sale);
        } else {
            window.location.href = `/pricing?offer=${encodeURIComponent(sale.offerCode)}`;
        }
    };

    if (!sale || dismissed || remaining <= 0) return null;

    return (
        <div
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-sm"
            style={{ background: `linear-gradient(135deg, ${sale.accentColor}dd, ${sale.accentColor}99)` }}
        >
            {/* Left: emoji + headline */}
            <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl flex-shrink-0">{sale.emoji}</span>
                <div className="min-w-0">
                    <p className="text-white font-black text-xs sm:text-sm leading-tight truncate">
                        {sale.headlineSo}
                    </p>
                    <p className="text-white/80 text-[10px] hidden sm:block truncate">{sale.subSo}</p>
                </div>
            </div>

            {/* Center: countdown */}
            <div className="flex items-center gap-1.5 flex-shrink-0 bg-black/20 rounded-lg px-2.5 py-1.5">
                <Clock className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white font-black text-sm font-mono tracking-wider">
                    {formatCountdown(remaining)}
                </span>
            </div>

            {/* Right: CTA + dismiss */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={handleCta}
                    className="text-[11px] font-black bg-white rounded-full px-3 py-1 hover:bg-gray-100 transition-colors whitespace-nowrap"
                    style={{ color: sale.accentColor }}
                >
                    {sale.discountPct}% KA DHIMID
                </button>
                <button
                    onClick={handleDismiss}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
