"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@/lib/utils";

interface RamadanPaywallProps {
    children?: React.ReactNode;
    className?: string;
    plan?: "match" | "weekly" | "monthly" | "yearly";
}

export default function RamadanPaywall({
    children,
    className,
    plan = "monthly",
}: RamadanPaywallProps) {
    const { userId, isPremium, isLoading } = useUser();
    const router = useRouter();

    if (isLoading) {
        return <div className={cn("rounded-2xl bg-[#0a0e1a] min-h-[420px] animate-pulse", className)} />;
    }

    if (isPremium && children) return <>{children}</>;

    const handleCTA = () => {
        router.push(userId ? `/pay?plan=${plan}` : "/pricing");
    };

    return (
        <div className={cn("relative overflow-hidden rounded-2xl", className)}>
            {/* blurred content preview */}
            {children && (
                <div className="absolute inset-0 scale-105 blur-sm opacity-25 pointer-events-none">
                    {children}
                </div>
            )}

            {/* night-sky gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#05091a] via-[#080e22] to-[#030612]" />

            {/* subtle radial glow behind moon */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#f5c84220] blur-3xl pointer-events-none" />

            {/* twinkling stars */}
            <Stars />

            {/* card */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 py-12 min-h-[420px] justify-center">

                {/* moon */}
                <div className="mb-5 relative">
                    <div className="absolute inset-0 rounded-full bg-yellow-300/30 blur-xl scale-150" />
                    <span className="relative text-6xl leading-none drop-shadow-[0_0_24px_rgba(245,200,66,0.7)]">🌙</span>
                </div>

                {/* badge */}
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-yellow-300">
                    ✦ Ramadan Special ✦
                </span>

                {/* headline */}
                <h2 className="mb-1 text-4xl font-black tracking-tight text-white">
                    FUR <span className="text-yellow-400">VIP</span>
                </h2>
                <p className="mb-6 text-sm font-medium text-yellow-300/60 tracking-wide">
                    Qiimaha gaar ah Ramadanka
                </p>

                {/* feature rows */}
                <div className="mb-7 w-full max-w-[280px] space-y-2 text-left">
                    {[
                        ["🎬", "Fiilimada & Musalasalada Hindi Af Somali"],
                        ["⚽", "Ciyaaryahannada toos ah HD"],
                        ["📱", "App Android + Download offline"],
                        ["🛡️", "Dacwad la'aanta 7 maalmood"],
                    ].map(([icon, text]) => (
                        <div key={text} className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{icon}</span>
                            <span className="text-sm text-gray-300">{text}</span>
                        </div>
                    ))}
                </div>

                {/* CTA button */}
                <button
                    onClick={handleCTA}
                    className="group relative w-full max-w-[280px] overflow-hidden rounded-xl py-4 font-black text-black text-[15px] shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform"
                    style={{ background: "linear-gradient(135deg,#f9d423 0%,#f5a623 100%)" }}
                >
                    {/* shine on hover */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <span className="relative">
                        {userId ? "Bixi Hadda → Checkout" : "Hel VIP → Pricing"}
                    </span>
                </button>

                <p className="mt-3 text-[11px] text-gray-600">
                    {userId ? "Macmiil diiwaan-gashan · bilow si toos ah" : "Ma diiwaan-gasanid? Abuur akoon bilaash ah"}
                </p>
            </div>
        </div>
    );
}

function Stars() {
    const stars = [
        { cx: "8%",  cy: "9%",  r: 1.5, op: 0.7, d: "0s"   },
        { cx: "82%", cy: "7%",  r: 2,   op: 0.9, d: "0.5s"  },
        { cx: "55%", cy: "15%", r: 1,   op: 0.5, d: "1s"    },
        { cx: "25%", cy: "20%", r: 1.5, op: 0.6, d: "1.4s"  },
        { cx: "91%", cy: "30%", r: 1,   op: 0.4, d: "0.3s"  },
        { cx: "12%", cy: "55%", r: 1.5, op: 0.5, d: "0.8s"  },
        { cx: "70%", cy: "75%", r: 2,   op: 0.7, d: "0.2s"  },
        { cx: "40%", cy: "88%", r: 1,   op: 0.35,d: "1.2s"  },
        { cx: "88%", cy: "65%", r: 1.5, op: 0.55,d: "0.6s"  },
        { cx: "5%",  cy: "80%", r: 1,   op: 0.4, d: "1.7s"  },
        { cx: "60%", cy: "42%", r: 1,   op: 0.3, d: "0.9s"  },
        { cx: "33%", cy: "60%", r: 1.5, op: 0.5, d: "1.5s"  },
    ];
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {stars.map((s, i) => (
                <circle
                    key={i}
                    cx={s.cx} cy={s.cy} r={s.r}
                    fill="#fde68a"
                    opacity={s.op}
                    style={{ animation: `pulse 3s ease-in-out ${s.d} infinite` }}
                />
            ))}
        </svg>
    );
}
