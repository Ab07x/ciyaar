"use client";

import useSWR from "swr";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronLeft, Plus, X, Goal } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface GoalType {
    team: "A" | "B";
    player: string;
    minute: number;
    type?: "goal" | "penalty" | "own_goal";
}

interface Props { params: Promise<{ id: string }>; }

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EditMatchPage({ params }: Props) {
    const router = useRouter();
    const { id } = use(params);

    const { data: match } = useSWR(`/api/matches/${id}`, fetcher);
    const { data: leagueData } = useSWR("/api/leagues", fetcher);
    const leagues = Array.isArray(leagueData) ? leagueData : leagueData?.leagues || [];

    const [formData, setFormData] = useState({
        title: "", slug: "", teamA: "", teamB: "", teamALogo: "", teamBLogo: "", leagueId: "", leagueName: "",
        kickoffAt: 0, status: "upcoming" as "upcoming" | "live" | "finished",
        isPremium: false, requiredPlan: undefined as "match" | "weekly" | "monthly" | "yearly" | undefined,
        thumbnailUrl: "", summary: "", embeds: [{ label: "Server 1", url: "", type: "iframe" as "m3u8" | "iframe" | "video" }],
        articleTitle: "", articleContent: "",
        scoreA: 0, scoreB: 0, minute: 0, goals: [] as GoalType[]
    });
    const [kickoffDate, setKickoffDate] = useState("");
    const [kickoffTime, setKickoffTime] = useState("");
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (match && !hasInitialized.current) {
            hasInitialized.current = true;
            setFormData({
                title: match.title, slug: match.slug, teamA: match.teamA, teamB: match.teamB,
                teamALogo: match.teamALogo || "", teamBLogo: match.teamBLogo || "",
                leagueId: match.leagueId || "", leagueName: match.leagueName || "", kickoffAt: match.kickoffAt,
                status: match.status, isPremium: match.isPremium, requiredPlan: match.requiredPlan,
                thumbnailUrl: match.thumbnailUrl || "", summary: match.summary || "",
                embeds: match.embeds?.length > 0 ? match.embeds.map((e: any) => ({ ...e, type: e.type || "iframe" })) : [{ label: "Server 1", url: "", type: "iframe" as const }],
                articleTitle: match.articleTitle || "", articleContent: match.articleContent || "",
                scoreA: match.scoreA || 0, scoreB: match.scoreB || 0,
                minute: match.minute || 0, goals: match.goals || []
            });
            const d = new Date(match.kickoffAt);
            setKickoffDate(d.toISOString().split("T")[0]);
            setKickoffTime(d.toTimeString().split(" ")[0].substring(0, 5));
        }
    }, [match]);

    if (match === undefined) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div></div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const kickoff = new Date(`${kickoffDate}T${kickoffTime}`).getTime();
        await fetch(`/api/matches/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                kickoffAt: kickoff,
                thumbnailUrl: formData.thumbnailUrl || undefined,
                teamALogo: formData.teamALogo || undefined,
                teamBLogo: formData.teamBLogo || undefined,
                summary: formData.summary || undefined,
                requiredPlan: formData.requiredPlan,
                articleTitle: formData.articleTitle || undefined,
                articleContent: formData.articleContent || undefined,
                scoreA: formData.scoreA,
                scoreB: formData.scoreB,
                minute: formData.minute || undefined,
                goals: formData.goals.length > 0 ? formData.goals : undefined
            })
        });
        router.push("/kism/matches");
    };

    const selectLeague = (leagueId: string) => {
        const league = leagues?.find((l: any) => l._id === leagueId);
        setFormData({ ...formData, leagueId, leagueName: league?.name || "" });
    };

    const PRIORITY_LEAGUES = ["UEFA Champions League", "Premier League", "La Liga", "FIFA World Cup", "UEFA Euro"];

    const addEmbed = () => formData.embeds.length < 10 && setFormData({ ...formData, embeds: [...formData.embeds, { label: `Server ${formData.embeds.length + 1}`, url: "", type: "iframe" as const }] });
    const removeEmbed = (i: number) => setFormData({ ...formData, embeds: formData.embeds.filter((_, idx) => idx !== i) });
    const updateEmbed = (i: number, field: "label" | "url" | "type", value: string) => { const embeds = [...formData.embeds]; (embeds[i] as any)[field] = value; setFormData({ ...formData, embeds }); };

    const addGoal = (team: "A" | "B") => {
        const newGoal: GoalType = { team, player: "", minute: formData.minute || 1, type: "goal" };
        setFormData({ ...formData, goals: [...formData.goals, newGoal] });
    };
    const removeGoal = (index: number) => {
        setFormData({ ...formData, goals: formData.goals.filter((_, i) => i !== index) });
    };
    const updateGoal = (index: number, field: keyof GoalType, value: any) => {
        const goals = [...formData.goals];
        (goals[index] as any)[field] = value;
        const scoreA = goals.filter(g => g.team === "A").length;
        const scoreB = goals.filter(g => g.team === "B").length;
        setFormData({ ...formData, goals, scoreA, scoreB });
    };

    return (
        <div className="max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"><Link href="/kism/matches" className="p-2 bg-stadium-elevated rounded-lg"><ChevronLeft size={24} /></Link><h1 className="text-3xl font-black">EDIT MATCH</h1></div>
                <button onClick={handleSubmit} className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"><Save size={20} />Update</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="text-sm font-bold text-text-muted uppercase border-b border-border-strong pb-3">Basic Info</h3>
                    <div><label className="block text-xs text-text-secondary mb-1">Title</label><input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs text-text-secondary mb-1">Team A</label><input value={formData.teamA} onChange={e => setFormData({ ...formData, teamA: e.target.value })} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Team B</label><input value={formData.teamB} onChange={e => setFormData({ ...formData, teamB: e.target.value })} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs text-text-secondary mb-1">Team A Logo (URL)</label><input value={formData.teamALogo} onChange={e => setFormData({ ...formData, teamALogo: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" placeholder="https://..." /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Team B Logo (URL)</label><input value={formData.teamBLogo} onChange={e => setFormData({ ...formData, teamBLogo: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" placeholder="https://..." /></div>
                    </div>
                    <div><label className="block text-xs text-text-secondary mb-1">Slug</label><input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">League</label>
                        <select value={formData.leagueId} onChange={e => selectLeague(e.target.value)} required className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3">
                            <option value="" disabled>Select League...</option>
                            {leagues?.filter((l: any) => PRIORITY_LEAGUES.includes(l.name)).map((l: any) => (
                                <option key={l._id} value={l._id}>{l.name}</option>
                            ))}
                            {leagues && leagues.length > 0 && <option disabled>──────────</option>}
                            {leagues?.filter((l: any) => (l.type === "league" || l.type === "competition") && !PRIORITY_LEAGUES.includes(l.name)).map((l: any) => (
                                <option key={l._id} value={l._id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Schedule & Status */}
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
                        {formData.isPremium && (
                            <div className="mt-3">
                                <label className="block text-xs text-text-secondary mb-1">Required Plan</label>
                                <select value={formData.requiredPlan || ""} onChange={e => setFormData({ ...formData, requiredPlan: e.target.value as any || undefined })} className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-4 py-2 text-sm">
                                    <option value="">Any Premium</option>
                                    {["match", "weekly", "monthly", "yearly"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Score Section */}
                {formData.status === "upcoming" ? (
                    <div className="md:col-span-2 bg-stadium-elevated border border-border-strong rounded-xl p-6 text-center">
                        <Goal size={32} className="mx-auto text-text-muted mb-2" />
                        <p className="text-text-muted text-sm">Change status to <span className="text-accent-green font-bold">LIVE</span> or <span className="text-accent-blue font-bold">FINISHED</span> to add scores and goals</p>
                    </div>
                ) : (
                    <div className="md:col-span-2 space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                        <h3 className="text-sm font-bold text-accent-green uppercase border-b border-border-strong pb-3 flex items-center gap-2">
                            <Goal size={18} /> Live Score & Goals
                        </h3>
                        <div className="flex items-center justify-center gap-8 py-4">
                            <div className="text-center">
                                <p className="text-sm text-text-muted mb-2">{formData.teamA || "Team A"}</p>
                                <input type="number" min="0" value={formData.scoreA} onChange={e => setFormData({ ...formData, scoreA: parseInt(e.target.value) || 0 })} className="w-20 h-20 text-4xl font-black text-center bg-stadium-dark border-2 border-accent-green rounded-xl" />
                            </div>
                            <div className="text-4xl font-black text-text-muted">-</div>
                            <div className="text-center">
                                <p className="text-sm text-text-muted mb-2">{formData.teamB || "Team B"}</p>
                                <input type="number" min="0" value={formData.scoreB} onChange={e => setFormData({ ...formData, scoreB: parseInt(e.target.value) || 0 })} className="w-20 h-20 text-4xl font-black text-center bg-stadium-dark border-2 border-accent-green rounded-xl" />
                            </div>
                        </div>
                        {formData.status === "live" && (
                            <div className="flex items-center justify-center gap-4">
                                <label className="text-sm text-text-secondary">Match Minute:</label>
                                <input type="number" min="0" max="120" value={formData.minute} onChange={e => setFormData({ ...formData, minute: parseInt(e.target.value) || 0 })} className="w-24 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2 text-center font-bold" />
                                <span className="text-accent-red font-bold">&apos;</span>
                            </div>
                        )}
                        <div className="border-t border-border-subtle pt-4 mt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-text-muted uppercase">Goal Details</h4>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => addGoal("A")} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg flex items-center gap-1"><Plus size={12} /> {formData.teamA || "Team A"} Goal</button>
                                    <button type="button" onClick={() => addGoal("B")} className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg flex items-center gap-1"><Plus size={12} /> {formData.teamB || "Team B"} Goal</button>
                                </div>
                            </div>
                            {formData.goals.length === 0 ? (
                                <p className="text-center text-text-muted py-4">No goals added yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {formData.goals.map((goal, i) => (
                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${goal.team === "A" ? "bg-blue-600/20 border border-blue-600/50" : "bg-red-600/20 border border-red-600/50"}`}>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${goal.team === "A" ? "bg-blue-600" : "bg-red-600"}`}>{goal.team === "A" ? formData.teamA : formData.teamB}</span>
                                            <input type="text" value={goal.player} onChange={e => updateGoal(i, "player", e.target.value)} placeholder="Player name" className="flex-1 bg-stadium-dark border border-border-subtle rounded px-3 py-2 text-sm" />
                                            <input type="number" min="1" max="120" value={goal.minute} onChange={e => updateGoal(i, "minute", parseInt(e.target.value) || 1)} className="w-16 bg-stadium-dark border border-border-subtle rounded px-2 py-2 text-sm text-center" />
                                            <span className="text-xs text-text-muted">&apos;</span>
                                            <select value={goal.type || "goal"} onChange={e => updateGoal(i, "type", e.target.value)} className="bg-stadium-dark border border-border-subtle rounded px-2 py-2 text-xs">
                                                <option value="goal">⚽ Goal</option>
                                                <option value="penalty">🎯 Penalty</option>
                                                <option value="own_goal">🔴 Own Goal</option>
                                            </select>
                                            <button type="button" onClick={() => removeGoal(i)} className="text-accent-red hover:text-red-400"><X size={18} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Embed Links */}
                <div className="md:col-span-2 space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <div className="flex justify-between items-center border-b border-border-strong pb-3"><h3 className="text-sm font-bold text-text-muted uppercase">Embed Links (1-10)</h3>{formData.embeds.length < 10 && <button type="button" onClick={addEmbed} className="text-xs text-accent-green flex items-center gap-1"><Plus size={14} />Add</button>}</div>
                    <div className="space-y-3">{formData.embeds.map((embed, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={embed.label} onChange={e => updateEmbed(i, "label", e.target.value)} placeholder="Label" className="w-1/5 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm" />
                            <select value={(embed as any).type || "iframe"} onChange={e => updateEmbed(i, "type", e.target.value)} className="w-24 bg-stadium-dark border border-border-subtle rounded-lg px-2 py-2 text-sm">
                                <option value="iframe">Iframe</option><option value="m3u8">M3U8</option><option value="video">Video</option>
                            </select>
                            <input value={embed.url} onChange={e => updateEmbed(i, "url", e.target.value)} placeholder={(embed as any).type === "m3u8" ? "https://example.com/stream.m3u8" : "Iframe URL"} className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm" />
                            {formData.embeds.length > 1 && <button type="button" onClick={() => removeEmbed(i)} className="text-text-muted hover:text-accent-red"><X size={18} /></button>}
                        </div>
                    ))}</div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                        <div><label className="block text-xs text-text-secondary mb-1">Thumbnail URL</label><input value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" placeholder="https://..." /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Summary (Somali)</label><input value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" placeholder="Warbixin gaaban..." /></div>
                    </div>
                </div>

                {/* Article Content */}
                <div className="md:col-span-2 space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="text-sm font-bold text-text-muted uppercase border-b border-border-strong pb-3">Article Info (Below Player)</h3>
                    <div><label className="block text-xs text-text-secondary mb-1">Article Title (H1)</label><input value={formData.articleTitle} onChange={e => setFormData({ ...formData, articleTitle: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" placeholder="Enter a catchy title..." /></div>
                    <div><label className="block text-xs text-text-secondary mb-1">Article Content (HTML supported)</label><textarea value={formData.articleContent} onChange={e => setFormData({ ...formData, articleContent: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 min-h-[300px]" placeholder="<p>Write your article here...</p>" /></div>
                </div>
            </form>
        </div>
    );
}
