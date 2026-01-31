"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Plus, Edit, Trash2, PlayCircle, Lock, Search } from "lucide-react";
import { useState } from "react";

export default function AdminMatchesPage() {
    const matches = useQuery(api.matches.listMatches, {});
    const deleteMatch = useMutation(api.matches.deleteMatch);
    const bulkUpdateStatus = useMutation(api.matches.bulkUpdateStatus);

    const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "finished" | "premium">("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const filtered = matches?.filter(m => {
        if (filter === "premium") return m.isPremium;
        if (filter !== "all") return m.status === filter;
        return true;
    }).filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || m.teamA.toLowerCase().includes(search.toLowerCase()) || m.teamB.toLowerCase().includes(search.toLowerCase()));

    const toggleSelect = (id: string) => {
        const n = new Set(selected);
        if (n.has(id)) n.delete(id); else n.add(id);
        setSelected(n);
    };

    const handleBulkStatus = async (status: "live" | "upcoming" | "finished") => {
        await bulkUpdateStatus({ ids: Array.from(selected) as any[], status });
        setSelected(new Set());
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
                        {filtered?.map(m => (
                            <tr key={m._id} className="border-b border-border-subtle last:border-0">
                                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(m._id)} onChange={() => toggleSelect(m._id)} className="w-4 h-4" /></td>
                                <td className="px-4 py-3"><div className="flex items-center gap-2">{m.isPremium && <Lock size={14} className="text-accent-gold" />}<span className="font-bold">{m.title}</span></div><span className="text-xs text-text-muted">/match/{m.slug}</span></td>
                                <td className="px-4 py-3 text-text-secondary text-sm">{m.leagueName || "-"}</td>
                                <td className="px-4 py-3 text-sm font-mono text-accent-green">{m.views || 0}</td>
                                <td className="px-4 py-3 text-sm text-text-muted">{new Date(m.kickoffAt).toLocaleString()}</td>
                                <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded ${m.status === "live" ? "bg-accent-red/20 text-accent-red" : m.status === "upcoming" ? "bg-accent-green/20 text-accent-green" : "bg-text-muted/20 text-text-muted"}`}>{m.status.toUpperCase()}</span></td>
                                <td className="px-4 py-3"><div className="flex items-center justify-end gap-2"><Link href={`/kism/matches/${m._id}`} className="p-2 hover:bg-stadium-hover rounded-lg"><Edit size={16} /></Link><button onClick={() => deleteMatch({ id: m._id })} className="p-2 hover:bg-stadium-hover rounded-lg text-accent-red"><Trash2 size={16} /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered?.length === 0 && <div className="p-12 text-center text-text-muted">Ma jiraan ciyaaro</div>}
            </div>
        </div>
    );
}
