"use client";

import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Download, Check, Calendar, RefreshCw, ArrowRight, Loader2 } from "lucide-react";

export default function AdminImportPage() {

    function formatSyncError(err: unknown): string {
        if (!err) return "Unknown error";

        // Already an object
        if (typeof err === "object") {
            try {
                const anyErr = err as any;
                return (
                    anyErr?.access ||
                    anyErr?.message ||
                    JSON.stringify(anyErr)
                );
            } catch {
                return "Unknown error";
            }
        }

        // String error
        const s = String(err);

        // Only JSON.parse if it looks like JSON
        const trimmed = s.trim();
        const looksJson =
            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"));

        if (looksJson) {
            try {
                const parsed = JSON.parse(trimmed) as any;
                return String(parsed?.access || parsed?.message || s);
            } catch {
                return s; // fall back to raw string
            }
        }

        return s;
    }

    const syncFixtures = useAction(api.fixtures.syncFixtures);
    const importMatch = useMutation(api.matches.createMatch);

    const [mode, setMode] = useState<"yesterday" | "today" | "tomorrow">("today");
    const [syncing, setSyncing] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [importing, setImporting] = useState(false);

    const fixtures = useQuery(api.fixtures.getFixturesByDay, { mode });
    const syncLogs = useQuery(api.fixtures.getSyncLogs, { limit: 1 });

    const handleSync = async () => {
        setSyncing(true);
        try {
            await syncFixtures({ mode });
        } catch (error) {
            console.error(error);
            alert("Sync failed. Check console for details.");
        } finally {
            setSyncing(false);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelected(newSelected);
    };

    const selectAll = () => {
        if (!fixtures) return;
        if (selected.size === fixtures.length) setSelected(new Set());
        else setSelected(new Set(fixtures.map(f => f._id)));
    };

    const handleImport = async () => {
        if (!fixtures) return;
        setImporting(true);
        const toImport = fixtures.filter(f => selected.has(f._id));

        for (const f of toImport) {
            await importMatch({
                slug: f.slug,
                title: `${f.homeName} vs ${f.awayName}`,
                teamA: f.homeName,
                teamB: f.awayName,
                leagueName: f.leagueName,
                leagueId: "api-import", // Placeholder for schema compatibility
                kickoffAt: f.kickoffAt,
                status: f.statusNormalized,
                isPremium: false,
                embeds: [],
                // Use home/away logos combined or league logo if available?
                // For now leaving null as we don't have a single banner URL
                thumbnailUrl: undefined,
                summary: f.description
            });
        }

        setSelected(new Set());
        setImporting(false);
        alert(`Successfully imported ${toImport.length} matches!`);
    };

    const lastSync = syncLogs?.[0];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">IMPORT FIXTURES</h1>
                    <p className="text-text-muted">Sync from API-Football & Import to Matches</p>
                </div>
                {lastSync && (
                    <div className="text-xs text-right">
                        <p className="text-text-muted">Last Sync: {new Date(lastSync.ranAt).toLocaleString()}</p>
                        {lastSync.ok
                            ? `Success (${lastSync.importedCount} new)`
                            : `Failed: ${formatSyncError(lastSync.error)}`}
                    </div>
                )}
            </div>

            {/* Mode Selection */}
            <div className="flex gap-4 border-b border-border-subtle">
                {(["yesterday", "today", "tomorrow"] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`pb-3 px-2 text-sm font-bold capitalize transition-colors border-b-2 ${mode === m
                            ? "border-accent-green text-accent-green"
                            : "border-transparent text-text-muted hover:text-white"
                            }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Sync Action */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 flex items-center justify-between">
                <div>
                    <h3 className="font-bold mb-1">Sync {mode}'s Fixtures</h3>
                    <p className="text-sm text-text-muted">Fetch latest data from API-Football to database.</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="px-6 py-3 bg-accent-green text-black font-bold rounded-xl flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                    {syncing ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                    {syncing ? "Syncing..." : "Sync Now"}
                </button>
            </div>

            {/* Fixtures List */}
            {fixtures && fixtures.length > 0 ? (
                <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border-strong flex justify-between items-center bg-stadium-dark">
                        <div className="flex items-center gap-4">
                            <button onClick={selectAll} className="text-sm text-accent-green font-bold">
                                {selected.size === fixtures.length ? "Deselect All" : "Select All"}
                            </button>
                            <span className="text-sm text-text-muted">{selected.size} selected</span>
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={selected.size === 0 || importing}
                            className="px-4 py-2 bg-accent-green text-black font-bold rounded-lg disabled:opacity-50 text-sm flex items-center gap-2"
                        >
                            {importing ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                            {importing ? "Importing..." : "Import Selected"}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-stadium-dark text-text-muted uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Match</th>
                                    <th className="px-4 py-3">League</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fixtures.map((f) => (
                                    <tr
                                        key={f._id}
                                        className={`border-b border-border-subtle hover:bg-stadium-hover cursor-pointer transition-colors ${selected.has(f._id) ? "bg-accent-green/10" : ""}`}
                                        onClick={() => toggleSelect(f._id)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.has(f._id) ? "bg-accent-green border-accent-green" : "border-text-muted"}`}>
                                                {selected.has(f._id) && <Check size={12} className="text-black" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-text-muted">
                                            {new Date(f.kickoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 font-bold">
                                            <div className="flex items-center gap-2">
                                                <span>{f.homeName}</span>
                                                <span className="text-text-muted text-xs">vs</span>
                                                <span>{f.awayName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">{f.leagueName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${f.statusNormalized === "live" ? "bg-accent-red text-white" :
                                                f.statusNormalized === "finished" ? "bg-stadium-dark text-text-muted" :
                                                    "bg-accent-blue/20 text-accent-blue"
                                                }`}>
                                                {f.statusNormalized}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-text-muted bg-stadium-elevated rounded-xl border border-border-strong border-dashed">
                    <p>No fixtures found for {mode}. Click "Sync Now" to fetch from API.</p>
                </div>
            )}
        </div>
    );
}
