"use client";

import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Plus, Edit, Trash2, PlayCircle, Lock, Search, Bell, Loader2 } from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminMatchesPage() {
    const { data: matchData } = useSWR("/api/matches", fetcher);
    const matches = Array.isArray(matchData) ? matchData : matchData?.matches || [];

    const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "finished" | "premium">("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [pushingId, setPushingId] = useState<string | null>(null);

    const handleSendPush = async (match: any) => {
        if (!confirm(`Send push notification for "${match.teamA} vs ${match.teamB}"?`)) return;
        setPushingId(match._id);
        try {
            const kickoff = new Date(match.kickoffAt);
            const timeStr = kickoff.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            const league = match.leagueName || match.league || "";
            const isLive = match.status === "live";
            const res = await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: isLive
                        ? `🔴 LIVE: ${match.teamA} vs ${match.teamB}`
                        : `⚽ ${match.teamA} vs ${match.teamB}`,
                    body: isLive
                        ? `${league} — Hadda ku daawo LIVE Fanbroj! 📺`
                        : `${league} — ${timeStr} | Ku daawo Fanbroj 📺`,
                    broadcast: true,
                    url: `https://fanbroj.net/match/${match.slug}`,
                    image: match.thumbnailUrl || "https://fanbroj.net/img/lm-bg.jpg",
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
            alert("Failed to send push notification");
        }
        setPushingId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this match?")) return;
        await fetch(`/api/matches/${id}`, { method: "DELETE" });
        mutate("/api/matches");
    };

    const handleBulkStatus = async (status: "live" | "upcoming" | "finished") => {
        await fetch("/api/matches/bulk-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selected), status }),
        });
        setSelected(new Set());
        mutate("/api/matches");
    };

    const filtered = matches?.filter((m: any) => {
        if (filter === "premium") return m.isPremium;
        if (filter !== "all") return m.status === filter;
        return true;
    }).filter((m: any) => m.title.toLowerCase().includes(search.toLowerCase()) || m.teamA.toLowerCase().includes(search.toLowerCase()) || m.teamB.toLowerCase().includes(search.toLowerCase()));

    const toggleSelect = (id: string) => {
        const n = new Set(selected);
        if (n.has(id)) n.delete(id); else n.add(id);
        setSelected(n);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-black">MATCHES</h1><p className="text-text-muted">Maamul ciyaaraha</p></div>
                <Link href="/kism/matches/new" className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"><Plus size={18} />Add Match</Link>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {["all", "live", "upcoming", "finished", "premium"].map(f => (
                        <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1 rounded-full text-sm ${filter === f ? "bg-accent-green text-black font-bold" : "bg-stadium-hover text-text-secondary"}`}>{f}</button>
                    ))}
                </div>
                <div className="flex-1 relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-stadium-elevated border border-border-subtle rounded-lg pl-10 pr-4 py-2" /></div>
                {selected.size > 0 && (
                    <div className="flex gap-2">
                        <button onClick={() => handleBulkStatus("live")} className="px-3 py-1 bg-accent-red/20 text-accent-red rounded text-sm">→ Live</button>
                        <button onClick={() => handleBulkStatus("upcoming")} className="px-3 py-1 bg-accent-green/20 text-accent-green rounded text-sm">→ Upcoming</button>
                        <button onClick={() => handleBulkStatus("finished")} className="px-3 py-1 bg-text-muted/20 text-text-muted rounded text-sm">→ Finished</button>
                    </div>
                )}
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-dark border-b border-border-strong">
                        <tr><th className="w-10 px-4 py-3"></th><th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Match</th><th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">League</th><th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Views</th><th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Kickoff</th><th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Status</th><th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase">Actions</th></tr>
                    </thead>
                    <tbody>
                        {filtered?.map((m: any) => (
                            <tr key={m._id} className="border-b border-border-subtle last:border-0">
                                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(m._id)} onChange={() => toggleSelect(m._id)} className="w-4 h-4" /></td>
                                <td className="px-4 py-3"><div className="flex items-center gap-2">{m.isPremium && <Lock size={14} className="text-accent-gold" />}<span className="font-bold">{m.title}</span></div><span className="text-xs text-text-muted">/match/{m.slug}</span></td>
                                <td className="px-4 py-3 text-text-secondary text-sm">{m.leagueName || "-"}</td>
                                <td className="px-4 py-3 text-sm font-mono text-accent-green">{m.views || 0}</td>
                                <td className="px-4 py-3 text-sm text-text-muted">{new Date(m.kickoffAt).toLocaleString()}</td>
                                <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded ${m.status === "live" ? "bg-accent-red/20 text-accent-red" : m.status === "upcoming" ? "bg-accent-green/20 text-accent-green" : "bg-text-muted/20 text-text-muted"}`}>{m.status.toUpperCase()}</span></td>
                                <td className="px-4 py-3"><div className="flex items-center justify-end gap-2"><button onClick={() => handleSendPush(m)} disabled={pushingId === m._id} className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400" title="Send Push Notification">{pushingId === m._id ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}</button><Link href={`/kism/matches/${m._id}`} className="p-2 hover:bg-stadium-hover rounded-lg"><Edit size={16} /></Link><button onClick={() => handleDelete(m._id)} className="p-2 hover:bg-stadium-hover rounded-lg text-accent-red"><Trash2 size={16} /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered?.length === 0 && <div className="p-12 text-center text-text-muted">Ma jiraan ciyaaro</div>}
            </div>
        </div>
    );
}
