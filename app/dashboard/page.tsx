"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Crown, Clock, Monitor, ChevronRight, LogOut, Home } from "lucide-react";

interface LocalSubscription {
    plan: string;
    expiresAt: number;
    activatedAt: number;
}

export default function DashboardPage() {
    const [subscription] = useState<LocalSubscription | null>(() => {
        if (typeof window === "undefined") return null;
        const storedSub = window.localStorage.getItem("fanbroj_subscription");
        if (!storedSub) return null;
        try {
            return JSON.parse(storedSub);
        } catch {
            return null;
        }
    });
    const [deviceId] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return window.localStorage.getItem("fanbroj_device_id") || "";
    });
    const [nowMs, setNowMs] = useState(() => Date.now());
    const hasTrackedYearlyNudgeRef = useRef(false);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNowMs(Date.now());
        }, 60000);
        return () => window.clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("fanbroj_subscription");
        window.location.href = "/login";
    };

    const isExpired = subscription ? subscription.expiresAt < nowMs : true;
    const daysRemaining = subscription
        ? Math.max(0, Math.ceil((subscription.expiresAt - nowMs) / (1000 * 60 * 60 * 24)))
        : 0;
    const daysSinceActivation = subscription
        ? Math.max(0, Math.floor((nowMs - subscription.activatedAt) / (1000 * 60 * 60 * 24)))
        : 0;
    const shouldShowYearlyUpgradeNudge = !!subscription
        && !isExpired
        && subscription.plan === "monthly"
        && daysSinceActivation >= 7;
    const showExpiryReminder = !!subscription && !isExpired && daysRemaining <= 3;

    useEffect(() => {
        if (!shouldShowYearlyUpgradeNudge) return;
        if (hasTrackedYearlyNudgeRef.current) return;
        hasTrackedYearlyNudgeRef.current = true;
        const dayKey = new Date().toISOString().slice(0, 10);
        const dedupeKey = `fanbroj:yearly-nudge:${dayKey}`;
        if (typeof window !== "undefined" && window.localStorage.getItem(dedupeKey) === "1") return;
        if (typeof window !== "undefined") window.localStorage.setItem(dedupeKey, "1");
        fetch("/api/analytics/conversion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventName: "yearly_upgrade_prompt_shown",
                deviceId: typeof window !== "undefined" ? window.localStorage.getItem("fanbroj_device_id") || undefined : undefined,
                pageType: "dashboard",
                plan: "monthly",
                metadata: { daysSinceActivation },
                createdAt: Date.now(),
            }),
            keepalive: true,
        }).catch(() => { });
    }, [daysSinceActivation, shouldShowYearlyUpgradeNudge]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const planLabels: Record<string, string> = {
        match: "Ciyaar Keliya",
        weekly: "Usbuuc",
        monthly: "Bil",
        yearly: "Sanad"
    };

    return (
        <div className="min-h-screen bg-stadium-dark">
            {/* Header */}
            <header className="bg-stadium-elevated border-b border-border-subtle sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-black tracking-tighter text-white">
                        FAN<span className="text-accent-green">BROJ</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-text-secondary hover:text-white transition-colors">
                            <Home size={22} />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-text-secondary hover:text-accent-red transition-colors"
                        >
                            <LogOut size={22} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <h1 className="text-2xl font-bold mb-8">Xisaabtaada</h1>

                {shouldShowYearlyUpgradeNudge && (
                    <div className="rounded-2xl border border-accent-gold/40 bg-accent-gold/10 p-4 mb-6">
                        <p className="text-sm text-accent-gold font-black mb-1">Upgrade Offer</p>
                        <p className="text-sm text-white mb-3">
                            Waxaad 7+ maalmood isticmaalaysay Monthly. U bood Yearly si aad u badbaadiso lacagta sanadkii.
                        </p>
                        <Link
                            href="/pricing?src=yearly-upgrade&from=dashboard"
                            onClick={() => {
                                fetch("/api/analytics/conversion", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        eventName: "yearly_upgrade_prompt_clicked",
                                        deviceId: typeof window !== "undefined" ? window.localStorage.getItem("fanbroj_device_id") || undefined : undefined,
                                        pageType: "dashboard",
                                        plan: "yearly",
                                        source: "dashboard_nudge",
                                        createdAt: Date.now(),
                                    }),
                                    keepalive: true,
                                }).catch(() => { });
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-accent-gold px-4 py-2 text-black font-black hover:bg-accent-gold/90 transition-colors"
                        >
                            U Bood Yearly
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                )}

                {showExpiryReminder && (
                    <div className="rounded-2xl border border-accent-red/40 bg-accent-red/10 p-4 mb-6">
                        <p className="text-sm text-accent-red font-black mb-1">Renewal Reminder</p>
                        <p className="text-sm text-white mb-3">
                            VIP-gaaga wuu dhamaanayaa {daysRemaining} maalmood gudahood. Cusboonaysii hadda si daawashadaadu uusan u istaagin.
                        </p>
                        <Link
                            href="/pricing?src=renewal-reminder"
                            className="inline-flex items-center gap-2 rounded-xl bg-accent-red px-4 py-2 text-white font-black hover:bg-accent-red/90 transition-colors"
                        >
                            Cusboonaysii Hadda
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                )}

                {/* Subscription Card */}
                <div className={`rounded-2xl border p-6 mb-6 ${!subscription || isExpired
                    ? "bg-stadium-elevated border-border-subtle"
                    : "bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 border-accent-gold/30"
                    }`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${!subscription || isExpired
                                ? "bg-stadium-hover"
                                : "bg-accent-gold/20"
                                }`}>
                                <Crown className={
                                    !subscription || isExpired
                                        ? "text-text-muted"
                                        : "text-accent-gold"
                                } size={28} />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">
                                    {subscription
                                        ? planLabels[subscription.plan] || subscription.plan
                                        : "Ma jirto Subscription"
                                    }
                                </h2>
                                <p className={`text-sm ${isExpired ? "text-accent-red" : "text-accent-green"}`}>
                                    {!subscription
                                        ? "Wax subscription ah ma lihid"
                                        : isExpired
                                            ? "Wakhtigu wuu dhamaaday"
                                            : "Active ✓"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {subscription && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-stadium-dark/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                                    <Clock size={14} />
                                    Wakhti hartay
                                </div>
                                <p className="text-xl font-bold">
                                    {isExpired ? "0" : daysRemaining} <span className="text-sm font-normal text-text-secondary">maalmood</span>
                                </p>
                            </div>
                            <div className="bg-stadium-dark/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                                    <Monitor size={14} />
                                    Expires
                                </div>
                                <p className="text-lg font-bold">
                                    {formatDate(subscription.expiresAt)}
                                </p>
                            </div>
                        </div>
                    )}

                    {(!subscription || isExpired) && (
                        <Link
                            href="/pricing"
                            className="w-full bg-accent-gold text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-accent-gold/90 transition-all"
                        >
                            Hel Premium <ChevronRight size={18} />
                        </Link>
                    )}
                </div>

                {/* Quick Links */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide">Quick Links</h3>

                    <Link
                        href="/movies"
                        className="flex items-center justify-between p-4 bg-stadium-elevated rounded-xl hover:bg-stadium-hover transition-colors"
                    >
                        <span>🎬 Filimada</span>
                        <ChevronRight size={18} className="text-text-muted" />
                    </Link>

                    <Link
                        href="/series"
                        className="flex items-center justify-between p-4 bg-stadium-elevated rounded-xl hover:bg-stadium-hover transition-colors"
                    >
                        <span>📺 Musalsalada</span>
                        <ChevronRight size={18} className="text-text-muted" />
                    </Link>

                    <Link
                        href="/ciyaar"
                        className="flex items-center justify-between p-4 bg-stadium-elevated rounded-xl hover:bg-stadium-hover transition-colors"
                    >
                        <span>⚽ Ciyaaraha</span>
                        <ChevronRight size={18} className="text-text-muted" />
                    </Link>

                    <Link
                        href="/login"
                        className="flex items-center justify-between p-4 bg-stadium-elevated rounded-xl hover:bg-stadium-hover transition-colors"
                    >
                        <span>🎫 Geli Code cusub</span>
                        <ChevronRight size={18} className="text-text-muted" />
                    </Link>
                </div>

                {/* Device ID (for debugging) */}
                {deviceId && (
                    <div className="mt-8 p-4 bg-stadium-elevated rounded-xl">
                        <p className="text-xs text-text-muted">Device ID</p>
                        <p className="font-mono text-xs text-text-secondary truncate">{deviceId}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
