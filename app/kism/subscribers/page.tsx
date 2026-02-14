"use client";

import useSWR from "swr";
import { useState } from "react";
import {
    Users,
    Search,
    Trash2,
    Smartphone,
    Crown,
    Clock,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Shield,
    Eye,
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminSubscribersPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [clearing, setClearing] = useState(false);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    // Fetch subscriptions
    const { data: subsData, mutate: mutateSubs } = useSWR(
        `/api/admin/subscribers?page=${page}&search=${encodeURIComponent(search)}`,
        fetcher
    );

    // Fetch devices for expanded user
    const { data: devicesData, mutate: mutateDevices } = useSWR(
        expandedUser ? `/api/admin/devices?userId=${expandedUser}` : null,
        fetcher
    );

    const handleClearDevices = async (userId: string) => {
        if (!confirm("Ma hubtaa inaad tirtirto dhammaan devices-ka user-kaan?")) return;
        setClearing(true);
        try {
            const res = await fetch(`/api/admin/devices?userId=${userId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.deletedCount} device(s) cleared`);
                mutateDevices();
            }
        } catch (err) {
            alert("Failed to clear devices");
        }
        setClearing(false);
    };

    const handleDeleteDevice = async (deviceId: string) => {
        if (!confirm("Remove this device?")) return;
        try {
            const res = await fetch(`/api/admin/devices?deviceId=${deviceId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                mutateDevices();
            }
        } catch (err) {
            alert("Failed to remove device");
        }
    };

    const handleRevokeSubscription = async (subId: string) => {
        if (!confirm("Ma hubtaa inaad joojiso subscription-kaan?")) return;
        try {
            const res = await fetch(`/api/admin/subscribers`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: subId, status: "revoked" }),
            });
            if (res.ok) {
                mutateSubs();
                alert("✅ Subscription revoked");
            }
        } catch (err) {
            alert("Failed to revoke subscription");
        }
    };

    const subs = subsData?.subscriptions || [];
    const total = subsData?.total || 0;
    const totalPages = Math.ceil(total / 20);

    const formatDate = (ts: number) => {
        if (!ts) return "N/A";
        const d = new Date(ts);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const isExpired = (ts: number) => ts < Date.now();

    return (
        <div className="max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Users className="text-accent-green" />
                        SUBSCRIBERS
                    </h1>
                    <p className="text-text-muted">Maamul macaamiisha iyo devices-kooda</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-accent-green">{total}</p>
                    <p className="text-xs text-text-muted">Total Subscriptions</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by user ID, device ID, or plan..."
                    className="w-full bg-stadium-elevated border border-border-subtle rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent-green"
                />
            </div>

            {/* Table */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-strong bg-stadium-dark">
                                <th className="text-left px-4 py-3 text-text-muted font-medium">User</th>
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Plan</th>
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Status</th>
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Expires</th>
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Devices</th>
                                <th className="text-right px-4 py-3 text-text-muted font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subs.map((sub: any) => (
                                <>
                                    <tr key={sub._id} className="border-b border-border-subtle hover:bg-stadium-hover/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs text-text-secondary truncate max-w-[180px]">{sub.userId}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${sub.plan === "yearly" ? "bg-accent-gold/20 text-accent-gold" :
                                                    sub.plan === "monthly" ? "bg-blue-500/20 text-blue-400" :
                                                        sub.plan === "weekly" ? "bg-purple-500/20 text-purple-400" :
                                                            "bg-gray-500/20 text-gray-400"
                                                }`}>
                                                <Crown size={10} />
                                                {sub.plan?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${sub.status === "active" && !isExpired(sub.expiresAt) ? "bg-accent-green/20 text-accent-green" :
                                                    sub.status === "revoked" ? "bg-red-500/20 text-red-400" :
                                                        "bg-yellow-500/20 text-yellow-400"
                                                }`}>
                                                {sub.status === "active" && !isExpired(sub.expiresAt) ? "Active" :
                                                    sub.status === "revoked" ? "Revoked" : "Expired"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs ${isExpired(sub.expiresAt) ? "text-red-400" : "text-text-secondary"}`}>
                                                {formatDate(sub.expiresAt)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-text-muted">{sub.maxDevices || 1} max</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => setExpandedUser(expandedUser === sub.userId ? null : sub.userId)}
                                                    className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"
                                                    title="View Devices"
                                                >
                                                    <Smartphone size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleClearDevices(sub.userId)}
                                                    disabled={clearing}
                                                    className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors"
                                                    title="Clear All Devices"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                                {sub.status === "active" && (
                                                    <button
                                                        onClick={() => handleRevokeSubscription(sub._id)}
                                                        className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                                                        title="Revoke Subscription"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Expanded Devices Row */}
                                    {expandedUser === sub.userId && (
                                        <tr key={`devices-${sub._id}`}>
                                            <td colSpan={6} className="px-4 py-3 bg-stadium-dark/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Smartphone size={14} className="text-blue-400" />
                                                    <span className="text-xs font-bold text-text-secondary">
                                                        DEVICES ({devicesData?.count || 0})
                                                    </span>
                                                </div>
                                                {devicesData?.devices?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {devicesData.devices.map((dev: any) => (
                                                            <div key={dev._id} className="flex items-center justify-between bg-stadium-elevated rounded-lg px-3 py-2">
                                                                <div>
                                                                    <p className="text-xs font-mono text-text-secondary">{dev.deviceId}</p>
                                                                    <p className="text-[10px] text-text-muted truncate max-w-[300px]">{dev.userAgent || "Unknown"}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteDevice(dev.deviceId)}
                                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-text-muted italic">No devices found</p>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            {subs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                                        {subsData === undefined ? (
                                            <Loader2 className="animate-spin mx-auto" />
                                        ) : (
                                            "No subscriptions found"
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border-strong">
                        <span className="text-xs text-text-muted">
                            Page {page} of {totalPages} ({total} total)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="p-2 bg-stadium-dark rounded disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page >= totalPages}
                                className="p-2 bg-stadium-dark rounded disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
