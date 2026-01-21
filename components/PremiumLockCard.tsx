"use client";

import { useState } from "react";
import { MessageSquare, Crown, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PremiumLockCardProps {
    matchId: string;
    correctPassword: string;
    priceText: string;
    whatsappNumber: string;
    cookieDays: number;
    onUnlock: () => void;
    className?: string;
}

export function PremiumLockCard({
    matchId,
    correctPassword,
    priceText,
    whatsappNumber,
    cookieDays,
    onUnlock,
    className,
}: PremiumLockCardProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === correctPassword) {
            onUnlock();
            setError("");
        } else {
            setError("Password qaldan. Fadlan isku day mar kale.");
        }
    };

    const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=Waxaan rabaa inaan furo ciyaarta premium`;

    return (
        <div
            className={cn(
                "bg-stadium-dark/95 backdrop-blur-sm border-2 border-accent-gold rounded-2xl p-6 max-w-sm w-full text-center",
                className
            )}
        >
            {/* Icon */}
            <div className="w-14 h-14 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown size={28} className="text-accent-gold" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-accent-gold mb-1">PREMIUM</h3>
            <p className="text-text-secondary text-sm mb-4">Ciyaaraha Waaweyn</p>

            {/* Price Badge */}
            <div className="inline-block bg-accent-gold/10 border border-accent-gold/30 rounded-lg px-4 py-2 mb-5">
                <p className="text-lg font-bold text-accent-gold">{priceText}</p>
            </div>

            {/* Unlock Form - Compact */}
            <form onSubmit={handleSubmit} className="space-y-3 mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        className="flex-1 px-4 py-3 min-h-[44px] bg-stadium-elevated border border-border-subtle rounded-lg text-text-primary text-center uppercase tracking-widest focus:outline-none focus:border-accent-green transition-colors"
                    />
                    <button
                        type="submit"
                        className="cta-primary px-4"
                        aria-label="Unlock"
                    >
                        <Unlock size={18} />
                    </button>
                </div>
                {error && (
                    <p className="text-accent-red text-xs">{error}</p>
                )}
            </form>

            {/* CTAs */}
            <div className="flex gap-2">
                <Link href="/pricing" className="cta-gold flex-1 text-sm">
                    Iibso
                </Link>
                <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-sm"
                >
                    <MessageSquare size={16} />
                    WhatsApp
                </a>
            </div>
        </div>
    );
}
