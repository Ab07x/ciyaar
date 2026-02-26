"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import QuickCheckout from "@/components/QuickCheckout";
import { cn } from "@/lib/utils";

interface RamadanPaywallProps {
    /** Slot content that should be hidden behind the gate */
    children?: React.ReactNode;
    /** Extra classes on the wrapper */
    className?: string;
    /** Which plan to pre-select in checkout (default: monthly) */
    plan?: "match" | "weekly" | "monthly" | "yearly";
}

export default function RamadanPaywall({
    children,
    className,
    plan = "monthly",
}: RamadanPaywallProps) {
    const { userId, isPremium, isLoading } = useUser();
    const router = useRouter();
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    // If still loading auth, show skeleton
    if (isLoading) {
        return (
            <div className={cn("relative rounded-2xl overflow-hidden bg-[#0d1117] min-h-[340px] animate-pulse", className)} />
        );
    }

    // Premium users see the content directly
    if (isPremium && children) {
        return <>{children}</>;
    }

    const handleCTA = () => {
        if (userId) {
            // Logged-in → open inline checkout
            setCheckoutOpen(true);
        } else {
            // Guest → pricing page
            router.push("/pricing");
        }
    };

    return (
        <>
            <div
                className={cn(
                    "relative rounded-2xl overflow-hidden select-none",
                    className,
                )}
            >
                {/* ── Blurred content preview (optional) ── */}
                {children && (
                    <div className="absolute inset-0 blur-sm scale-105 pointer-events-none opacity-30">
                        {children}
                    </div>
                )}

                {/* ── Background ── */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e] via-[#0d1529] to-[#060b15]" />

                {/* Stars */}
                <Stars />

                {/* ── Card ── */}
                <div className="relative z-10 flex flex-col items-center text-center px-6 py-10 min-h-[340px] justify-center gap-5">

                    {/* Crescent + glow */}
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-2xl scale-150" />
                        <span className="relative text-5xl leading-none select-none">🌙</span>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5">
                        <span className="text-yellow-300 text-[11px] font-black tracking-[0.18em] uppercase">
                            Ramadan Special
                        </span>
                    </div>

                    {/* Headline */}
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                            FUR{" "}
                            <span className="text-yellow-400">VIP</span>
                        </h2>
                        <p className="text-yellow-300/70 text-sm mt-1 font-medium tracking-wide">
                            Xagaaga Ramadanka — Qiimo Gaar ah
                        </p>
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-1.5 text-sm text-gray-300 w-full max-w-xs text-left">
                        {[
                            "Fiilimada & Musalasalada — Hindi Af Somali",
                            "Ciyaaryahannada toos ah HD",
                            "Barnaamijka Android + Download offline",
                            "Dacwad la'aanta 7 maalmood",
                        ].map((f) => (
                            <li key={f} className="flex items-start gap-2">
                                <span className="mt-0.5 text-yellow-400 text-base leading-none">✦</span>
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <button
                        onClick={handleCTA}
                        className="w-full max-w-xs relative group overflow-hidden rounded-xl font-black text-black text-base py-4 px-6 transition-all active:scale-95"
                        style={{
                            background: "linear-gradient(135deg, #f5c842 0%, #f59e0b 50%, #e07b00 100%)",
                        }}
                    >
                        {/* shine sweep */}
                        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <span className="relative flex items-center justify-center gap-2">
                            🌙
                            {userId ? "Bixi Hadda — VIP Fur" : "Hel VIP — Pricing Eeg"}
                            <span className="ml-1">→</span>
                        </span>
                    </button>

                    {/* Sub-copy */}
                    <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                        {userId
                            ? "Macmiil diiwaan-gashan. Khidmadda bilow si toos ah."
                            : "Aad ma diiwaan-gasanid? Abuur akoon bilaash ah oo hel VIP."}
                    </p>
                </div>
            </div>

            {/* Checkout modal — only for logged-in users */}
            <QuickCheckout
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                defaultPlan={plan}
            />
        </>
    );
}

/* ── Decorative stars ─────────────────────────────────────────────────── */
function Stars() {
    const dots = [
        { top: "10%", left: "8%",  size: 2, opacity: 0.6,  delay: "0s"   },
        { top: "18%", left: "80%", size: 3, opacity: 0.9,  delay: "0.4s" },
        { top: "28%", left: "55%", size: 1, opacity: 0.4,  delay: "0.8s" },
        { top: "5%",  left: "42%", size: 2, opacity: 0.7,  delay: "1.2s" },
        { top: "70%", left: "12%", size: 2, opacity: 0.5,  delay: "0.2s" },
        { top: "80%", left: "72%", size: 3, opacity: 0.8,  delay: "0.6s" },
        { top: "60%", left: "90%", size: 1, opacity: 0.35, delay: "1s"   },
        { top: "40%", left: "4%",  size: 2, opacity: 0.55, delay: "1.5s" },
        { top: "90%", left: "38%", size: 2, opacity: 0.45, delay: "0.9s" },
        { top: "50%", left: "62%", size: 1, opacity: 0.3,  delay: "0.3s" },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {dots.map((d, i) => (
                <span
                    key={i}
                    className="absolute rounded-full bg-yellow-200 animate-pulse"
                    style={{
                        top: d.top,
                        left: d.left,
                        width: d.size,
                        height: d.size,
                        opacity: d.opacity,
                        animationDelay: d.delay,
                        animationDuration: "3s",
                    }}
                />
            ))}
        </div>
    );
}
