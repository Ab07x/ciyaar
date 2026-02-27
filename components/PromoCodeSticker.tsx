"use client";

import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import Link from "next/link";

interface PromoCodeStickerProps {
    /** Visual variant */
    variant?: "banner" | "compact" | "inline";
    /** Show CTA link to /pay */
    showCta?: boolean;
    className?: string;
}

const CODE = "JM7H4953";
const DISCOUNT = "20%";

export function PromoCodeSticker({ variant = "banner", showCta = true, className = "" }: PromoCodeStickerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(CODE);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    /* ── Inline: small single-line for tight spaces ── */
    if (variant === "inline") {
        return (
            <div className={`flex items-center justify-center gap-2 flex-wrap ${className}`}>
                <span className="text-xs text-yellow-400 font-bold">
                    {DISCOUNT} OFF
                </span>
                <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 bg-yellow-400/15 border border-yellow-400/30 rounded-md px-2.5 py-1 hover:bg-yellow-400/25 transition-colors"
                >
                    <span className="font-mono text-xs font-black text-yellow-300 tracking-wider">{CODE}</span>
                    {copied
                        ? <Check size={12} className="text-green-400" />
                        : <Copy size={12} className="text-yellow-400/60" />
                    }
                </button>
                {showCta && (
                    <Link href="/pay" className="text-xs text-blue-400 hover:underline font-semibold">
                        Isticmaal &rarr;
                    </Link>
                )}
            </div>
        );
    }

    /* ── Compact: small card for paywall / player ── */
    if (variant === "compact") {
        return (
            <div className={`rounded-xl overflow-hidden ${className}`}
                style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(234,179,8,0.04) 100%)", border: "1px solid rgba(250,204,21,0.2)" }}
            >
                <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span className="text-sm font-bold text-white">{DISCOUNT} OFF</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 rounded-lg px-3 py-1.5 hover:bg-yellow-400/25 transition-colors"
                    >
                        <span className="font-mono text-sm font-black text-yellow-300 tracking-widest">{CODE}</span>
                        {copied
                            ? <Check size={14} className="text-green-400" />
                            : <Copy size={14} className="text-yellow-400/60" />
                        }
                    </button>
                    {showCta && (
                        <Link
                            href="/pay"
                            className="ml-auto text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                            Iibso Hadda
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    /* ── Banner: full-width prominent banner ── */
    return (
        <div className={`rounded-2xl overflow-hidden ${className}`}
            style={{
                background: "linear-gradient(135deg, #1a1400 0%, #1c1200 40%, #0f0a00 100%)",
                border: "1px solid rgba(250,204,21,0.2)",
                boxShadow: "0 4px 24px rgba(250,204,21,0.06)",
            }}
        >
            <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
                {/* Left: Badge + text */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.2), rgba(234,179,8,0.1))", border: "1px solid rgba(250,204,21,0.3)" }}
                    >
                        <Sparkles size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-white font-black text-sm sm:text-base leading-tight">
                            Hel <span className="text-yellow-400">{DISCOUNT}</span> Qiimo Dhimis!
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                            Isticmaal code-kan marka aad bixinayso
                        </p>
                    </div>
                </div>

                {/* Center: Code button */}
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2.5 bg-yellow-400/10 border-2 border-dashed border-yellow-400/40 rounded-xl px-5 py-2.5 hover:bg-yellow-400/20 hover:border-yellow-400/60 transition-all group"
                >
                    <span className="font-mono text-lg sm:text-xl font-black text-yellow-300 tracking-[0.2em]">{CODE}</span>
                    {copied ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                            <Check size={14} /> Copied!
                        </span>
                    ) : (
                        <Copy size={16} className="text-yellow-400/50 group-hover:text-yellow-400 transition-colors" />
                    )}
                </button>

                {/* Right: CTA */}
                {showCta && (
                    <Link
                        href="/pay"
                        className="flex-shrink-0 text-sm font-black text-black bg-yellow-400 hover:bg-yellow-300 px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                    >
                        Iibso Hadda &rarr;
                    </Link>
                )}
            </div>
        </div>
    );
}
