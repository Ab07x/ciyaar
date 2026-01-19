"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Plus, Edit, Trash2, Tv, Crown, Eye, Search, Check, X } from "lucide-react";
import { useState } from "react";

export default function AdminSeriesPage() {
    const seriesList = useQuery(api.series.listSeries, {});
    const deleteSeries = useMutation(api.series.deleteSeries);

    const [filter, setFilter] = useState<"all" | "published" | "draft" | "premium" | "dubbed">("all");
    const [search, setSearch] = useState("");

    const filtered = seriesList?.filter((s) => {
        if (filter === "published") return s.isPublished;
        if (filter === "draft") return !s.isPublished;
        if (filter === "premium") return s.isPremium;
        if (filter === "dubbed") return s.isDubbed;
        return true;
    }).filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">SERIES</h1>
                    <p className="text-text-muted">Musalsalada – One-click TMDB import</p>
                </div>
                <Link
                    href="/admin/series/new"
                    className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Series
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {["all", "published", "draft", "premium", "dubbed"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded-full text-sm capitalize ${filter === f
                                    ? "bg-accent-green text-black font-bold"
                                    : "bg-stadium-hover text-text-secondary"
                                }`}
                        >
                            {f === "dubbed" ? "Af-Somali" : f}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered?.map((series) => (
                    <div
                        key={series._id}
                        className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden group"
                    >
                        <div className="relative aspect-[2/3]">
                            {series.posterUrl ? (
                                <img
                                    src={series.posterUrl}
                                    alt={series.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-stadium-dark flex items-center justify-center">
                                    <Tv size={48} className="text-text-muted/30" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Link
                                    href={`/admin/series/${series._id}`}
                                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                                >
                                    <Edit size={18} />
                                </Link>
                                <button
                                    onClick={() => deleteSeries({ id: series._id })}
                                    className="p-2 bg-accent-red/50 rounded-lg hover:bg-accent-red"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {series.isPremium && (
                                    <div className="flex items-center gap-1 bg-accent-gold px-2 py-0.5 rounded text-xs font-bold text-black">
                                        <Crown size={10} />
                                        PREMIUM
                                    </div>
                                )}
                                {series.isDubbed && (
                                    <div className="bg-accent-green px-2 py-0.5 rounded text-xs font-bold text-black">
                                        AF-SOMALI
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-2 right-2">
                                {series.isPublished ? (
                                    <div className="w-6 h-6 bg-accent-green rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-black" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 bg-text-muted rounded-full flex items-center justify-center">
                                        <X size={14} className="text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Season count */}
                            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                                {series.numberOfSeasons} Seasons
                            </div>
                        </div>

                        <div className="p-3">
                            <h3 className="font-bold text-sm truncate">{series.title}</h3>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-text-muted">
                                    {series.firstAirDate?.split("-")[0]}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <Eye size={12} />
                                    {series.views || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered?.length === 0 && (
                <div className="text-center py-12">
                    <Tv size={48} className="mx-auto mb-4 text-text-muted/30" />
                    <p className="text-text-muted">Ma jiraan series. Ku dar mid cusub TMDB-ga.</p>
                </div>
            )}
        </div>
    );
}
