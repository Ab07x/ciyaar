"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";

interface AdSlotProps {
    slotKey: string;
    className?: string;
}

export function AdSlot({ slotKey, className = "" }: AdSlotProps) {
    const { isPremium } = useUser();
    const ad = useQuery(api.ads.getAdBySlot, { slotKey });
    const settings = useQuery(api.settings.getSettings);

    // Don't show ads to premium users
    if (isPremium) return null;

    // Don't show if ads disabled globally
    if (settings && !settings.adsEnabled) return null;

    // Don't show if ad not found or disabled
    if (!ad || !ad.enabled) return null;

    // Render based on network
    if (ad.network === "custom" && ad.codeHtml) {
        return (
            <div
                className={`ad-slot ${className}`}
                dangerouslySetInnerHTML={{ __html: ad.codeHtml }}
            />
        );
    }

    if (ad.network === "adsense" && ad.adsenseClient && ad.adsenseSlot) {
        return (
            <div className={`ad-slot ${className}`}>
                <ins
                    className="adsbygoogle"
                    style={{ display: "block" }}
                    data-ad-client={ad.adsenseClient}
                    data-ad-slot={ad.adsenseSlot}
                    data-ad-format={ad.format === "responsive" ? "auto" : "rectangle"}
                    data-full-width-responsive="true"
                />
            </div>
        );
    }

    // Placeholder for unconfigured slots
    return (
        <div className={`ad-slot bg-stadium-elevated border-2 border-dashed border-border-strong rounded-xl p-8 text-center ${className}`}>
            <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">
                Xayeysiis
            </span>
        </div>
    );
}
