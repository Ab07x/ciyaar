"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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
                "bg-stadium-elevated border-2 border-accent-gold rounded-lg p-6 max-w-md mx-auto",
                className
            )}
        >
            {/* Header */}
            <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="text-2xl font-bold text-accent-gold mb-2">
                    PREMIUM
                </h3>
                <p className="text-lg text-text-secondary">Ciyaaraha Waaweyn</p>
            </div>

            {/* Price */}
            <div className="bg-stadium-dark rounded-lg p-4 mb-6 text-center">
                <p className="text-xl font-bold text-accent-gold">{priceText}</p>
            </div>

            {/* Unlock Form */}
            <form onSubmit={handleSubmit} className="mb-4">
                <label className="block text-sm text-text-secondary mb-2">
                    Gali password-ka:
                </label>
                <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 bg-stadium-dark border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-green"
                />
                {error && (
                    <p className="text-accent-red text-sm mt-2">{error}</p>
                )}
                <button
                    type="submit"
                    className="w-full mt-3 px-4 py-3 bg-accent-green text-black font-bold rounded-lg hover:bg-accent-green/90 transition-colors"
                >
                    Fur Ciyaarta
                </button>
            </form>

            {/* WhatsApp CTA */}
            <div className="pt-4 border-t border-border-subtle">
                <p className="text-sm text-text-muted text-center mb-3">
                    Ma haysatid password? Naga soo iibso:
                </p>
                <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                    <MessageSquare size={20} />
                    WhatsApp
                </a>
            </div>
        </div>
    );
}
