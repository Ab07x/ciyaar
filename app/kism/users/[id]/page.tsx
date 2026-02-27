"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import {
    ArrowLeft,
    User as UserIcon,
    Crown,
    Clock,
    Shield,
    Smartphone,
    CreditCard,
    Trash2,
    RefreshCw,
    Heart,
    Bookmark,
    List,
    Loader2,
    Mail,
    Phone,
    Calendar,
    Gift,
    Users,
    XCircle,
} from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_STYLES: Record<string, string> = {
    paid: "bg-green-500/20 text-green-400 border-green-500/30",
    trial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    free: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    expired: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PLAN_STYLES: Record<string, string> = {
    yearly: "bg-amber-500/20 text-amber-400",
    monthly: "bg-blue-500/20 text-blue-400",
    weekly: "bg-purple-500/20 text-purple-400",
    match: "bg-gray-500/20 text-gray-400",
};

function formatDate(ts: number | null) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatRelative(ts: number) {
    const diff = ts - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
}

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data, error, mutate } = useSWR(`/api/admin/users/${id}`, fetcher);
    const [clearing, setClearing] = useState(false);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <XCircle size={48} className="text-red-400 mb-4" />
                <p className="text-lg font-bold text-white mb-2">User not found</p>
                <Link href="/kism/users" className="text-accent-green hover:underline text-sm">
                    Back to Users
                </Link>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-accent-green" />
            </div>
        );
    }

    const { user, subscriptions, devices, payments, listCounts } = data;

    const handleClearDevices = async () => {
        if (!confirm("Clear all devices for this user?")) return;
        setClearing(true);
        try {
            await fetch(`/api/admin/devices?userId=${id}`, { method: "DELETE" });
            mutate();
        } catch { /* ignore */ }
        setClearing(false);
    };

    const handleDeleteDevice = async (deviceId: string) => {
        if (!confirm("Remove this device?")) return;
        await fetch(`/api/admin/devices?deviceId=${deviceId}`, { method: "DELETE" });
        mutate();
    };

    const handleRevokeSubscription = async (subId: string) => {
        if (!confirm("Revoke this subscription?")) return;
        await fetch("/api/admin/subscribers", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: subId, status: "revoked" }),
        });
        mutate();
    };

    const isRegistered = Boolean(user.email || user.username);

    return (
        <div className="max-w-4xl space-y-6">
            {/* Back link */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Users
            </button>

            {/* ── User Profile Card ── */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={user.avatarUrl || "/img/default-avatar.png"} alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-black text-white">
                                {user.displayName || user.username || user.email || "Anonymous"}
                            </h1>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase border ${STATUS_STYLES[user.status]}`}>
                                {user.status === "paid" && <Shield size={12} />}
                                {user.status === "trial" && <Clock size={12} />}
                                {user.status}
                            </span>
                        </div>

                        {user.username && (
                            <p className="text-sm text-gray-500 mt-0.5">@{user.username}</p>
                        )}

                        {/* Contact details */}
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            {user.email && (
                                <span className="flex items-center gap-2 text-gray-300">
                                    <Mail size={14} className="text-gray-500" />
                                    {user.email}
                                </span>
                            )}
                            {(user.phoneNumber || user.phoneOrId) && (
                                <span className="flex items-center gap-2 text-gray-300">
                                    <Phone size={14} className="text-gray-500" />
                                    {user.phoneNumber || user.phoneOrId}
                                </span>
                            )}
                            <span className="flex items-center gap-2 text-gray-400">
                                <Calendar size={14} className="text-gray-500" />
                                Joined {formatDate(user.createdAt)}
                            </span>
                        </div>

                        {/* Current plan info */}
                        {user.currentPlan && (
                            <div className="mt-3 flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${PLAN_STYLES[user.currentPlan] || "bg-gray-500/20 text-gray-400"}`}>
                                    <Crown size={10} />
                                    {user.currentPlan.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {user.expiresAt && user.expiresAt > Date.now()
                                        ? formatRelative(user.expiresAt)
                                        : "Expired"
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick stats row */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-stadium-dark rounded-lg p-3 text-center">
                        <Heart size={16} className="mx-auto text-red-400 mb-1" />
                        <p className="text-lg font-black text-white">{listCounts.favourites}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Favourites</p>
                    </div>
                    <div className="bg-stadium-dark rounded-lg p-3 text-center">
                        <Bookmark size={16} className="mx-auto text-blue-400 mb-1" />
                        <p className="text-lg font-black text-white">{listCounts.watch_later}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Watch Later</p>
                    </div>
                    <div className="bg-stadium-dark rounded-lg p-3 text-center">
                        <Smartphone size={16} className="mx-auto text-purple-400 mb-1" />
                        <p className="text-lg font-black text-white">{devices.length}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Devices</p>
                    </div>
                    <div className="bg-stadium-dark rounded-lg p-3 text-center">
                        <Gift size={16} className="mx-auto text-green-400 mb-1" />
                        <p className="text-lg font-black text-white">{user.referralCount || 0}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Referrals</p>
                    </div>
                </div>

                {/* User ID */}
                <p className="mt-4 text-[10px] font-mono text-gray-600 break-all">ID: {user._id}</p>
            </div>

            {/* ── Subscriptions History ── */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border-strong flex items-center gap-2">
                    <Crown size={18} className="text-accent-green" />
                    <h2 className="text-lg font-black text-white">Subscriptions</h2>
                    <span className="text-xs text-gray-500 ml-auto">{subscriptions.length} total</span>
                </div>
                {subscriptions.length === 0 ? (
                    <p className="px-5 py-8 text-center text-gray-500 text-sm">No subscriptions</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs text-left border-b border-border-strong/50">
                                    <th className="px-5 py-2 font-medium">Plan</th>
                                    <th className="px-5 py-2 font-medium">Status</th>
                                    <th className="px-5 py-2 font-medium">Expires</th>
                                    <th className="px-5 py-2 font-medium">Devices</th>
                                    <th className="px-5 py-2 font-medium">Created</th>
                                    <th className="px-5 py-2 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map((sub: any) => {
                                    const isActive = sub.status === "active" && sub.expiresAt > Date.now();
                                    return (
                                        <tr key={sub._id} className="border-b border-border-strong/30 hover:bg-white/[0.02]">
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${PLAN_STYLES[sub.plan] || "bg-gray-500/20 text-gray-400"}`}>
                                                    <Crown size={10} />
                                                    {sub.plan?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-xs font-bold ${isActive ? "text-green-400" : sub.status === "revoked" ? "text-red-400" : "text-yellow-400"}`}>
                                                    {isActive ? "Active" : sub.status === "revoked" ? "Revoked" : "Expired"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-gray-400">{formatDate(sub.expiresAt)}</td>
                                            <td className="px-5 py-3 text-xs text-gray-400">{sub.maxDevices} max</td>
                                            <td className="px-5 py-3 text-xs text-gray-400">{formatDate(sub.createdAt)}</td>
                                            <td className="px-5 py-3 text-right">
                                                {isActive && (
                                                    <button
                                                        onClick={() => handleRevokeSubscription(sub._id)}
                                                        className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                                                        title="Revoke"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Devices ── */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border-strong flex items-center gap-2">
                    <Smartphone size={18} className="text-blue-400" />
                    <h2 className="text-lg font-black text-white">Devices</h2>
                    <span className="text-xs text-gray-500 ml-auto">{devices.length} active</span>
                    {devices.length > 0 && (
                        <button
                            onClick={handleClearDevices}
                            disabled={clearing}
                            className="ml-2 flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-500/20 transition-colors"
                        >
                            <RefreshCw size={12} />
                            Clear All
                        </button>
                    )}
                </div>
                {devices.length === 0 ? (
                    <p className="px-5 py-8 text-center text-gray-500 text-sm">No devices</p>
                ) : (
                    <div className="divide-y divide-border-strong/30">
                        {devices.map((dev: any) => (
                            <div key={dev._id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-mono text-gray-300 truncate">{dev.deviceId}</p>
                                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{dev.userAgent || "Unknown device"}</p>
                                    <p className="text-[10px] text-gray-600 mt-0.5">Last seen: {formatDate(dev.lastSeenAt)}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteDevice(dev.deviceId)}
                                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors ml-3"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Payment History ── */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border-strong flex items-center gap-2">
                    <CreditCard size={18} className="text-green-400" />
                    <h2 className="text-lg font-black text-white">Payment History</h2>
                    <span className="text-xs text-gray-500 ml-auto">{payments.length} payments</span>
                </div>
                {payments.length === 0 ? (
                    <p className="px-5 py-8 text-center text-gray-500 text-sm">No payments</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs text-left border-b border-border-strong/50">
                                    <th className="px-5 py-2 font-medium">Order</th>
                                    <th className="px-5 py-2 font-medium">Plan</th>
                                    <th className="px-5 py-2 font-medium">Amount</th>
                                    <th className="px-5 py-2 font-medium">Gateway</th>
                                    <th className="px-5 py-2 font-medium">Status</th>
                                    <th className="px-5 py-2 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p: any) => (
                                    <tr key={p._id} className="border-b border-border-strong/30 hover:bg-white/[0.02]">
                                        <td className="px-5 py-3">
                                            <span className="text-xs font-mono text-gray-400 truncate block max-w-[120px]">{p.orderId}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${PLAN_STYLES[p.plan] || "bg-gray-500/20 text-gray-400"}`}>
                                                {p.plan}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm font-bold text-white">
                                            ${p.amount?.toFixed(2)} <span className="text-[10px] text-gray-500 font-normal">{p.currency}</span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-400 capitalize">{p.gateway || p.paymentType || "—"}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-bold ${p.status === "success" ? "text-green-400" : p.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-400">{formatDate(p.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
