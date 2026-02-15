"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Download, Trash2, Copy, Check, Filter, Ban, MessageSquare } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const planOptions = [
    { value: "match", label: "Ciyaar Keliya", days: 1 },
    { value: "weekly", label: "Usbuuclaha", days: 7 },
    { value: "monthly", label: "Bishiiba", days: 30 },
    { value: "yearly", label: "Sannadkiiba", days: 365 },
];

const trialHourOptions = [
    { value: 1, label: "1 Hour" },
    { value: 2, label: "2 Hours" },
    { value: 4, label: "4 Hours" },
];

export default function AdminCodesPage() {
    const { data: codes, mutate } = useSWR("/api/redemptions", fetcher);
    const { data: stats, mutate: mutateStats } = useSWR("/api/redemptions?stats=true", fetcher);

    const [showModal, setShowModal] = useState(false);
    const [codeType, setCodeType] = useState<"subscription" | "movie_trial">("subscription");
    const [plan, setPlan] = useState<"match" | "weekly" | "monthly" | "yearly">("weekly");
    const [count, setCount] = useState(10);
    const [customMaxDevices, setCustomMaxDevices] = useState(1);
    const [trialHours, setTrialHours] = useState<1 | 2 | 4>(2);
    const [trialMovieId, setTrialMovieId] = useState("");
    const [trialMovieTitle, setTrialMovieTitle] = useState("");
    const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [filter, setFilter] = useState<"all" | "unused" | "used" | "revoked">("all");

    // WhatsApp Modal State
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [whatsAppReply, setWhatsAppReply] = useState("");

    const handleGenerate = async () => {
        if (codeType === "movie_trial" && !trialMovieId.trim()) {
            alert("Fadlan geli Movie ID / slug si trial code loo sameeyo.");
            return;
        }

        const planOption = planOptions.find(p => p.value === plan);
        const maxDevices = codeType === "movie_trial" ? 1 : customMaxDevices;

        const res = await fetch("/api/redemptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                plan: codeType === "movie_trial" ? "match" : plan,
                count,
                durationDays: codeType === "movie_trial" ? 1 : (planOption?.days || 7),
                maxDevices,
                trialHours: codeType === "movie_trial" ? trialHours : undefined,
                trialMovieId: codeType === "movie_trial" ? trialMovieId.trim() : undefined,
                trialMovieTitle: codeType === "movie_trial" ? trialMovieTitle.trim() || undefined : undefined,
                source: codeType === "movie_trial" ? "trial_admin" : "manual",
            }),
        });
        const newCodes = await res.json();
        setGeneratedCodes(newCodes);
        mutate();
        mutateStats();
    };

    const handleCopy = (code: string, index: number) => {
        navigator.clipboard.writeText(code);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleCopyAll = () => {
        navigator.clipboard.writeText(generatedCodes.join("\n"));
        setCopiedIndex(-1);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleExportCSV = () => {
        if (!codes) return;

        const csv = [
            ["Code", "Plan", "Duration", "Max Devices", "Trial Hours", "Trial Movie", "Used", "Revoked", "Created"],
            ...codes.map((c: any) => [
                c.code,
                c.trialHours ? "movie_trial" : c.plan,
                c.trialHours ? `${c.trialHours} hours` : `${c.durationDays} days`,
                c.maxDevices,
                c.trialHours || "",
                c.trialMovieId || "",
                c.usedByUserId ? "Yes" : "No",
                c.revokedAt ? "Yes" : "No",
                new Date(c.createdAt).toISOString(),
            ])
        ].map((row: any) => row.join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fanbroj-codes-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    const handleWhatsAppGenerate = async () => {
        if (codeType === "movie_trial" && !trialMovieId.trim()) {
            alert("Fadlan geli Movie ID / slug si trial code loo sameeyo.");
            return;
        }

        const planOption = planOptions.find(p => p.value === plan);
        const maxDevices = codeType === "movie_trial" ? 1 : customMaxDevices;

        const res = await fetch("/api/redemptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                plan: codeType === "movie_trial" ? "match" : plan,
                count: 1,
                durationDays: codeType === "movie_trial" ? 1 : (planOption?.days || 7),
                maxDevices,
                trialHours: codeType === "movie_trial" ? trialHours : undefined,
                trialMovieId: codeType === "movie_trial" ? trialMovieId.trim() : undefined,
                trialMovieTitle: codeType === "movie_trial" ? trialMovieTitle.trim() || undefined : undefined,
                source: codeType === "movie_trial" ? "trial_whatsapp" : "whatsapp",
            }),
        });
        const newCodes = await res.json();
        const code = newCodes[0];
        const link = `https://fanbroj.net/login`;
        const trialLabelMovie = trialMovieTitle.trim() || trialMovieId.trim();
        const reply = codeType === "movie_trial"
            ? `Mahadsanid! Waa kan TRIAL code-kaaga:

Code: *${code}*

Trial: *${trialHours} saac*
Movie: *${trialLabelMovie}* (hal filim)

Isticmaal halkan: ${link}
Markaad geliso code-ka, si toos ah ayuu kuu furayaa filimka trial-ka.`
            : `Mahadsanid! Waa kan code-kaaga *${planOption?.label}*:

Code: *${code}*

Ku shub halkan: ${link}

Ama gal pricing page-ka oo dooro "Redeem Code".`;

        setWhatsAppReply(reply);
        setGeneratedCodes([code]);
        mutate();
        mutateStats();
    };

    const handleRevoke = async (id: string) => {
        if (!confirm("Ma hubtaa inaad joojiso code-kan?")) return;
        await fetch("/api/redemptions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, action: "revoke" }),
        });
        mutate();
        mutateStats();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Ma hubtaa inaad tirtirto code-kan?")) return;
        await fetch(`/api/redemptions?id=${id}`, { method: "DELETE" });
        mutate();
        mutateStats();
    };

    const filteredCodes = codes?.filter((c: any) => {
        if (filter === "unused") return !c.usedByUserId && !c.revokedAt;
        if (filter === "used") return c.usedByUserId;
        if (filter === "revoked") return c.revokedAt;
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">CODES</h1>
                    <p className="text-text-muted">Generate iyo manage subscription codes</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setShowWhatsAppModal(true); setWhatsAppReply(""); setGeneratedCodes([]); setCodeType("subscription"); }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-green-700"
                    >
                        <MessageSquare size={18} />
                        WhatsApp Order
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-stadium-hover rounded-lg text-text-secondary hover:text-white flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => { setShowModal(true); setGeneratedCodes([]); setCodeType("subscription"); }}
                        className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Generate Codes
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black">{stats.total}</div>
                        <div className="text-xs text-text-muted uppercase">Total</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black text-accent-green">{stats.available}</div>
                        <div className="text-xs text-text-muted uppercase">Available</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black text-blue-400">{stats.used}</div>
                        <div className="text-xs text-text-muted uppercase">Used</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black text-accent-red">{stats.revoked}</div>
                        <div className="text-xs text-text-muted uppercase">Revoked</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-sm font-bold">
                            T:{stats.byPlan?.trial || 0} M:{stats.byPlan?.match} W:{stats.byPlan?.weekly} M:{stats.byPlan?.monthly} Y:{stats.byPlan?.yearly}
                        </div>
                        <div className="text-xs text-text-muted uppercase">By Plan</div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-text-muted" />
                {["all", "unused", "used", "revoked"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1 rounded-full text-sm ${filter === f
                            ? "bg-accent-green text-black font-bold"
                            : "bg-stadium-hover text-text-secondary"
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Codes Table */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-dark border-b border-border-strong">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Code</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Plan</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Duration</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Devices</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCodes?.map((code: any) => (
                            <tr key={code._id} className="border-b border-border-subtle last:border-0">
                                <td className="px-4 py-3 font-mono font-bold">{code.code}</td>
                                <td className="px-4 py-3 capitalize">
                                    {code.trialHours ? "movie_trial" : code.plan}
                                </td>
                                <td className="px-4 py-3">
                                    {code.trialHours ? `${code.trialHours} saac (${code.trialMovieId || "movie"})` : `${code.durationDays} maalmood`}
                                </td>
                                <td className="px-4 py-3">{code.maxDevices}</td>
                                <td className="px-4 py-3">
                                    {code.revokedAt ? (
                                        <span className="text-accent-red text-sm">Revoked</span>
                                    ) : code.usedByUserId ? (
                                        <span className="text-blue-400 text-sm">Used</span>
                                    ) : (
                                        <span className="text-accent-green text-sm">Available</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        {!code.revokedAt && (
                                            <button
                                                onClick={() => handleRevoke(code._id)}
                                                title="Revoke (Jooji)"
                                                className="text-text-muted hover:text-accent-gold"
                                            >
                                                <Ban size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(code._id)}
                                            title="Delete (Tirtir)"
                                            className="text-text-muted hover:text-accent-red"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Generate Codes Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">Generate Codes</h2>

                        {generatedCodes.length === 0 ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Code Type</label>
                                    <select
                                        value={codeType}
                                        onChange={(e) => setCodeType(e.target.value as "subscription" | "movie_trial")}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        <option value="subscription">Subscription Code</option>
                                        <option value="movie_trial">Movie Trial Code (1 movie)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Plan</label>
                                    <select
                                        value={plan}
                                        onChange={(e) => {
                                            const newPlan = e.target.value as any;
                                            setPlan(newPlan);
                                            if (newPlan === "match") setCustomMaxDevices(1);
                                            if (newPlan === "weekly") setCustomMaxDevices(2);
                                            if (newPlan === "monthly") setCustomMaxDevices(3);
                                            if (newPlan === "yearly") setCustomMaxDevices(5);
                                        }}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        {planOptions.map((p) => (
                                            <option key={p.value} value={p.value}>{p.label} ({p.days} maalmood)</option>
                                        ))}
                                    </select>
                                </div>

                                {codeType === "movie_trial" && (
                                    <>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Trial Hours</label>
                                            <select
                                                value={trialHours}
                                                onChange={(e) => setTrialHours(Number(e.target.value) as 1 | 2 | 4)}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            >
                                                {trialHourOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Movie Slug / ID</label>
                                            <input
                                                type="text"
                                                value={trialMovieId}
                                                onChange={(e) => setTrialMovieId(e.target.value)}
                                                placeholder="tusaale: andaaz-af-somali"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Movie Title (Optional)</label>
                                            <input
                                                type="text"
                                                value={trialMovieTitle}
                                                onChange={(e) => setTrialMovieTitle(e.target.value)}
                                                placeholder="Tusaale: Andaaz Af Somali"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Tirada Codes</label>
                                    <input
                                        type="number"
                                        value={count}
                                        onChange={(e) => setCount(Number(e.target.value))}
                                        min={1}
                                        max={500}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Max Devices (Devices-ka la ogolyahay)</label>
                                    <input
                                        type="number"
                                        value={codeType === "movie_trial" ? 1 : customMaxDevices}
                                        onChange={(e) => setCustomMaxDevices(Number(e.target.value))}
                                        min={1}
                                        max={10}
                                        disabled={codeType === "movie_trial"}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-stadium-hover rounded-lg">Cancel</button>
                                    <button onClick={handleGenerate} className="flex-1 px-4 py-3 bg-accent-green text-black font-bold rounded-lg">Generate</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">{generatedCodes.length} codes generated</span>
                                    <button onClick={handleCopyAll} className="text-accent-green text-sm flex items-center gap-1">
                                        {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
                                        Copy All
                                    </button>
                                </div>

                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {generatedCodes.map((code, i) => (
                                        <div key={i} className="flex items-center justify-between bg-stadium-dark px-4 py-2 rounded-lg">
                                            <span className="font-mono font-bold">{code}</span>
                                            <button onClick={() => handleCopy(code, i)}>
                                                {copiedIndex === i ? <Check size={16} className="text-accent-green" /> : <Copy size={16} className="text-text-muted" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => setShowModal(false)} className="w-full px-4 py-3 bg-accent-green text-black font-bold rounded-lg mt-4">Done</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* WhatsApp Payment Modal */}
            {showWhatsAppModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <MessageSquare size={24} className="text-green-500" />
                            WhatsApp Fulfillment
                        </h2>

                        {!whatsAppReply ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Code Type</label>
                                    <select
                                        value={codeType}
                                        onChange={(e) => setCodeType(e.target.value as "subscription" | "movie_trial")}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        <option value="subscription">Subscription Code</option>
                                        <option value="movie_trial">Movie Trial Code (1 movie)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Customer Plan</label>
                                    <select
                                        value={plan}
                                        onChange={(e) => {
                                            const newPlan = e.target.value as any;
                                            setPlan(newPlan);
                                            if (newPlan === "match") setCustomMaxDevices(1);
                                            if (newPlan === "weekly") setCustomMaxDevices(2);
                                            if (newPlan === "monthly") setCustomMaxDevices(3);
                                            if (newPlan === "yearly") setCustomMaxDevices(5);
                                        }}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        {planOptions.map((p) => (
                                            <option key={p.value} value={p.value}>
                                                {p.label} ({p.days} maalmood)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {codeType === "movie_trial" && (
                                    <>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Trial Hours</label>
                                            <select
                                                value={trialHours}
                                                onChange={(e) => setTrialHours(Number(e.target.value) as 1 | 2 | 4)}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            >
                                                {trialHourOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Movie Slug / ID</label>
                                            <input
                                                type="text"
                                                value={trialMovieId}
                                                onChange={(e) => setTrialMovieId(e.target.value)}
                                                placeholder="tusaale: andaaz-af-somali"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Movie Title (Optional)</label>
                                            <input
                                                type="text"
                                                value={trialMovieTitle}
                                                onChange={(e) => setTrialMovieTitle(e.target.value)}
                                                placeholder="Tusaale: Andaaz Af Somali"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Max Devices</label>
                                    <input
                                        type="number"
                                        value={codeType === "movie_trial" ? 1 : customMaxDevices}
                                        onChange={(e) => setCustomMaxDevices(Number(e.target.value))}
                                        min={1}
                                        max={10}
                                        disabled={codeType === "movie_trial"}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setShowWhatsAppModal(false)} className="flex-1 px-4 py-3 bg-stadium-hover rounded-lg">Cancel</button>
                                    <button onClick={handleWhatsAppGenerate} className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Generate & Create Reply</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-stadium-dark p-4 rounded-lg border border-border-subtle">
                                    <label className="block text-xs uppercase text-text-muted mb-2 font-bold max-w-full">
                                        WhatsApp Reply (Copy & Paste)
                                    </label>
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-white mb-3">
                                        {whatsAppReply}
                                    </pre>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(whatsAppReply)}
                                        className="w-full py-2 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center gap-2 text-sm font-bold"
                                    >
                                        <Copy size={16} /> Copy Message
                                    </button>
                                </div>

                                <div className="text-center text-sm text-text-muted">
                                    Code: <span className="font-mono text-white font-bold">{generatedCodes[0]}</span> created.
                                </div>

                                <button
                                    onClick={() => { setWhatsAppReply(""); setShowWhatsAppModal(false); }}
                                    className="w-full px-4 py-3 bg-stadium-hover text-white rounded-lg"
                                >
                                    Close / New Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
