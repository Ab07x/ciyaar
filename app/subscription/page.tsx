"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { Loader2, Crown, Calendar, Smartphone, Ticket, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { useUser } from "@/providers/UserProvider";
import { LogOut } from "lucide-react";

export default function SubscriptionPage() {
    const [deviceId, setDeviceId] = useState<string>("");
    const { logout } = useUser();

    useEffect(() => {
        const storedDeviceId = localStorage.getItem("fanbroj_device_id");
        if (storedDeviceId) {
            setDeviceId(storedDeviceId);
        }
    }, []);

    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: subscriptionData } = useSWR(
        deviceId ? `/api/subscriptions?deviceId=${deviceId}` : null,
        fetcher
    );

    if (!deviceId) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <Loader2 className="w-8 h-8 text-accent-green animate-spin mb-4" />
                <p className="text-text-secondary">Loading device info...</p>
            </div>
        );
    }

    if (subscriptionData === undefined) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <Loader2 className="w-8 h-8 text-accent-green animate-spin mb-4" />
                <p className="text-text-secondary">Loading subscription...</p>
            </div>
        );
    }

    if (subscriptionData === null) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-stadium-elevated p-8 rounded-2xl border border-border-subtle max-w-md w-full">
                    <div className="w-16 h-16 bg-stadium-hover rounded-full flex items-center justify-center mx-auto mb-6">
                        <Crown className="text-text-muted" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Ma lihid Premium</h2>
                    <p className="text-text-secondary mb-8">
                        Iska diiwaan geli si aad u hesho ciyaaro toos ah, musalsalo, iyo filimo cusub.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/pricing"
                            className="block w-full bg-accent-gold text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"
                        >
                            Iibso Premium
                        </Link>
                        <Link
                            href="/login"
                            className="block w-full bg-stadium-hover text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all"
                        >
                            Geli Code
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const { subscription, devices = [], code } = subscriptionData;

    // Use subscription expiresAt
    const expiresAt = subscription?.expiresAt || 0;
    const isExpired = Date.now() > expiresAt;
    const expiresInDays = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

    if (!subscription) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-stadium-elevated p-8 rounded-2xl border border-border-subtle max-w-md w-full">
                    <div className="w-16 h-16 bg-stadium-hover rounded-full flex items-center justify-center mx-auto mb-6">
                        <Crown className="text-text-muted" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Ma lihid Premium</h2>
                    <p className="text-text-secondary mb-8">
                        Iska diiwaan geli si aad u hesho ciyaaro toos ah, musalsalo, iyo filimo cusub.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/pricing"
                            className="block w-full bg-accent-gold text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"
                        >
                            Iibso Premium
                        </Link>
                        <Link
                            href="/login"
                            className="block w-full bg-stadium-hover text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all"
                        >
                            Geli Code
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                    <Crown className="text-accent-gold" />
                    Your Subscription
                </h1>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 bg-stadium-hover text-text-primary rounded-xl font-bold hover:bg-accent-red/10 hover:text-accent-red transition-all"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            {/* Status Card */}
            <div className="bg-stadium-elevated border rounded-2xl p-6 mb-6 shadow-elevated relative overflow-hidden border-accent-gold/20">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Crown size={120} className="text-accent-gold" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-text-secondary text-sm font-bold uppercase tracking-wider mb-1">Current Status</p>
                            <h2 className="text-3xl font-black text-white capitalize">
                                {`${subscription?.plan || "Premium"} Package`}
                            </h2>
                        </div>
                        <Badge
                            variant={isExpired ? "danger" : "success"}
                            className="px-3 py-1 text-sm uppercase"
                        >
                            {subscription?.status === "active" && !isExpired ? "ACTIVE" :
                                isExpired ? "EXPIRED" : "INACTIVE"}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-stadium-dark/50 rounded-xl p-4 border border-border-subtle">
                            <div className="flex items-center gap-2 text-text-secondary mb-2">
                                <Calendar size={18} />
                                <span className="text-xs font-bold uppercase">Expires On</span>
                            </div>
                            <p className="text-white font-mono font-bold">
                                {new Date(expiresAt).toLocaleDateString()}
                            </p>
                            <p className={`${expiresInDays > 2 ? "text-accent-green" : "text-accent-gold"} text-sm mt-1 font-bold`}>
                                {expiresInDays > 0 ? `${expiresInDays} days left` : "Expired"}
                            </p>
                        </div>

                        <div className="bg-stadium-dark/50 rounded-xl p-4 border border-border-subtle">
                            <div className="flex items-center gap-2 text-text-secondary mb-2">
                                <Clock size={18} />
                                <span className="text-xs font-bold uppercase">{subscription ? "Activated On" : "Started On"}</span>
                            </div>
                            <p className="text-white font-mono font-bold">
                                {subscription?.createdAt ? new Date(subscription.createdAt).toLocaleDateString() : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Redemption Info */}
            {code && (
                <div className="bg-stadium-elevated border border-border-subtle rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Ticket className="text-accent-blue" size={20} />
                        Code Details
                    </h3>
                    <div className="bg-stadium-dark rounded-xl p-4 flex items-center justify-between border border-border-subtle border-l-4 border-l-accent-blue">
                        <div>
                            <p className="text-text-secondary text-xs font-bold uppercase mb-1">Redemption Code</p>
                            <p className="text-xl font-mono text-white tracking-widest">{code.code}</p>
                        </div>
                        <CheckCircle2 className="text-accent-green" size={24} />
                    </div>
                </div>
            )}

            {/* Devices */}
            <div className="bg-stadium-elevated border border-border-subtle rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Smartphone className="text-accent-green" size={20} />
                        Connected Devices
                    </h3>
                    <span className="text-xs font-bold bg-stadium-dark px-2 py-1 rounded-md text-text-secondary">
                        {devices.length} / {subscription?.maxDevices ?? 1}
                    </span>
                </div>

                <div className="space-y-3">
                    {devices.map((device) => (
                        <div
                            key={device.deviceId}
                            className={`p-4 rounded-xl border flex items-center justify-between ${device.deviceId === deviceId
                                ? "bg-accent-green/10 border-accent-green/30"
                                : "bg-stadium-dark border-border-subtle"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${device.deviceId === deviceId ? "bg-accent-green/20" : "bg-stadium-hover"
                                    }`}>
                                    <Smartphone size={20} className={device.deviceId === deviceId ? "text-accent-green" : "text-text-muted"} />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">
                                        {device.deviceId === deviceId ? "This Device" : "Other Device"}
                                    </p>
                                    <p className="text-text-muted text-xs truncate max-w-[200px]">
                                        Last active: {new Date(device.lastSeenAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            {device.deviceId === deviceId && (
                                <span className="text-xs font-bold text-accent-green px-2 py-1 bg-accent-green/10 rounded">
                                    CURRENT
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
