"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { NEW_PLAN_CARDS } from "@/lib/plans";

const DEFAULT_AVATAR = "/img/default-avatar.png";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type PlanPricing = {
    id: string;
    monthly: { price: number };
};

export default function ProfileClient() {
    const router = useRouter();
    const { userId, email, username, isPremium, subscription, logout, isLoading, profile } = useUser();
    const [selectedPlan, setSelectedPlan] = useState("monthly");

    // Fetch list counts
    const { data: favData } = useSWR(
        userId ? `/api/mylist?userId=${userId}&listType=favourites` : null,
        fetcher
    );
    const { data: wlData } = useSWR(
        userId ? `/api/mylist?userId=${userId}&listType=watch_later` : null,
        fetcher
    );
    // Fetch geo pricing
    const { data: pricing } = useSWR("/api/pricing", fetcher);

    const favCount = Array.isArray(favData?.items) ? favData.items.length : (Array.isArray(favData) ? favData.length : 0);
    const wlCount = Array.isArray(wlData?.items) ? wlData.items.length : (Array.isArray(wlData) ? wlData.length : 0);

    const sub = subscription as { plan?: string; expiresAt?: number; createdAt?: number } | null;
    const expiresAt = Number(sub?.expiresAt || 0);
    const now = Date.now();
    const daysLeft = expiresAt > now ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0;
    const planDurations: Record<string, number> = { match: 1, weekly: 7, monthly: 30, yearly: 365 };
    const totalDays = planDurations[sub?.plan || ""] || 30;
    const progressPercent = isPremium && daysLeft > 0 ? Math.min(100, Math.round((daysLeft / totalDays) * 100)) : 0;

    const getPrice = (planId: string): number => {
        const p = pricing?.plans?.find((pl: PlanPricing) => pl.id === planId);
        return p?.monthly?.price ?? 0;
    };

    const avatarUrl = (profile as Record<string, unknown>)?.avatarUrl as string | undefined;
    const avatarSrc = avatarUrl || DEFAULT_AVATAR;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const { updateAvatar } = useUser();

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        await updateAvatar(file);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCheckout = () => {
        router.push(`/pay?plan=${selectedPlan}&auth=signup`);
    };

    // Not logged in
    if (!isLoading && !userId) {
        return (
            <div style={{ padding: "60px 16px", textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36, color: "rgba(255,255,255,0.3)" }}>
                    ?
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "#fff" }}>Not Logged In</h1>
                <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>Sign in to access your account</p>
                <Link
                    href="/login"
                    style={{ display: "inline-block", background: "#0d6efd", color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 32px", borderRadius: 8, textDecoration: "none" }}
                >
                    Sign In
                </Link>
            </div>
        );
    }

    // Loading
    if (isLoading) {
        return (
            <div style={{ padding: "80px 16px", textAlign: "center" }}>
                <div style={{
                    width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)",
                    borderTopColor: "#4ade80", borderRadius: "50%",
                    margin: "0 auto 16px",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: 14, color: "#6b7280" }}>Loading account...</p>
            </div>
        );
    }

    const planCards = NEW_PLAN_CARDS.filter(p => (p.id as string) !== "starter");

    return (
        <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {/* responsive */}
            <style>{`
                .profile-layout { display: flex; gap: 0; }
                .profile-sidebar { width: 260px; flex-shrink: 0; }
                .profile-content { flex: 1; min-width: 0; padding-left: 24px; }
                @media (max-width: 768px) {
                    .profile-layout { flex-direction: column; }
                    .profile-sidebar { width: 100%; }
                    .profile-content { padding-left: 0; padding-top: 16px; }
                }
            `}</style>

            {/* Title */}
            <h1 style={{ textAlign: "center", fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", padding: "28px 0 24px", textTransform: "uppercase", color: "#fff" }}>
                Premium Account
            </h1>

            {/* Main layout */}
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 40px" }}>
                <div className="profile-layout">
                    {/* ── LEFT SIDEBAR ── */}
                    <div className="profile-sidebar" style={{ background: "#111827", borderRadius: 12, padding: "28px 0" }}>
                        {/* Avatar */}
                        <div style={{ textAlign: "center", marginBottom: 16, padding: "0 20px" }}>
                            <div style={{ position: "relative", display: "inline-block" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={avatarSrc}
                                    alt=""
                                    style={{
                                        width: 100, height: 100, borderRadius: "50%", objectFit: "cover",
                                        border: "3px solid rgba(255,255,255,0.1)",
                                        opacity: uploading ? 0.5 : 1,
                                        transition: "opacity 0.2s",
                                    }}
                                />
                                {/* Upload overlay */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    style={{
                                        position: "absolute", inset: 0, borderRadius: "50%",
                                        background: "rgba(0,0,0,0.5)", opacity: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        cursor: "pointer", border: "none", transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                                    aria-label="Change avatar"
                                >
                                    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    style={{ display: "none" }}
                                />
                                {/* Badge */}
                                <div style={{
                                    position: "absolute",
                                    bottom: -4,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: isPremium ? "#4ade80" : "#475569",
                                    color: isPremium ? "#000" : "#fff",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "3px 12px",
                                    borderRadius: 10,
                                    whiteSpace: "nowrap",
                                }}>
                                    {isPremium ? "Premium" : "Free User"}
                                </div>
                            </div>
                            <p style={{ marginTop: 16, fontSize: 13, color: "#9ca3af", wordBreak: "break-all" }}>
                                {email || username || "Anonymous"}
                            </p>
                        </div>

                        {/* Nav sections */}
                        <div style={{ marginTop: 20 }}>
                            <SidebarSection title="Mobile App">
                                <SidebarLink href="/apps/android" label="DOWNLOAD" badge="NEW" />
                                <SidebarLink href="/apps/android" label="INSTRUCTIONS" />
                            </SidebarSection>

                            <SidebarSection title="Account Details">
                                <SidebarLink href="/profile" label="PROFILE" active />
                                <SidebarLink href="/profile" label="CHANGE PASSWORD" />
                            </SidebarSection>

                            <SidebarSection title="Watch lists">
                                <SidebarLink href="/mylist?tab=favourites" label={`FAVOURITES (${favCount})`} />
                                <SidebarLink href="/mylist?tab=watch_later" label={`WATCH LATER (${wlCount})`} />
                            </SidebarSection>

                            <SidebarSection title="Premium Details">
                                <SidebarLink href="/profile" label="PREMIUM ACCOUNT" highlighted />
                                <SidebarLink href="/profile" label="PAYMENTS HISTORY" />
                            </SidebarSection>

                            <SidebarSection title="Others">
                                <SidebarLink href="https://wa.me/252617990070" label="VIP SUPPORT" external />
                                <button
                                    onClick={logout}
                                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 24px", fontSize: 12, fontWeight: 700, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.05em" }}
                                >
                                    LOG OUT
                                </button>
                            </SidebarSection>
                        </div>
                    </div>

                    {/* ── RIGHT CONTENT ── */}
                    <div className="profile-content">
                        <div style={{ background: "#111827", borderRadius: 12, padding: "28px 32px" }}>
                            {/* Days of premium */}
                            <div style={{ textAlign: "center", marginBottom: 24 }}>
                                <p style={{ fontSize: 14, color: "#d1d5db" }}>
                                    <span style={{ fontSize: 40, fontWeight: 900, color: "#fff" }}>{daysLeft}</span>
                                    {" "}days of premium left
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 32, overflow: "hidden" }}>
                                <div style={{ width: `${progressPercent}%`, height: "100%", background: isPremium ? "#4ade80" : "transparent", borderRadius: 4, transition: "width 0.5s ease" }} />
                            </div>

                            {/* Extend Premium */}
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", marginBottom: 16 }}>
                                EXTEND PREMIUM:
                            </p>

                            {/* Plan cards */}
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                                {planCards.map((plan) => {
                                    const price = getPrice(plan.id);
                                    const isSelected = selectedPlan === plan.legacyId;
                                    const durationLabels: Record<string, string> = {
                                        basic: "1 Week",
                                        pro: "1 Month",
                                        elite: "1 Year",
                                    };
                                    const savingsLabels: Record<string, string> = {
                                        basic: "",
                                        pro: "",
                                        elite: "Save 77%",
                                    };

                                    return (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.legacyId)}
                                            style={{
                                                flex: "1 1 140px",
                                                minWidth: 130,
                                                background: "transparent",
                                                border: isSelected ? "2px solid #4ade80" : "1px solid rgba(255,255,255,0.12)",
                                                borderRadius: 10,
                                                padding: "18px 14px",
                                                cursor: "pointer",
                                                textAlign: "center",
                                                position: "relative",
                                            }}
                                        >
                                            {/* Radio circle */}
                                            <div style={{
                                                position: "absolute",
                                                top: 12,
                                                left: 12,
                                                width: 16,
                                                height: 16,
                                                borderRadius: "50%",
                                                border: isSelected ? "2px solid #4ade80" : "2px solid rgba(255,255,255,0.2)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}>
                                                {isSelected && (
                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
                                                )}
                                            </div>

                                            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                                                {durationLabels[plan.id] || plan.displayName}
                                            </p>
                                            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
                                                {price > 0 ? `${price.toFixed(2)} $` : "—"}
                                            </p>
                                            {savingsLabels[plan.id] && (
                                                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                                                    {savingsLabels[plan.id]}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Checkout button */}
                            <button
                                onClick={handleCheckout}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    maxWidth: 280,
                                    margin: "0 auto",
                                    background: "#dc2626",
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: 14,
                                    padding: "12px 24px",
                                    borderRadius: 8,
                                    border: "none",
                                    cursor: "pointer",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                }}
                            >
                                CHECKOUT
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Sidebar components ── */

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 0 6px" }}>
            <p style={{ padding: "0 24px", fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>
                {title}
            </p>
            {children}
        </div>
    );
}

function SidebarLink({
    href,
    label,
    active,
    highlighted,
    badge,
    external,
}: {
    href: string;
    label: string;
    active?: boolean;
    highlighted?: boolean;
    badge?: string;
    external?: boolean;
}) {
    const style: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 24px",
        fontSize: 12,
        fontWeight: 700,
        color: highlighted ? "#facc15" : active ? "#fff" : "#d1d5db",
        textDecoration: "none",
        letterSpacing: "0.05em",
    };

    const content = (
        <>
            {label}
            {badge && (
                <span style={{ background: "#dc2626", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>
                    {badge}
                </span>
            )}
        </>
    );

    if (external) {
        return <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{content}</a>;
    }
    return <Link href={href} style={style}>{content}</Link>;
}
