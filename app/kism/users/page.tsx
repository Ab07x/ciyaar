"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Search, ChevronLeft, ChevronRight, Crown, Clock, User as UserIcon, Shield } from "lucide-react";

interface UserRow {
    _id: string;
    email: string | null;
    phoneNumber: string | null;
    phoneOrId: string | null;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    status: "free" | "paid" | "trial" | "expired";
    plan: string | null;
    expiresAt: number | null;
    createdAt: number;
}

interface Stats {
    total: number;
    paid: number;
    trial: number;
    free: number;
}

const STATUS_COLORS: Record<string, string> = {
    paid: "bg-green-500/20 text-green-400",
    trial: "bg-yellow-500/20 text-yellow-400",
    free: "bg-gray-500/20 text-gray-400",
    expired: "bg-red-500/20 text-red-400",
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, paid: 0, trial: 0, free: 0 });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "25", filter });
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            setUsers(data.users || []);
            setStats(data.stats || { total: 0, paid: 0, trial: 0, free: 0 });
            setTotalPages(data.pagination?.totalPages || 1);
        } catch {
            console.error("Failed to fetch users");
        }
        setLoading(false);
    }, [page, search, filter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-8">
                <Users size={28} className="text-accent-green" />
                <h1 className="text-3xl font-black text-white">Users</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total Users", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Paid", value: stats.paid, icon: Crown, color: "text-green-400", bg: "bg-green-500/10" },
                    { label: "Trial", value: stats.trial, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                    { label: "Free", value: stats.free, icon: UserIcon, color: "text-gray-400", bg: "bg-gray-500/10" },
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} border border-white/10 rounded-xl p-5`}>
                        <stat.icon size={20} className={stat.color} />
                        <p className="text-2xl font-black text-white mt-2">{stat.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search email or username..."
                            className="w-full bg-stadium-elevated border border-border-strong rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-green"
                        />
                    </div>
                    <button type="submit" className="bg-accent-green text-black px-4 py-2.5 rounded-lg text-sm font-bold">
                        Search
                    </button>
                </form>

                <div className="flex gap-2">
                    {["all", "paid", "trial", "free", "expired"].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${filter === f ? "bg-accent-green text-black" : "bg-stadium-elevated text-gray-400 hover:text-white border border-border-strong"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-strong text-gray-400 text-left">
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Phone</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Plan</th>
                                <th className="px-4 py-3 font-medium">Signed Up</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No users found</td></tr>
                            ) : users.map((user) => (
                                <tr key={user._id} className="border-b border-border-strong/50 hover:bg-white/[0.04] cursor-pointer transition-colors"
                                    onClick={() => window.location.href = `/kism/users/${user._id}`}
                                >
                                    <td className="px-4 py-3">
                                        <Link href={`/kism/users/${user._id}`} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {user.avatarUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon size={14} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.displayName || user.username || (user.email ? user.email.split("@")[0] : "Anonymous")}</p>
                                                {user.username && <p className="text-xs text-gray-500">@{user.username}</p>}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 text-sm">{user.email || <span className="text-gray-600">—</span>}</td>
                                    <td className="px-4 py-3 text-gray-300 text-sm">{user.phoneNumber || user.phoneOrId || <span className="text-gray-600">—</span>}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold uppercase ${STATUS_COLORS[user.status]}`}>
                                            {user.status === "paid" && <Shield size={10} />}
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 capitalize text-sm">{user.plan || "—"}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border-strong">
                        <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-400"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-400"
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
