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
        return <div className={cn("rounded-2xl bg-[#060815] min-h-[460px] animate-pulse", className)} />;
    }

    if (isPremium && children) return <>{children}</>;

    const handleCTA = () => {
        router.push("/pricing");
    };

    return (
        <>
            <style>{`
                @keyframes rpStarPulse {
                    0%,100% { opacity: var(--op); transform: scale(1); }
                    50%      { opacity: calc(var(--op) * 0.3); transform: scale(0.7); }
                }
                @keyframes rpMoonFloat {
                    0%,100% { transform: translateY(0px) rotate(-2deg); }
                    50%     { transform: translateY(-8px) rotate(2deg); }
                }
                @keyframes rpShimmer {
                    0%   { transform: translateX(-120%); }
                    100% { transform: translateX(120%); }
                }
                @keyframes rpRosetteSpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes rpFadeUp {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className={cn("relative overflow-hidden rounded-2xl", className)}>

                {/* blurred content hint */}
                {children && (
                    <div className="absolute inset-0 scale-110 blur-md opacity-15 pointer-events-none">
                        {children}
                    </div>
                )}

                {/* Background — layered midnight */}
                <div className="absolute inset-0"
                    style={{ background: "radial-gradient(ellipse 90% 60% at 50% 0%, #0e1635 0%, #06091a 55%, #020409 100%)" }} />

                {/* Top decorative arch line */}
                <svg className="absolute top-0 left-0 w-full pointer-events-none" height="3" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="rpArch" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%"   stopColor="#b8860b" stopOpacity="0"/>
                            <stop offset="30%"  stopColor="#f7c948" stopOpacity="0.9"/>
                            <stop offset="70%"  stopColor="#f7c948" stopOpacity="0.9"/>
                            <stop offset="100%" stopColor="#b8860b" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="3" fill="url(#rpArch)" />
                </svg>

                {/* Bottom mirror arch */}
                <svg className="absolute bottom-0 left-0 w-full pointer-events-none" height="3" preserveAspectRatio="none">
                    <rect width="100%" height="3" fill="url(#rpArch)" />
                </svg>

                {/* Stars field */}
                <StarField />

                {/* Spinning geometric rosette (background decoration) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04]"
                    style={{ animation: "rpRosetteSpin 80s linear infinite" }}>
                    <GeometricRosette size={420} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center px-6 py-12 min-h-[460px] justify-center"
                    style={{ animation: "rpFadeUp 0.6s ease both" }}>

                    {/* SVG Crescent Moon */}
                    <div className="mb-6 relative" style={{ animation: "rpMoonFloat 5s ease-in-out infinite" }}>
                        {/* glow halo */}
                        <div className="absolute inset-0 rounded-full pointer-events-none"
                            style={{ background: "radial-gradient(circle, rgba(247,201,72,0.35) 0%, transparent 70%)", transform: "scale(2.5)" }} />
                        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <radialGradient id="moonGrad" cx="40%" cy="35%" r="65%">
                                    <stop offset="0%"   stopColor="#fff8c0"/>
                                    <stop offset="60%"  stopColor="#f7c948"/>
                                    <stop offset="100%" stopColor="#c8860b"/>
                                </radialGradient>
                                <filter id="moonGlow">
                                    <feGaussianBlur stdDeviation="3" result="blur"/>
                                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                </filter>
                            </defs>
                            {/* crescent: big circle minus offset circle */}
                            <clipPath id="moonClip">
                                <circle cx="36" cy="36" r="30"/>
                            </clipPath>
                            <circle cx="36" cy="36" r="30" fill="url(#moonGrad)" filter="url(#moonGlow)" clipPath="url(#moonClip)"/>
                            <circle cx="50" cy="30" r="23" fill="#060915"/>
                            {/* tiny star beside crescent */}
                            <polygon points="62,12 63.5,16.5 68,16.5 64.5,19.5 65.8,24 62,21 58.2,24 59.5,19.5 56,16.5 60.5,16.5"
                                fill="#f7c948" opacity="0.9"/>
                        </svg>
                    </div>

                    {/* Badge */}
                    <div className="mb-5 relative"
                        style={{ animation: "rpFadeUp 0.6s 0.1s ease both", opacity: 0 }}>
                        <div className="inline-flex items-center gap-2 rounded-full px-5 py-1.5"
                            style={{
                                border: "1px solid rgba(247,201,72,0.35)",
                                background: "linear-gradient(135deg,rgba(247,201,72,0.08),rgba(247,201,72,0.14))",
                            }}>
                            <span style={{
                                fontFamily: "'Georgia', serif",
                                fontSize: "10px",
                                fontWeight: 700,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "#f7c948",
                            }}>
                                ✦ &nbsp; Ramadan Special &nbsp; ✦
                            </span>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="mb-2"
                        style={{ animation: "rpFadeUp 0.6s 0.18s ease both", opacity: 0 }}>
                        <h2 style={{
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                            fontSize: "clamp(2.4rem, 8vw, 3.2rem)",
                            fontWeight: 900,
                            letterSpacing: "-0.01em",
                            lineHeight: 1,
                            color: "#ffffff",
                            margin: 0,
                        }}>
                            FUR{" "}
                            <span style={{
                                background: "linear-gradient(135deg,#fff4a0 0%,#f7c948 40%,#c88b0a 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}>
                                VIP
                            </span>
                        </h2>
                    </div>
                    <p className="mb-7" style={{
                        animation: "rpFadeUp 0.6s 0.22s ease both",
                        opacity: 0,
                        fontSize: "12px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(247,201,72,0.5)",
                        fontWeight: 600,
                    }}>
                        Qiimaha Gaar ah Ramadanka
                    </p>

                    {/* Divider */}
                    <div className="mb-7 w-full max-w-[260px]"
                        style={{ animation: "rpFadeUp 0.6s 0.26s ease both", opacity: 0 }}>
                        <div style={{
                            height: "1px",
                            background: "linear-gradient(90deg,transparent,rgba(247,201,72,0.3),transparent)",
                        }} />
                    </div>

                    {/* Features */}
                    <ul className="mb-8 w-full max-w-[260px] space-y-3 text-left"
                        style={{ animation: "rpFadeUp 0.6s 0.3s ease both", opacity: 0 }}>
                        {[
                            ["🎬", "Fiilimada & Musalasalada Hindi Af Somali"],
                            ["⚽", "Ciyaaryahannada toos ah HD"],
                            ["📱", "App Android + Download offline"],
                            ["🛡️", "Dacwad la'aanta 7 maalmood"],
                        ].map(([icon, text]) => (
                            <li key={text} className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                                    style={{ background: "rgba(247,201,72,0.1)", border: "1px solid rgba(247,201,72,0.2)" }}>
                                    {icon}
                                </span>
                                <span style={{ fontSize: "13px", color: "#c8cfe0", lineHeight: 1.4 }}>{text}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <div className="w-full max-w-[260px]"
                        style={{ animation: "rpFadeUp 0.6s 0.38s ease both", opacity: 0 }}>
                        <button
                            onClick={handleCTA}
                            className="relative w-full overflow-hidden rounded-xl font-black text-black active:scale-95 transition-transform"
                            style={{
                                padding: "14px 24px",
                                fontSize: "14px",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                background: "linear-gradient(135deg,#ffe259 0%,#f7c948 40%,#d4880a 100%)",
                                boxShadow: "0 4px 24px rgba(247,201,72,0.35), 0 1px 0 rgba(255,255,255,0.15) inset",
                            }}
                        >
                            {/* shimmer */}
                            <span className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.4) 50%,transparent 70%)",
                                    animation: "rpShimmer 2.8s ease-in-out infinite",
                                }} />
                            <span className="relative">
                                {userId ? "⚡ Bixi Hadda — Checkout" : "✦ Hel VIP — Pricing"}
                            </span>
                        </button>

                        <p style={{ marginTop: "10px", fontSize: "11px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>
                            {userId
                                ? "Xisaab furan · bilow si toos ah"
                                : "Ma diiwaan-gasanid? Abuur akoon bilaash ah"}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Star field ─────────────────────────────────────────────────────────── */
function StarField() {
    const stars = [
        { x: "7%",  y: "8%",  r: 1.5, op: 0.8, delay: "0s",    dur: "4s" },
        { x: "84%", y: "6%",  r: 2.2, op: 1.0, delay: "0.7s",  dur: "3s" },
        { x: "52%", y: "12%", r: 1,   op: 0.5, delay: "1.4s",  dur: "5s" },
        { x: "23%", y: "18%", r: 1.5, op: 0.6, delay: "2.1s",  dur: "4s" },
        { x: "93%", y: "28%", r: 1,   op: 0.45,delay: "0.3s",  dur: "6s" },
        { x: "10%", y: "50%", r: 1.8, op: 0.55,delay: "1s",    dur: "3.5s"},
        { x: "72%", y: "72%", r: 2,   op: 0.75,delay: "0.5s",  dur: "4s" },
        { x: "38%", y: "86%", r: 1,   op: 0.4, delay: "1.8s",  dur: "5s" },
        { x: "90%", y: "60%", r: 1.5, op: 0.6, delay: "0.9s",  dur: "3s" },
        { x: "4%",  y: "78%", r: 1,   op: 0.35,delay: "2.5s",  dur: "6s" },
        { x: "62%", y: "38%", r: 1,   op: 0.3, delay: "1.1s",  dur: "4s" },
        { x: "30%", y: "58%", r: 1.5, op: 0.5, delay: "1.6s",  dur: "5s" },
        { x: "17%", y: "34%", r: 1,   op: 0.45,delay: "0.4s",  dur: "7s" },
        { x: "78%", y: "44%", r: 1.2, op: 0.5, delay: "2s",    dur: "4s" },
    ];
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "hidden" }}>
            {stars.map((s, i) => (
                <circle
                    key={i}
                    cx={s.x} cy={s.y} r={s.r}
                    fill="#fde68a"
                    style={{
                        ["--op" as string]: s.op,
                        opacity: s.op,
                        animation: `rpStarPulse ${s.dur} ease-in-out ${s.delay} infinite`,
                    }}
                />
            ))}
        </svg>
    );
}

/* ── Islamic geometric rosette ──────────────────────────────────────────── */
function GeometricRosette({ size = 300 }: { size?: number }) {
    const cx = size / 2, cy = size / 2;
    const spokes = 12;
    const lines: React.ReactNode[] = [];
    for (let i = 0; i < spokes; i++) {
        const angle = (i * Math.PI * 2) / spokes;
        const x2 = cx + Math.cos(angle) * (size * 0.48);
        const y2 = cy + Math.sin(angle) * (size * 0.48);
        lines.push(<line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="#f7c948" strokeWidth="1" />);
    }
    const circles = [0.15, 0.28, 0.42, 0.48].map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={size * r} fill="none" stroke="#f7c948" strokeWidth="0.8" />
    ));
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
            {circles}
            {lines}
        </svg>
    );
}
