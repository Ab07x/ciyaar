"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Plus, Edit, Trash2, Radio, Crown, Search, Tv, Power } from "lucide-react";
import { useState } from "react";

export default function AdminChannelsPage() {
    const channels = useQuery(api.channels.listChannels, {});
    const deleteChannel = useMutation(api.channels.deleteChannel);
    const toggleLive = useMutation(api.channels.toggleChannelLive);

    const [filter, setFilter] = useState<"all" | "live" | "free" | "premium">("all");
    const [search, setSearch] = useState("");

    const filtered = channels?.filter(c => {
        if (filter === "live") return c.isLive;
        if (filter === "free") return !c.isPremium;
        if (filter === "premium") return c.isPremium;
        return true;
    }).filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">CHANNELS</h1>
                    <p className="text-text-muted">Maamul Live TV channels</p>
                </div>
                <Link href="/admin/channels/new" className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2">
                    <Plus size={18} />Add Channel
                </Link>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {["all", "live", "free", "premium"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded-full text-sm ${filter === f ? "bg-accent-green text-black font-bold" : "bg-stadium-hover text-text-secondary"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search channels..."
                        className="w-full bg-stadium-elevated border border-border-subtle rounded-lg pl-10 pr-4 py-2"
                    />
                </div>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-dark border-b border-border-strong">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Channel</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Category</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Links</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered?.map(c => (
                            <tr key={c._id} className="border-b border-border-subtle last:border-0">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 bg-stadium-dark rounded flex items-center justify-center flex-shrink-0">
                                            {c.thumbnailUrl ? (
                                                <img src={c.thumbnailUrl} alt={c.name} className="w-full h-full object-cover rounded" />
                                            ) : (
                                                <Tv size={16} className="text-text-muted" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {c.isPremium && <Crown size={14} className="text-accent-gold" />}
                                                {c.isLive && <Radio size={14} className="text-accent-red animate-pulse" />}
                                                <span className="font-bold">{c.name}</span>
                                            </div>
                                            <span className="text-xs text-text-muted">/live/{c.slug}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-text-secondary text-sm capitalize">{c.category}</td>
                                <td className="px-4 py-3 text-sm font-mono text-accent-green">{c.embeds.length} links</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${c.isLive ? "bg-accent-red/20 text-accent-red" : "bg-text-muted/20 text-text-muted"}`}>
                                            {c.isLive ? "LIVE" : "OFFLINE"}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${c.isPremium ? "bg-accent-gold/20 text-accent-gold" : "bg-accent-green/20 text-accent-green"}`}>
                                            {c.isPremium ? "PREMIUM" : "FREE"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => toggleLive({ id: c._id })}
                                            className={`p-2 rounded-lg ${c.isLive ? "bg-accent-red/20 text-accent-red" : "hover:bg-stadium-hover text-text-muted"}`}
                                            title={c.isLive ? "Go Offline" : "Go Live"}
                                        >
                                            <Power size={16} />
                                        </button>
                                        <Link href={`/admin/channels/${c._id}`} className="p-2 hover:bg-stadium-hover rounded-lg">
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => deleteChannel({ id: c._id })}
                                            className="p-2 hover:bg-stadium-hover rounded-lg text-accent-red"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered?.length === 0 && (
                    <div className="p-12 text-center text-text-muted">
                        <Tv size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Ma jiraan channels. Ku dar mid cusub.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
