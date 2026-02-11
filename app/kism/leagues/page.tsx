"use client";

import useSWR from "swr";
import { useState } from "react";
import { Plus, Edit, Trash2, Trophy, Users, Star } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());
const types = ["competition", "league", "club", "player"] as const;

export default function AdminLeaguesPage() {
    const { data: leagues, mutate } = useSWR("/api/leagues", fetcher);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");
    const [formData, setFormData] = useState({ name: "", type: "league" as typeof types[number], country: "", logoUrl: "", apiId: "" });

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await fetch("/api/leagues", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editingId, ...formData }),
                });
            } else {
                await fetch("/api/leagues", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
            }
            mutate();
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: "", type: "league", country: "", logoUrl: "", apiId: "" });
        } catch (err) {
            console.error(err);
            alert("Failed to save league");
        }
    };

    const openEdit = (league: any) => {
        setEditingId(league._id);
        setFormData({ name: league.name, type: league.type, country: league.country || "", logoUrl: league.logoUrl || "", apiId: league.apiId || "" });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this league?")) {
            await fetch(`/api/leagues?id=${id}`, { method: "DELETE" });
            mutate();
        }
    };

    const seedDefaults = async () => {
        await fetch("/api/leagues/seed", { method: "POST" });
        mutate();
    };

    const filtered = (leagues || []).filter((l: any) => filter === "all" || l.type === filter);
    const getIcon = (type: string) => {
        if (type === "competition" || type === "league") return <Trophy size={16} className="text-accent-gold" />;
        if (type === "club") return <Users size={16} className="text-blue-400" />;
        return <Star size={16} className="text-purple-400" />;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-black">LEAGUES</h1><p className="text-text-muted">Maamul leagues, clubs, players</p></div>
                <div className="flex gap-3">
                    <button onClick={seedDefaults} className="px-4 py-2 bg-stadium-hover rounded-lg text-text-secondary">Seed Defaults</button>
                    <button onClick={() => { setShowModal(true); setEditingId(null); }} className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"><Plus size={18} />Add</button>
                </div>
            </div>

            <div className="flex gap-2">
                {["all", ...types].map((t) => (
                    <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1 rounded-full text-sm ${filter === t ? "bg-accent-green text-black font-bold" : "bg-stadium-hover text-text-secondary"}`}>{t}</button>
                ))}
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-dark border-b border-border-strong">
                        <tr><th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Name</th><th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Type</th><th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Country</th><th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase">Actions</th></tr>
                    </thead>
                    <tbody>
                        {filtered?.map((league: any) => (
                            <tr key={league._id} className="border-b border-border-subtle last:border-0">
                                <td className="px-4 py-3 flex items-center gap-2">{getIcon(league.type)}<span className="font-bold">{league.name}</span></td>
                                <td className="px-4 py-3 capitalize">{league.type}</td>
                                <td className="px-4 py-3 text-text-muted">{league.country || "-"}</td>
                                <td className="px-4 py-3"><div className="flex items-center justify-end gap-2">
                                    <button onClick={() => openEdit(league)} className="p-2 hover:bg-stadium-hover rounded-lg"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(league._id)} className="p-2 hover:bg-stadium-hover rounded-lg text-accent-red"><Trash2 size={16} /></button>
                                </div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered?.length === 0 && <div className="p-12 text-center text-text-muted">Ma jiraan. Guji &quot;Seed Defaults&quot;</div>}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 max-w-md w-full space-y-4">
                        <h2 className="text-2xl font-bold">{editingId ? "Edit" : "Add"}</h2>
                        <div><label className="block text-sm text-text-secondary mb-2">Name</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-sm text-text-secondary mb-2">Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3">{types.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label className="block text-sm text-text-secondary mb-2">Country</label><input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-stadium-hover rounded-lg">Cancel</button><button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-accent-green text-black font-bold rounded-lg">{editingId ? "Update" : "Create"}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
