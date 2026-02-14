"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Crown, Flame, Moon, X } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

const DISMISS_KEY = "fanbroj:sitewide-offer-dismissed";
const RAMADAN_START_ISO = "2026-02-16T00:00:00";
const RAMADAN_END_ISO = "2026-03-17T23:59:59";

export function SitewideOfferBar() {
    const pathname = usePathname();
    const { isPremium, isLoading } = useUser();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isLoading || isPremium) {
            setIsVisible(false);
            return;
        }
        try {
            const dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
            setIsVisible(!dismissed);
        } catch {
            setIsVisible(true);
        }
    }, [isPremium, isLoading]);

    if (!isVisible || isLoading || isPremium) return null;

    const blockedPath = pathname?.startsWith("/admin")
        || pathname?.startsWith("/kism")
        || pathname?.startsWith("/embed")
        || pathname?.startsWith("/pricing");
    if (blockedPath) return null;

    const now = Date.now();
    const isRamadan = now >= new Date(RAMADAN_START_ISO).getTime() && now <= new Date(RAMADAN_END_ISO).getTime();

    return (
        <div className="sticky top-16 z-40 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black border-b border-black/10 shadow-sm">
            <div className="container mx-auto px-3 py-2.5 flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-1 text-black/80">
                    <Moon size={14} />
                    <Flame size={14} />
                </div>

                <p className="flex-1 text-xs sm:text-sm font-black text-center sm:text-left leading-tight">
                    {isRamadan
                        ? "Ramadan Offer Live: Monthly +7 maalmood bilaash | Yearly qiimo dhimis weyn"
                        : "Ramadan Campaign (16 Feb - 17 Mar): Premium hadda qaado si aad u diyaarsanaato"}
                </p>

                <Link
                    href="/pricing?src=sitewide-offer"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-black text-white px-3 py-1.5 text-xs sm:text-sm font-black hover:bg-black/85 transition-colors"
                >
                    <Crown size={13} />
                    IIBSO
                </Link>

                <button
                    type="button"
                    onClick={() => {
                        try {
                            window.sessionStorage.setItem(DISMISS_KEY, "1");
                        } catch {
                            // ignore storage errors
                        }
                        setIsVisible(false);
                    }}
                    className="shrink-0 p-1 rounded hover:bg-black/10 text-black/70 hover:text-black transition-colors"
                    aria-label="Close offer bar"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
