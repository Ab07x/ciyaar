"use client";

import Link from "next/link";
import useSWR from "swr";
import { NEW_PLAN_CARDS } from "@/lib/plans";
import type { NewPlanId } from "@/lib/plans";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type PlanPricing = {
    id: string;
    monthly: { price: number };
    yearly: { price: number; perMonth: number; savePercent: number };
    trialEligible: boolean;
};

/* ── plan card images (desktop + mobile) ── */
const PLAN_IMAGES: Record<NewPlanId, { desktop: string; mobile: string }> = {
    starter: { desktop: "/img/plan-starter.png", mobile: "/img/plan-starter.png" },
    basic: { desktop: "/img/plan-basic.png", mobile: "/img/plan-basic-mob.png" },
    pro:   { desktop: "/img/plan-pro.png",   mobile: "/img/plan-pro-mob.png" },
    elite: { desktop: "/img/plan-elite.png", mobile: "/img/plan-elite-mob.png" },
};

/* ── plan accent colors ── */
const PLAN_COLORS: Record<NewPlanId, string> = {
    starter: "#f472b6",
    basic: "#60a5fa",
    pro: "#4ade80",
    elite: "#facc15",
};

/* ── duration labels (top-right of card) ── */
const PLAN_DURATION_LABEL: Record<NewPlanId, string> = {
    starter: "3-Day Plan",
    basic: "Weekly Plan",
    pro: "Monthly Plan",
    elite: "Yearly Plan",
};

const WHAT_YOU_GET = [
    "Unlimited watching",
    "No quality restrictions",
    "Direct Downloads",
    "Android APP",
    "Watch History",
    "Personal Favorites / Watch Later lists",
    "Requests of Movies/Shows",
    "No Ads",
    "Access from 5 devices",
    "VIP Support",
    "WhatsApp Support 24/7",
];

