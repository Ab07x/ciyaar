"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Crown, Clock, Monitor, ChevronRight, LogOut, Home } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface LocalSubscription {
    plan: string;
    expiresAt: number;
    activatedAt: number;
}

export default function DashboardPage() {
    const [subscription, setSubscription] = useState<LocalSubscription | null>(null);
    const [deviceId, setDeviceId] = useState<string>("");

    useEffect(() => {
        // Load subscription from localStorage
        const storedSub = localStorage.getItem("fanbroj_subscription");
        if (storedSub) {
            try {
                setSubscription(JSON.parse(storedSub));
            } catch {
                // Invalid data
            }
        }

        const storedDeviceId = localStorage.getItem("fanbroj_device_id");
        if (storedDeviceId) {
            setDeviceId(storedDeviceId);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("fanbroj_subscription");
        window.location.href = "/login";
    };

    const isExpired = subscription ? subscription.expiresAt < Date.now() : true;
    const daysRemaining = subscription
        ? Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

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
