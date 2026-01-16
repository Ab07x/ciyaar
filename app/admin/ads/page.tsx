"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const networks = ["adsense", "adsterra", "monetag", "custom"] as const;
const formats = ["responsive", "banner", "native"] as const;
const pages = ["home", "match", "blog", "archive", "pricing"] as const;

export default function AdminAdsPage() {
    const ads = useQuery(api.ads.listAds);
    const settings = useQuery(api.settings.getSettings);
    const updateSettings = useMutation(api.settings.updateSettings);
    const createAd = useMutation(api.ads.createAd);
    const updateAd = useMutation(api.ads.updateAd);
    const deleteAd = useMutation(api.ads.deleteAd);
    const toggleAd = useMutation(api.ads.toggleAd);

    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState<any>(null);
    const [formData, setFormData] = useState({
        slotKey: "",
        network: "custom" as typeof networks[number],
        format: "responsive" as typeof formats[number],
        codeHtml: "",
        adsenseClient: "",
        adsenseSlot: "",
        showOn: [] as string[],
        enabled: true,
    });

    const handleSubmit = async () => {
        if (editingAd) {
            await updateAd({ id: editingAd._id, ...formData });
        } else {
            await createAd(formData);
        }
        setShowModal(false);
        setEditingAd(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            slotKey: "",
            network: "custom",
            format: "responsive",
            codeHtml: "",
            adsenseClient: "",
            adsenseSlot: "",
            showOn: [],
            enabled: true,
        });
    };

    const openEdit = (ad: any) => {
        setEditingAd(ad);
        setFormData({
            slotKey: ad.slotKey,
            network: ad.network,
            format: ad.format,
            codeHtml: ad.codeHtml || "",
            adsenseClient: ad.adsenseClient || "",
            adsenseSlot: ad.adsenseSlot || "",
            showOn: ad.showOn,
            enabled: ad.enabled,
        });
        setShowModal(true);
    };

    const toggleShowOn = (page: string) => {
        if (formData.showOn.includes(page)) {
            setFormData({ ...formData, showOn: formData.showOn.filter(p => p !== page) });
        } else {
            setFormData({ ...formData, showOn: [...formData.showOn, page] });
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">ADS</h1>
                    <p className="text-text-muted">Maamul xayeysiisyada</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingAd(null); resetForm(); }}
                    className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Slot
                </button>
            </div>

            {/* Global Toggle */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold">Ads Enabled Globally</h3>
                        <p className="text-sm text-text-muted">Dami ama fur dhammaan xayeysiisyada</p>
                    </div>
                    <button
                        onClick={() => updateSettings({ adsEnabled: !settings?.adsEnabled })}
                        className={`p-2 rounded-lg ${settings?.adsEnabled ? "bg-accent-green/20 text-accent-green" : "bg-stadium-hover text-text-muted"}`}
                    >
                        {settings?.adsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                </div>
            </div>

            {/* Ads Table */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-dark border-b border-border-strong">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Slot Key</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Network</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Format</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Pages</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ads?.map((ad) => (
                            <tr key={ad._id} className="border-b border-border-subtle last:border-0">
                                <td className="px-4 py-3 font-mono font-bold">{ad.slotKey}</td>
                                <td className="px-4 py-3 capitalize">{ad.network}</td>
                                <td className="px-4 py-3 capitalize">{ad.format}</td>
                                <td className="px-4 py-3 text-sm">{ad.showOn.join(", ")}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => toggleAd({ id: ad._id })}
                                        className={`text-sm font-bold ${ad.enabled ? "text-accent-green" : "text-text-muted"}`}
                                    >
                                        {ad.enabled ? "Active" : "Disabled"}
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEdit(ad)} className="p-2 hover:bg-stadium-hover rounded-lg">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => deleteAd({ id: ad._id })} className="p-2 hover:bg-stadium-hover rounded-lg text-accent-red">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {ads?.length === 0 && (
                    <div className="p-12 text-center text-text-muted">
                        Wax ad slots ah ma jiraan
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 max-w-lg w-full">
                        <h2 className="text-2xl font-bold mb-6">{editingAd ? "Edit Slot" : "Add Slot"}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Slot Key</label>
                                <input
                                    type="text"
                                    value={formData.slotKey}
                                    onChange={(e) => setFormData({ ...formData, slotKey: e.target.value })}
                                    placeholder="e.g. home_top"
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Network</label>
                                    <select
                                        value={formData.network}
                                        onChange={(e) => setFormData({ ...formData, network: e.target.value as any })}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        {networks.map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Format</label>
                                    <select
                                        value={formData.format}
                                        onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        {formats.map((f) => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {formData.network === "custom" && (
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Custom HTML Code</label>
                                    <textarea
                                        value={formData.codeHtml}
                                        onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                        rows={4}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm resize-none"
                                    />
                                </div>
                            )}

                            {formData.network === "adsense" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">AdSense Client</label>
                                        <input
                                            type="text"
                                            value={formData.adsenseClient}
                                            onChange={(e) => setFormData({ ...formData, adsenseClient: e.target.value })}
                                            placeholder="ca-pub-..."
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">AdSense Slot</label>
                                        <input
                                            type="text"
                                            value={formData.adsenseSlot}
                                            onChange={(e) => setFormData({ ...formData, adsenseSlot: e.target.value })}
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Show On Pages</label>
                                <div className="flex flex-wrap gap-2">
                                    {pages.map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => toggleShowOn(page)}
                                            className={`px-3 py-1 rounded-full text-sm ${formData.showOn.includes(page)
                                                    ? "bg-accent-green text-black font-bold"
                                                    : "bg-stadium-hover text-text-secondary"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-stadium-hover rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-3 bg-accent-green text-black font-bold rounded-lg"
                                >
                                    {editingAd ? "Update" : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