export default function PremiumPlanPage() {
    const { data: pricing } = useSWR("/api/pricing", fetcher);
    const geoReady = pricing !== undefined;
    const trialEligible = pricing?.trialEligible ?? false;

    const getPrice = (planId: string): number => {
        const p = pricing?.plans?.find((pl: PlanPricing) => pl.id === planId);
        return p?.monthly?.price ?? 0;
    };

    return (
        <div style={{ minHeight: "100vh", color: "#fff", background: "#0b1120", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {/* responsive styles */}
            <style>{`
                .plan-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                .plan-card-img-desktop { display: block; }
                .plan-card-img-mobile { display: none; }
                .premium-layout { display: flex; gap: 40px; }
                .premium-left { flex: 1 1 600px; min-width: 0; }
                .premium-right { width: 300px; flex-shrink: 0; }
                @media (max-width: 960px) {
                    .premium-layout { flex-direction: column; }
                    .premium-right { width: 100%; }
                }
                @media (max-width: 700px) {
                    .plan-grid { grid-template-columns: 1fr; }
                    .plan-card-img-desktop { display: none; }
                    .plan-card-img-mobile { display: block; }
                }
            `}</style>

            {/* Fixed background */}
            <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/img/slider-bg.webp"
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.18 }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #0b1120e0, #0b1120)" }} />
            </div>

            <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "28px 16px 60px" }}>

                <div className="premium-layout">
                    {/* ── Left: Plan Cards ── */}
                    <div className="premium-left">
                        <h1 style={{ textAlign: "center", fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
                            Choose Your Plan
                        </h1>

                        {trialEligible && (
                            <p style={{ textAlign: "center", marginBottom: 20, fontSize: 13, color: "#9ca3af" }}>
                                Try 3 days for $1 — New users only
                            </p>
                        )}

                        <div className="plan-grid">
                            {NEW_PLAN_CARDS.map((plan) => {
                                const price = getPrice(plan.id);
                                const color = PLAN_COLORS[plan.id];
                                const images = PLAN_IMAGES[plan.id];
                                const durationLabel = PLAN_DURATION_LABEL[plan.id];

                                return (
                                    <div
                                        key={plan.id}
                                        style={{
                                            borderRadius: 12,
                                            overflow: "hidden",
                                            border: `1px solid ${plan.highlight ? "rgba(74,222,128,0.35)" : "rgba(100,200,220,0.15)"}`,
                                            background: "#111827",
                                        }}
                                    >
                                        {/* ── Image section ── */}
                                        <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                                            {/* Desktop image */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                className="plan-card-img-desktop"
                                                src={images.desktop}
                                                alt={plan.displayName}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                                            />
                                            {/* Mobile image */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                className="plan-card-img-mobile"
                                                src={images.mobile}
                                                alt={plan.displayName}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                                            />

                                            {/* Right-side dark gradient */}
                                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 25%, rgba(11,17,32,0.75) 100%)" }} />
                                            {/* Bottom gradient */}
                                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, #111827, transparent)" }} />

                                            {/* Plan name — top left (italic like LookMovie2) */}
                                            <div style={{ position: "absolute", top: 14, left: 16 }}>
                                                <span style={{ fontStyle: "italic", fontSize: 22, fontWeight: 800, color: color }}>
                                                    {plan.displayName}
                                                </span>
                                            </div>

                                            {/* Duration — top right */}
                                            <div style={{ position: "absolute", top: 14, right: 16, textAlign: "right" }}>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb" }}>
                                                    {durationLabel}
                                                </span>
                                                {plan.badge && (
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: color, marginTop: 2 }}>
                                                        {plan.id === "elite" ? "+2 months free" : plan.id === "pro" ? "+1 month free" : ""}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price — bottom left */}
                                            <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "baseline", gap: 2 }}>
                                                <span style={{ fontSize: 14, fontWeight: 500, color: "#9ca3af" }}>$</span>
                                                {geoReady && price > 0
                                                    ? <span style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{price.toFixed(2)}</span>
                                                    : <span style={{ display: "inline-block", width: 60, height: 30, background: "rgba(255,255,255,0.1)", borderRadius: 6 }} />
                                                }
                                            </div>

                                            {/* SELECT button — bottom right */}
                                            <Link
                                                href={`/pay?plan=${plan.legacyId}&auth=signup`}
                                                style={{
                                                    position: "absolute",
                                                    bottom: 16,
                                                    right: 16,
                                                    background: plan.highlight ? "#4ade80" : "#0d6efd",
                                                    color: plan.highlight ? "#000" : "#fff",
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                    padding: "8px 22px",
                                                    borderRadius: 6,
                                                    textDecoration: "none",
                                                    letterSpacing: "0.1em",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                {trialEligible && plan.trialLabel ? "START TRIAL" : "SELECT"}
                                            </Link>
                                        </div>

                                        {/* ── Features below image ── */}
                                        <div style={{ padding: "12px 16px 14px", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                                            {plan.features.slice(0, 4).map(f => (
                                                <span key={f} style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{ color: "#4ade80", fontSize: 9 }}>&#10003;</span> {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Right: What You Get ── */}
                    <div className="premium-right">
                        <h2 style={{ textAlign: "center", fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", color: "#fff", marginBottom: 24, textTransform: "uppercase" }}>
                            What You Get
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {WHAT_YOU_GET.map(item => (
                                <div
                                    key={item}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "11px 16px",
                                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                                    }}
                                >
                                    <span style={{ color: "#4ade80", fontSize: 11, flexShrink: 0 }}>&#10003;</span>
                                    <span style={{ fontSize: 14, fontWeight: 500, color: "#d1d5db" }}>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            marginTop: 24,
                            padding: 16,
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.06)",
                            background: "rgba(255,255,255,0.02)",
                            textAlign: "center",
                        }}>
                            <p style={{ color: "#4ade80", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>7-Day Money-Back Guarantee</p>
                            <p style={{ color: "#6b7280", fontSize: 11 }}>Cancel anytime · Instant access · No hidden fees</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
