"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface Props { params?: Promise<{ id: string }>; }

export default function MatchFormPage({ params }: Props) {
    const router = useRouter();
    const idParams = params ? use(params) : null;
    const id = idParams?.id;

    const match = useQuery(api.matches.getMatchById, id ? { id: id as Id<"matches"> } : "skip");
    const leagues = useQuery(api.leagues.listLeagues, {});
    const createMatch = useMutation(api.matches.createMatch);
    const updateMatch = useMutation(api.matches.updateMatch);

    const [formData, setFormData] = useState({
        title: "", slug: "", teamA: "", teamB: "", leagueId: "", leagueName: "",
        kickoffAt: 0, status: "upcoming" as "upcoming" | "live" | "finished",
        isPremium: false, requiredPlan: undefined as "match" | "weekly" | "monthly" | "yearly" | undefined,
        thumbnailUrl: "", summary: "", embeds: [{ label: "Server 1", url: "" }],
        articleTitle: "", articleContent: ""
    });
    const [kickoffDate, setKickoffDate] = useState("");
    const [kickoffTime, setKickoffTime] = useState("");

    useEffect(() => {
        if (match && "title" in match) {
            setFormData({
                title: match.title, slug: match.slug, teamA: match.teamA, teamB: match.teamB,
                leagueId: match.leagueId || "", leagueName: match.leagueName || "", kickoffAt: match.kickoffAt,
                status: match.status, isPremium: match.isPremium, requiredPlan: match.requiredPlan,
                thumbnailUrl: match.thumbnailUrl || "", summary: match.summary || "",
                embeds: match.embeds.length > 0 ? match.embeds : [{ label: "Server 1", url: "" }],
                articleTitle: match.articleTitle || "", articleContent: match.articleContent || ""
            });
            const d = new Date(match.kickoffAt);
            setKickoffDate(d.toISOString().split("T")[0]);
            setKickoffTime(d.toTimeString().split(" ")[0].substring(0, 5));
        } else if (!id) {
            const d = new Date();
            setKickoffDate(d.toISOString().split("T")[0]);
            setKickoffTime(d.toTimeString().split(" ")[0].substring(0, 5));
        }
    }, [match, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const kickoff = new Date(`${kickoffDate}T${kickoffTime}`).getTime();
        const data = {
            ...formData,
            kickoffAt: kickoff,
            thumbnailUrl: formData.thumbnailUrl || undefined,
            summary: formData.summary || undefined,
            articleTitle: formData.articleTitle || undefined,
            articleContent: formData.articleContent || undefined
        };
        if (id) await updateMatch({ id: id as Id<"matches">, ...data });
        else await createMatch(data);
        router.push("/admin/matches");
    };

    const generateSlug = () => {
        const slug = `${formData.teamA}-${formData.teamB}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        setFormData({ ...formData, slug });
    };

    const selectLeague = (leagueId: string) => {
        const league = leagues?.find(l => l._id === leagueId);
        setFormData({ ...formData, leagueId, leagueName: league?.name || "" });
    };

    const PRIORITY_LEAGUES = ["UEFA Champions League", "Premier League", "La Liga", "FIFA World Cup", "UEFA Euro"];

    const addEmbed = () => formData.embeds.length < 10 && setFormData({ ...formData, embeds: [...formData.embeds, { label: `Server ${formData.embeds.length + 1}`, url: "" }] });
    const removeEmbed = (i: number) => setFormData({ ...formData, embeds: formData.embeds.filter((_, idx) => idx !== i) });
    const updateEmbed = (i: number, field: "label" | "url", value: string) => {
        const embeds = [...formData.embeds]; embeds[i][field] = value; setFormData({ ...formData, embeds });
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/matches" className="p-2 bg-stadium-elevated rounded-lg"><ChevronLeft size={24} /></Link>
                    <h1 className="text-3xl font-black">{id ? "EDIT MATCH" : "NEW MATCH"}</h1>
                </div>
                <button onClick={handleSubmit} className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"><Save size={20} />{id ? "Update" : "Publish"}</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="text-sm font-bold text-text-muted uppercase border-b border-border-strong pb-3">Basic Info</h3>
                    <div><label className="block text-xs text-text-secondary mb-1">Title</label><input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs text-text-secondary mb-1">Team A</label><input value={formData.teamA} onChange={e => setFormData({ ...formData, teamA: e.target.value })} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Team B</label><input value={formData.teamB} onChange={e => setFormData({ ...formData, teamB: e.target.value })} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    </div>
                    <div><div className="flex justify-between mb-1"><label className="text-xs text-text-secondary">Slug</label><button type="button" onClick={generateSlug} className="text-xs text-accent-green">Auto</button></div><input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">League</label>
                        <select
                            value={formData.leagueId}
                            onChange={e => selectLeague(e.target.value)}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        >
                            <option value="">Select...</option>
                            {/* Priority Leagues */}
                            {leagues?.filter(l => PRIORITY_LEAGUES.includes(l.name)).map(l => (
                                <option key={l._id} value={l._id}>{l.name}</option>
                            ))}
                            {/* Separator if needed */}
                            {leagues && leagues.length > 0 && <option disabled>──────────</option>}
                            {/* Other Leagues */}
                            {leagues?.filter(l => (l.type === "league" || l.type === "competition") && !PRIORITY_LEAGUES.includes(l.name)).map(l => (
                                <option key={l._id} value={l._id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="text-sm font-bold text-text-muted uppercase border-b border-border-strong pb-3">Schedule & Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs text-text-secondary mb-1">Date</label><input type="date" value={kickoffDate} onChange={e => setKickoffDate(e.target.value)} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Time</label><input type="time" value={kickoffTime} onChange={e => setKickoffTime(e.target.value)} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    </div>
                    <div><label className="block text-xs text-text-secondary mb-1">Status</label>
                        <div className="grid grid-cols-3 border border-border-subtle rounded-lg overflow-hidden">{(["upcoming", "live", "finished"] as const).map(s => <button key={s} type="button" onClick={() => setFormData({ ...formData, status: s })} className={`py-2 text-xs font-bold uppercase ${formData.status === s ? "bg-accent-green text-black" : "bg-stadium-dark text-text-muted"}`}>{s}</button>)}</div>
                    </div>
                    <div className="p-4 bg-stadium-dark rounded-xl border border-border-subtle">
                        <div className="flex justify-between items-center"><span className="font-bold">Premium</span><button type="button" onClick={() => setFormData({ ...formData, isPremium: !formData.isPremium })} className={`w-12 h-6 rounded-full relative ${formData.isPremium ? "bg-accent-gold" : "bg-border-strong"}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isPremium ? "right-1" : "left-1"}`} /></button></div>
                        {formData.isPremium && <div className="mt-3"><label className="block text-xs text-text-secondary mb-1">Required Plan</label><select value={formData.requiredPlan || ""} onChange={e => setFormData({ ...formData, requiredPlan: e.target.value as any || undefined })} className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-4 py-2 text-sm">{["match", "weekly", "monthly", "yearly"].map(p => <option key={p} value={p}>{p}</option>)}</select></div>}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <div className="flex justify-between items-center border-b border-border-strong pb-3"><h3 className="text-sm font-bold text-text-muted uppercase">Embed Links (1-10)</h3>{formData.embeds.length < 10 && <button type="button" onClick={addEmbed} className="text-xs text-accent-green flex items-center gap-1"><Plus size={14} />Add</button>}</div>
                    <div className="space-y-3">{formData.embeds.map((embed, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={embed.label} onChange={e => updateEmbed(i, "label", e.target.value)} placeholder="Label" className="w-1/4 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm" />
                            <input value={embed.url} onChange={e => updateEmbed(i, "url", e.target.value)} placeholder="Iframe URL" className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm" />
                            {formData.embeds.length > 1 && <button type="button" onClick={() => removeEmbed(i)} className="text-text-muted hover:text-accent-red"><X size={18} /></button>}
                        </div>
                    ))}</div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                        <div><label className="block text-xs text-text-secondary mb-1">Thumbnail URL</label><input value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Summary (Somali)</label><input value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="text-sm font-bold text-text-muted uppercase border-b border-border-strong pb-3">Article Info (Below Player)</h3>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Article Title (H1)</label>
                        <input value={formData.articleTitle} onChange={e => setFormData({ ...formData, articleTitle: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" placeholder="Enter a catchy title..." />
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Article Content (HTML supported)</label>
                        <textarea value={formData.articleContent} onChange={e => setFormData({ ...formData, articleContent: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 min-h-[300px]" placeholder="<p>Write your article here...</p>" />
                    </div>
                </div>
            </form>
        </div>
    );
}
