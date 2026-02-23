"use client";

import useSWR from "swr";
import Link from "next/link";
import { Plus, Edit, Trash2, Tv, Crown, Search, Check, X, Bell, Loader2 } from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminSeriesPage() {
    const { data: seriesList, mutate } = useSWR("/api/series", fetcher);

    const [filter, setFilter] = useState<"all" | "published" | "draft" | "premium" | "dubbed">("all");
    const [search, setSearch] = useState("");
    const [pushingId, setPushingId] = useState<string | null>(null);

    const filtered = seriesList?.filter((s: any) => {
        if (filter === "published" && !s.isPublished) return false;
        if (filter === "draft" && s.isPublished) return false;
        if (filter === "premium" && !s.isPremium) return false;
        if (filter === "dubbed" && s.language !== "somali") return false;
        if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const handleSendPush = async (s: any) => {
        if (!confirm(`Send push notification for "${s.titleSomali || s.title}"?`)) return;
        setPushingId(s._id);
        try {
            const name = s.titleSomali || s.title;
            const year = s.firstAirDate?.split("-")[0] || "";
            const genreText = (s.genres || []).slice(0, 2).join(" & ");
            const res = await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `🔥 CUSUB: ${name} ${year ? `(${year})` : ""} AF SOMALI`,
                    body: genreText
                        ? `${genreText} — Hadda ku daawo Fanbroj! Bilaash 🍿`
                        : `Musalsal cusub — Hadda ku daawo Fanbroj! Bilaash 🍿`,
                    broadcast: true,
                    url: `https://fanbroj.net/series/${s.slug}`,
                    image: s.posterUrl || "https://fanbroj.net/img/lm-bg.jpg",
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Push sent! ${data.sent || 0} delivered, ${data.failed || 0} failed`);
            } else {
                alert("Push failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Push error:", err);
            alert("Push failed");
        }
        setPushingId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this series and all its episodes?")) return;
        await fetch(`/api/series?id=${id}`, { method: "DELETE" });
        mutate();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">SERIES</h1>
                    <p className="text-text-muted">Manage TV series and episodes</p>
                </div>
                <Link
                    href="/kism/series/new"
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Series
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {(["all", "published", "draft", "premium", "dubbed"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-sm capitalize ${filter === f
                                ? "bg-accent-green text-black font-bold"
                                : "bg-stadium-hover text-text-secondary"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search series..."
                        className="w-full bg-stadium-elevated border border-border-subtle rounded-lg pl-10 pr-4 py-2"
                    />
                </div>
            </div>

            {/* Series Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered?.map((s: any) => (
                    <div key={s._id} className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                        <div className="h-32 bg-stadium-dark relative">
                            {s.backdropUrl && (
                                <img src={s.backdropUrl} alt="" className="w-full h-full object-cover opacity-50" />
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                                {s.isPremium && (
                                    <span className="bg-accent-gold text-black text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                        <Crown size={12} /> Premium
                                    </span>
                                )}
                                {s.isPublished ? (
                                    <span className="bg-accent-green/20 text-accent-green text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                        <Check size={12} /> Live
                                    </span>
                                ) : (
                                    <span className="bg-gray-600/50 text-gray-300 text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                        <X size={12} /> Draft
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Tv size={16} className="text-purple-400" />
                                <h3 className="font-bold truncate">{s.title}</h3>
                            </div>
                            <p className="text-sm text-text-muted mb-3 truncate">{s.genre?.join(", ")}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-muted">
                                    {s.totalSeasons || 1} season{(s.totalSeasons || 1) > 1 ? "s" : ""}
                                </span>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/kism/series/${s._id}`}
                                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                                    >
                                        <Edit size={16} />
                                    </Link>
                                    <button
                                        onClick={() => handleSendPush(s)}
                                        disabled={pushingId === s._id}
                                        className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
                                        title="Send Push Notification"
                                    >
                                        {pushingId === s._id ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(s._id)}
                                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {(!filtered || filtered.length === 0) && (
                <div className="text-center py-12 bg-stadium-elevated rounded-xl border border-border-strong border-dashed">
                    <Tv size={48} className="mx-auto mb-4 text-text-muted/30" />
                    <p className="text-text-muted">No series found</p>
                </div>
            )}
        </div>
    );
}
