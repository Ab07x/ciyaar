"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Trash2, Filter, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const planOptions = ["match", "weekly", "monthly", "yearly"];

function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

export default function AdminDiscountsPage() {
    const { data: codes, mutate } = useSWR("/api/discounts", fetcher);
    const { data: stats, mutate: mutateStats } = useSWR("/api/discounts?stats=true", fetcher);

    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<"all" | "active" | "expired" | "inactive">("all");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form state
    const [formCode, setFormCode] = useState("");
    const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
    const [formValue, setFormValue] = useState("");
    const [formPlans, setFormPlans] = useState<string[]>([]);
    const [formMaxUses, setFormMaxUses] = useState("0");
    const [formExpiry, setFormExpiry] = useState("");
    const [formNote, setFormNote] = useState("");
    const [formError, setFormError] = useState("");

    const handleCreate = async () => {
        setFormError("");
        if (!formCode.trim()) { setFormError("Code is required"); return; }
        if (!formValue || Number(formValue) <= 0) { setFormError("Discount value must be greater than 0"); return; }
        if (formType === "percentage" && Number(formValue) > 99) { setFormError("Percentage must be 1-99"); return; }

        const res = await fetch("/api/discounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: formCode.trim(),
                discountType: formType,
                discountValue: Number(formValue),
                applicablePlans: formPlans,
                maxUses: Number(formMaxUses) || 0,
                expiresAt: formExpiry ? new Date(formExpiry).getTime() : null,
                note: formNote.trim(),
            }),
        });
        const data = await res.json();
        if (!res.ok) { setFormError(data.error || "Failed to create"); return; }
        mutate(); mutateStats();
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setFormCode(""); setFormType("percentage"); setFormValue(""); setFormPlans([]);
        setFormMaxUses("0"); setFormExpiry(""); setFormNote(""); setFormError("");
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        await fetch("/api/discounts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isActive: !currentActive }),
        });
        mutate(); mutateStats();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this discount code?")) return;
        await fetch(`/api/discounts?id=${id}`, { method: "DELETE" });
        mutate(); mutateStats();
    };

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const togglePlan = (plan: string) => {
        setFormPlans(prev => prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]);
    };

    const now = Date.now();
    const filteredCodes = codes?.filter((c: any) => {
        if (filter === "active") return c.isActive && (!c.expiresAt || c.expiresAt > now);
        if (filter === "inactive") return !c.isActive;
        if (filter === "expired") return c.expiresAt && c.expiresAt <= now;
        return true;
    });

    const getStatus = (c: any) => {
        if (!c.isActive) return { label: "Inactive", color: "text-gray-400" };
        if (c.expiresAt && c.expiresAt <= now) return { label: "Expired", color: "text-accent-red" };
        if (c.maxUses > 0 && c.usedCount >= c.maxUses) return { label: "Maxed Out", color: "text-yellow-400" };
        return { label: "Active", color: "text-accent-green" };
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">DISCOUNTS</h1>
                    <p className="text-text-muted">Create and manage discount / coupon codes</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); resetForm(); setFormCode(generateCode()); }}
                    className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Discount
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black">{stats.total}</div>
                        <div className="text-xs text-text-muted uppercase">Total</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black text-accent-green">{stats.active}</div>
                        <div className="text-xs text-text-muted uppercase">Active</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black text-gray-400">{stats.inactive}</div>
                        <div className="text-xs text-text-muted uppercase">Inactive</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black text-accent-red">{stats.expired}</div>
                        <div className="text-xs text-text-muted uppercase">Expired</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className="text-2xl font-black text-blue-400">{stats.totalUses}</div>
                        <div className="text-xs text-text-muted uppercase">Total Uses</div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-text-muted" />
                {(["all", "active", "expired", "inactive"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-sm ${filter === f
                            ? "bg-accent-green text-black font-bold"
                            : "bg-stadium-hover text-text-secondary"
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-dark border-b border-border-strong">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Code</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Discount</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Plans</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Uses</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Expires</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCodes?.map((code: any) => {
                            const status = getStatus(code);
                            return (
                                <tr key={code._id} className="border-b border-border-subtle last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold">{code.code}</span>
                                            <button onClick={() => handleCopy(code.code, code._id)} className="text-text-muted hover:text-white">
                                                {copiedId === code._id ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        {code.note && <p className="text-xs text-text-muted mt-1">{code.note}</p>}
                                    </td>
                                    <td className="px-4 py-3 font-bold">
                                        {code.discountType === "percentage" ? `${code.discountValue}%` : `$${code.discountValue.toFixed(2)}`}
                                    </td>
                                    <td className="px-4 py-3">
                                        {code.applicablePlans?.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {code.applicablePlans.map((p: string) => (
                                                    <span key={p} className="px-2 py-0.5 text-xs bg-stadium-hover rounded capitalize">{p}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-text-muted text-sm">All plans</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-bold">{code.usedCount}</span>
                                        <span className="text-text-muted">/{code.maxUses || "\u221E"}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : "Never"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleActive(code._id, code.isActive)}
                                                title={code.isActive ? "Deactivate" : "Activate"}
                                                className="text-text-muted hover:text-white"
                                            >
                                                {code.isActive ? <ToggleRight size={20} className="text-accent-green" /> : <ToggleLeft size={20} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(code._id)}
                                                title="Delete"
                                                className="text-text-muted hover:text-accent-red"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredCodes?.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">No discount codes found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">New Discount Code</h2>

                        <div className="space-y-4">
                            {/* Code */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formCode}
                                        onChange={e => setFormCode(e.target.value.toUpperCase())}
                                        placeholder="SUMMER20"
                                        className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono uppercase"
                                    />
                                    <button onClick={() => setFormCode(generateCode())} className="px-3 py-2 bg-stadium-hover rounded-lg text-sm text-text-secondary hover:text-white">
                                        Random
                                    </button>
                                </div>
                            </div>

                            {/* Type + Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Discount Type</label>
                                    <select
                                        value={formType}
                                        onChange={e => setFormType(e.target.value as "percentage" | "fixed")}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">
                                        Value {formType === "percentage" ? "(%)" : "($)"}
                                    </label>
                                    <input
                                        type="number"
                                        value={formValue}
                                        onChange={e => setFormValue(e.target.value)}
                                        min={1}
                                        max={formType === "percentage" ? 99 : 1000}
                                        step={formType === "fixed" ? 0.01 : 1}
                                        placeholder={formType === "percentage" ? "20" : "2.00"}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>
                            </div>

                            {/* Applicable Plans */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Applicable Plans (empty = all plans)</label>
                                <div className="flex flex-wrap gap-2">
                                    {planOptions.map(plan => (
                                        <button
                                            key={plan}
                                            type="button"
                                            onClick={() => togglePlan(plan)}
                                            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                                                formPlans.includes(plan)
                                                    ? "bg-accent-green text-black font-bold"
                                                    : "bg-stadium-hover text-text-secondary"
                                            }`}
                                        >
                                            {plan}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Max Uses */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Max Uses (0 = unlimited)</label>
                                <input
                                    type="number"
                                    value={formMaxUses}
                                    onChange={e => setFormMaxUses(e.target.value)}
                                    min={0}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>

                            {/* Expiry */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Expires At (optional)</label>
                                <input
                                    type="datetime-local"
                                    value={formExpiry}
                                    onChange={e => setFormExpiry(e.target.value)}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Admin Note (optional)</label>
                                <input
                                    type="text"
                                    value={formNote}
                                    onChange={e => setFormNote(e.target.value)}
                                    placeholder="e.g. Summer promo campaign"
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>

                            {formError && (
                                <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/30 rounded-lg px-4 py-3">
                                    {formError}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-stadium-hover rounded-lg">Cancel</button>
                                <button onClick={handleCreate} className="flex-1 px-4 py-3 bg-accent-green text-black font-bold rounded-lg">Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
