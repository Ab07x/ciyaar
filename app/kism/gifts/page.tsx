"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Gift, Plus, Copy, Check, Download, Filter } from "lucide-react";

const planOptions = [
    { value: "monthly", label: "1 Bishiiba", days: 30 },
    { value: "3month", label: "3 Bilood", days: 90 },
    { value: "yearly", label: "Sanad Buuxa", days: 365 },
];

const occasionOptions = [
    { value: "general", label: "General", emoji: "🎁" },
    { value: "ramadan", label: "Ramadan", emoji: "🌙" },
    { value: "eid", label: "Ciid", emoji: "🎊" },
    { value: "birthday", label: "Birthday", emoji: "🎂" },
];

export default function AdminGiftsPage() {
    const settings = useQuery(api.settings.getSettings);
    const generateBulkGifts = useMutation(api.gifts.generateBulkGiftCodes);

    const [showModal, setShowModal] = useState(false);
    const [plan, setPlan] = useState<"monthly" | "3month" | "yearly">("monthly");
    const [occasion, setOccasion] = useState<"ramadan" | "eid" | "birthday" | "general">("general");
    const [count, setCount] = useState(10);
    const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!settings?.adminPassword) {
            alert("Admin password not set");
            return;
        }

        try {
            const result = await generateBulkGifts({
                adminPass: settings.adminPassword,
                plan,
                count,
                occasion,
            });
            setGeneratedCodes(result.codes);
        } catch (error: any) {
            alert("Error: " + error.message);
        }
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
        if (generatedCodes.length === 0) return;

        const planInfo = planOptions.find((p) => p.value === plan);
        const occasionInfo = occasionOptions.find((o) => o.value === occasion);

        const csv = [
            ["Gift Code", "Plan", "Duration", "Occasion", "Generated At"],
            ...generatedCodes.map((code) => [
                code,
                planInfo?.label || plan,
                `${planInfo?.days || 30} days`,
                occasionInfo?.label || occasion,
                new Date().toISOString(),
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fanbroj-gift-codes-${occasion}-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Gift className="text-purple-400" />
                        GIFT CODES
                    </h1>
                    <p className="text-text-muted">Generate hadiyad codes for special occasions</p>
                </div>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setGeneratedCodes([]);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} />
                    Generate Gift Codes
                </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planOptions.map((p) => (
                    <div
                        key={p.value}
                        className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
                    >
                        <h3 className="text-lg font-bold text-white">{p.label}</h3>
                        <p className="text-text-muted text-sm">{p.days} maalmood Premium</p>
                        <div className="mt-4 flex items-center gap-2">
                            {occasionOptions.map((o) => (
                                <span key={o.value} title={o.label} className="text-xl">
                                    {o.emoji}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* How it works */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="font-bold text-white mb-4">Sida ay u shaqeyso:</h3>
                <ol className="space-y-2 text-text-secondary text-sm">
                    <li className="flex gap-2">
                        <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">1</span>
                        <span>Dooro plan-ka iyo occasion-ka</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">2</span>
                        <span>Generate gift codes</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">3</span>
                        <span>U dir gift code qofka aad rabto via WhatsApp</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">4</span>
                        <span>Qofka wuxuu ku galiyaa code-ka /pricing page-ka</span>
                    </li>
                </ol>
            </div>

            {/* Generate Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Gift className="text-purple-400" />
                            Generate Gift Codes
                        </h2>

                        {generatedCodes.length === 0 ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Plan</label>
                                    <select
                                        value={plan}
                                        onChange={(e) => setPlan(e.target.value as any)}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        {planOptions.map((p) => (
                                            <option key={p.value} value={p.value}>
                                                {p.label} ({p.days} maalmood)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Occasion</label>
                                    <select
                                        value={occasion}
                                        onChange={(e) => setOccasion(e.target.value as any)}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        {occasionOptions.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.emoji} {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Tirada Codes</label>
                                    <input
                                        type="number"
                                        value={count}
                                        onChange={(e) => setCount(Number(e.target.value))}
                                        min={1}
                                        max={100}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-3 bg-stadium-hover rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">{generatedCodes.length} gift codes generated</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopyAll}
                                            className="text-purple-400 text-sm flex items-center gap-1"
                                        >
                                            {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
                                            Copy All
                                        </button>
                                        <button
                                            onClick={handleExportCSV}
                                            className="text-purple-400 text-sm flex items-center gap-1"
                                        >
                                            <Download size={14} />
                                            CSV
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {generatedCodes.map((code, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between bg-stadium-dark px-4 py-2 rounded-lg"
                                        >
                                            <span className="font-mono font-bold text-purple-300">{code}</span>
                                            <button onClick={() => handleCopy(code, i)}>
                                                {copiedIndex === i ? (
                                                    <Check size={16} className="text-accent-green" />
                                                ) : (
                                                    <Copy size={16} className="text-text-muted" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg mt-4"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
