"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Edit, Trash2, Video, Globe, Code, Tv, MousePointerClick, Link2, Bell } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const networks = ["adsense", "adsterra", "monetag", "monetag_onclick", "monetag_direct", "monetag_inpage", "custom", "vast", "video", "popup", "ppv"] as const;
const formats = ["responsive", "banner", "native", "interstitial", "video_preroll", "video_midroll", "popunder", "social_bar", "onclick", "direct_link", "inpage_push"] as const;
const pages = ["home", "match", "movies", "series", "blog", "live", "pricing", "archive", "ppv"] as const;

const networkLabels: Record<string, string> = {
    adsense: "Google AdSense",
    adsterra: "Adsterra",
    monetag: "Monetag (Banner/Zone)",
    monetag_onclick: "Monetag — OnClick Popunder",
    monetag_direct: "Monetag — Direct Link",
    monetag_inpage: "Monetag — In-Page Push",
    custom: "Custom HTML",
    vast: "VAST/VPAID",
    video: "Video Ad",
    popup: "Popup/Popunder",
    ppv: "PPV Unlock",
};

const networkColors: Record<string, string> = {
    adsense: "bg-blue-500/20 text-blue-400",
    adsterra: "bg-orange-500/20 text-orange-400",
    monetag: "bg-green-500/20 text-green-400",
    monetag_onclick: "bg-emerald-500/20 text-emerald-400",
    monetag_direct: "bg-teal-500/20 text-teal-400",
    monetag_inpage: "bg-cyan-500/20 text-cyan-400",
    custom: "bg-gray-500/20 text-gray-400",
    vast: "bg-purple-500/20 text-purple-400",
    video: "bg-pink-500/20 text-pink-400",
    popup: "bg-red-500/20 text-red-400",
    ppv: "bg-yellow-500/20 text-yellow-400",
};

const formatLabels: Record<string, string> = {
    responsive: "Responsive",
    banner: "Banner",
    native: "Native",
    interstitial: "Interstitial",
    video_preroll: "Video Pre-roll",
    video_midroll: "Video Mid-roll",
    popunder: "Popunder",
    social_bar: "Social Bar",
    onclick: "OnClick",
    direct_link: "Direct Link",
    inpage_push: "In-Page Push",
};

export default function AdminAdsPage() {
    const { data: ads, mutate } = useSWR("/api/ads", fetcher);
    const { data: settings, mutate: mutateSettings } = useSWR("/api/settings", fetcher);

    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState<any>(null);
    const [formData, setFormData] = useState({
        slotKey: "",
        network: "custom" as typeof networks[number],
        format: "responsive" as typeof formats[number],
        codeHtml: "",
        adsenseClient: "",
        adsenseSlot: "",
        adsterraKey: "",
        adsterraDomain: "",
        vastUrl: "",
        vpaidEnabled: false,
        videoUrl: "",
        videoSkipAfter: 5,
        videoDuration: 15,
        popupUrl: "",
        popupWidth: 800,
        popupHeight: 600,
        monetagId: "",
        monetagDirectUrl: "",
        monetagDirectText: "Watch Now",
        showOn: [] as string[],
        enabled: true,
    });

    const handleSubmit = async () => {
        const payload = {
            slotKey: formData.slotKey,
            network: formData.network,
            format: formData.format,
            codeHtml: formData.codeHtml || undefined,
            adsenseClient: formData.adsenseClient || undefined,
            adsenseSlot: formData.adsenseSlot || undefined,
            adsterraKey: formData.adsterraKey || undefined,
            adsterraDomain: formData.adsterraDomain || undefined,
            vastUrl: formData.vastUrl || undefined,
            vpaidEnabled: formData.vpaidEnabled || undefined,
            videoUrl: formData.videoUrl || undefined,
            videoSkipAfter: formData.videoSkipAfter || undefined,
            videoDuration: formData.videoDuration || undefined,
            popupUrl: formData.popupUrl || undefined,
            popupWidth: formData.popupWidth || undefined,
            popupHeight: formData.popupHeight || undefined,
            monetagId: formData.monetagId || undefined,
            monetagDirectUrl: formData.monetagDirectUrl || undefined,
            monetagDirectText: formData.monetagDirectText || undefined,
            showOn: formData.showOn,
            enabled: formData.enabled,
        };

        if (editingAd) {
            await fetch("/api/ads", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingAd._id, ...payload }),
            });
        } else {
            await fetch("/api/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        }
        setShowModal(false);
        setEditingAd(null);
        resetForm();
        mutate();
    };

    const resetForm = () => {
        setFormData({
            slotKey: "",
            network: "custom",
            format: "responsive",
            codeHtml: "",
            adsenseClient: "",
            adsenseSlot: "",
            adsterraKey: "",
            adsterraDomain: "",
            vastUrl: "",
            vpaidEnabled: false,
            videoUrl: "",
            videoSkipAfter: 5,
            videoDuration: 15,
            popupUrl: "",
            popupWidth: 800,
            popupHeight: 600,
            monetagId: "",
            monetagDirectUrl: "",
            monetagDirectText: "Watch Now",
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
            adsterraKey: ad.adsterraKey || "",
            adsterraDomain: ad.adsterraDomain || "",
            vastUrl: ad.vastUrl || "",
            vpaidEnabled: ad.vpaidEnabled || false,
            videoUrl: ad.videoUrl || "",
            videoSkipAfter: ad.videoSkipAfter || 5,
            videoDuration: ad.videoDuration || 15,
            popupUrl: ad.popupUrl || "",
            popupWidth: ad.popupWidth || 800,
            popupHeight: ad.popupHeight || 600,
            monetagId: ad.monetagId || "",
            monetagDirectUrl: ad.monetagDirectUrl || "",
            monetagDirectText: ad.monetagDirectText || "Watch Now",
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

    const handleToggleAd = async (id: string, enabled: boolean) => {
        await fetch("/api/ads", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, enabled: !enabled }),
        });
        mutate();
    };

    const handleDeleteAd = async (id: string) => {
        if (!confirm("Delete this ad slot?")) return;
        await fetch(`/api/ads?id=${id}`, { method: "DELETE" });
        mutate();
    };

    const handleToggleGlobal = async () => {
        await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adsEnabled: !settings?.adsEnabled }),
        });
        mutateSettings();
    };

    const getNetworkIcon = (network: string) => {
        switch (network) {
            case "video": case "vast": return <Video size={13} className="inline mr-1" />;
            case "popup": return <Globe size={13} className="inline mr-1" />;
            case "ppv": return <Tv size={13} className="inline mr-1" />;
            case "monetag_onclick": return <MousePointerClick size={13} className="inline mr-1" />;
            case "monetag_direct": return <Link2 size={13} className="inline mr-1" />;
            case "monetag_inpage": return <Bell size={13} className="inline mr-1" />;
            default: return <Code size={13} className="inline mr-1" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">ADS MANAGER</h1>
                    <p className="text-text-muted">Maamul xayeysiisyada - Supports all ad types</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingAd(null); resetForm(); }}
                    className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Ad Slot
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
                        onClick={handleToggleGlobal}
                        className={`p-2 rounded-lg ${settings?.adsEnabled ? "bg-accent-green/20 text-accent-green" : "bg-stadium-hover text-text-muted"}`}
                    >
                        {settings?.adsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                </div>
            </div>

            {/* Ad Types Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {networks.map((n) => (
                    <div key={n} className="bg-stadium-elevated border border-border-subtle rounded-lg p-3 text-center">
                        <div className="text-xs text-text-muted uppercase tracking-wider">{networkLabels[n]}</div>
                    </div>
                ))}
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
                        {ads?.map((ad: any) => (
                            <tr key={ad._id} className={`border-b border-border-subtle last:border-0 transition-opacity ${ad.enabled ? "" : "opacity-40"}`}>
                                <td className="px-4 py-3">
                                    <span className="font-mono font-bold text-sm">{ad.slotKey}</span>
                                    {!ad.enabled && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">OFF</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${networkColors[ad.network] || "bg-blue-500/20 text-blue-400"}`}>
                                        {getNetworkIcon(ad.network)}
                                        {networkLabels[ad.network] || ad.network}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm capitalize text-text-secondary">{formatLabels[ad.format] || ad.format}</td>
                                <td className="px-4 py-3 text-xs text-text-muted">{ad.showOn?.join(", ") || "all"}</td>
                                <td className="px-4 py-3">
                                    {/* Visual toggle switch */}
                                    <button
                                        onClick={() => handleToggleAd(ad._id, ad.enabled)}
                                        title={ad.enabled ? "Click to disable" : "Click to enable"}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${ad.enabled ? "bg-accent-green" : "bg-stadium-hover border border-border-strong"}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${ad.enabled ? "translate-x-6" : "translate-x-1"}`} />
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEdit(ad)} className="p-2 hover:bg-stadium-hover rounded-lg" title="Edit">
                                            <Edit size={15} />
                                        </button>
                                        <button onClick={() => handleDeleteAd(ad._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-accent-red" title="Delete">
                                            <Trash2 size={15} />
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
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 max-w-2xl w-full my-8">
                        <h2 className="text-2xl font-bold mb-6">{editingAd ? "Edit Ad Slot" : "Add Ad Slot"}</h2>

                        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Slot Key */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Slot Key *</label>
                                <input
                                    type="text"
                                    value={formData.slotKey}
                                    onChange={(e) => setFormData({ ...formData, slotKey: e.target.value })}
                                    placeholder="e.g. home_top, ppv_unlock, movie_preroll"
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>

                            {/* Network & Format */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Ad Network *</label>
                                    <select
                                        value={formData.network}
                                        onChange={(e) => setFormData({ ...formData, network: e.target.value as any })}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        {networks.map((n) => (
                                            <option key={n} value={n}>{networkLabels[n]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-text-secondary mb-2">Format *</label>
                                    <select
                                        value={formData.format}
                                        onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    >
                                        {formats.map((f) => (
                                            <option key={f} value={f}>{formatLabels[f]}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Network-specific fields */}

                            {/* AdSense */}
                            {formData.network === "adsense" && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-4">
                                    <h4 className="font-bold text-blue-400">Google AdSense Settings</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">AdSense Client ID</label>
                                            <input
                                                type="text"
                                                value={formData.adsenseClient}
                                                onChange={(e) => setFormData({ ...formData, adsenseClient: e.target.value })}
                                                placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">AdSense Slot ID</label>
                                            <input
                                                type="text"
                                                value={formData.adsenseSlot}
                                                onChange={(e) => setFormData({ ...formData, adsenseSlot: e.target.value })}
                                                placeholder="1234567890"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Adsterra */}
                            {formData.network === "adsterra" && (
                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 space-y-4">
                                    <h4 className="font-bold text-orange-400">Adsterra Settings</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Adsterra Key</label>
                                            <input
                                                type="text"
                                                value={formData.adsterraKey}
                                                onChange={(e) => setFormData({ ...formData, adsterraKey: e.target.value })}
                                                placeholder="Your Adsterra key"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Adsterra Domain (optional)</label>
                                            <input
                                                type="text"
                                                value={formData.adsterraDomain}
                                                onChange={(e) => setFormData({ ...formData, adsterraDomain: e.target.value })}
                                                placeholder="//domain.com"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Or paste full Adsterra code</label>
                                        <textarea
                                            value={formData.codeHtml}
                                            onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                            rows={4}
                                            placeholder="<script>...</script>"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Monetag */}
                            {formData.network === "monetag" && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-4">
                                    <h4 className="font-bold text-green-400">Monetag Settings</h4>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Monetag Zone ID</label>
                                        <input
                                            type="text"
                                            value={formData.monetagId}
                                            onChange={(e) => setFormData({ ...formData, monetagId: e.target.value })}
                                            placeholder="Your Monetag zone ID"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Or paste full Monetag code</label>
                                        <textarea
                                            value={formData.codeHtml}
                                            onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                            rows={4}
                                            placeholder="<script>...</script>"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Monetag — OnClick Popunder */}
                            {formData.network === "monetag_onclick" && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <MousePointerClick size={16} className="text-emerald-400" />
                                        <h4 className="font-bold text-emerald-400">OnClick Popunder</h4>
                                    </div>
                                    <p className="text-xs text-text-muted">Fires a popunder tab on the user&apos;s first click on the page. Highest CPM format. Paste the script from your Monetag dashboard.</p>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Monetag Zone ID</label>
                                        <input
                                            type="text"
                                            value={formData.monetagId}
                                            onChange={(e) => setFormData({ ...formData, monetagId: e.target.value })}
                                            placeholder="e.g. 9876543"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Or paste full Monetag OnClick script</label>
                                        <textarea
                                            value={formData.codeHtml}
                                            onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                            rows={4}
                                            placeholder={"<script>(function(d,z,s){...})()</script>"}
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-xs resize-none"
                                        />
                                    </div>
                                    <div className="bg-emerald-500/10 rounded-lg p-3 text-xs text-emerald-300">
                                        💡 <strong>Placement:</strong> This fires globally — set &quot;Show On Pages&quot; to the pages where you want it active. Recommended: movies, series, live.
                                    </div>
                                </div>
                            )}

                            {/* Monetag — Direct Link */}
                            {formData.network === "monetag_direct" && (
                                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Link2 size={16} className="text-teal-400" />
                                        <h4 className="font-bold text-teal-400">Direct Link Ad</h4>
                                    </div>
                                    <p className="text-xs text-text-muted">A styled CTA button/banner that links directly to your Monetag direct link. Placed in high-engagement spots (below the video player). Best for users who are actively watching.</p>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Monetag Direct Link URL *</label>
                                        <input
                                            type="url"
                                            value={formData.monetagDirectUrl}
                                            onChange={(e) => setFormData({ ...formData, monetagDirectUrl: e.target.value })}
                                            placeholder="https://link.monetag.com/..."
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Button / Banner Text</label>
                                        <input
                                            type="text"
                                            value={formData.monetagDirectText}
                                            onChange={(e) => setFormData({ ...formData, monetagDirectText: e.target.value })}
                                            placeholder="e.g. Watch Now, Get VPN, Claim Offer"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div className="bg-teal-500/10 rounded-lg p-3 text-xs text-teal-300">
                                        💡 <strong>Best placement:</strong> Slot key <code className="bg-black/30 px-1 rounded">direct_link_player</code> — auto-placed below the video player on movie &amp; series watch pages (highest dwell time).
                                    </div>
                                </div>
                            )}

                            {/* Monetag — In-Page Push */}
                            {formData.network === "monetag_inpage" && (
                                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Bell size={16} className="text-cyan-400" />
                                        <h4 className="font-bold text-cyan-400">In-Page Push Banner</h4>
                                    </div>
                                    <p className="text-xs text-text-muted">Displays a push-notification style ad inside the page (not a real browser push). Works on iOS. Paste the script from your Monetag dashboard.</p>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Monetag Zone ID</label>
                                        <input
                                            type="text"
                                            value={formData.monetagId}
                                            onChange={(e) => setFormData({ ...formData, monetagId: e.target.value })}
                                            placeholder="e.g. 9876543"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Or paste full Monetag In-Page Push script</label>
                                        <textarea
                                            value={formData.codeHtml}
                                            onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                            rows={4}
                                            placeholder={"<script async src='...' data-zone='...'></script>"}
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-xs resize-none"
                                        />
                                    </div>
                                    <div className="bg-cyan-500/10 rounded-lg p-3 text-xs text-cyan-300">
                                        💡 <strong>Placement:</strong> Appears as a floating notification on the page. Set pages to movies, live, series for maximum visibility.
                                    </div>
                                </div>
                            )}

                            {/* VAST/VPAID */}
                            {formData.network === "vast" && (
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-4">
                                    <h4 className="font-bold text-purple-400">VAST/VPAID Video Ad Settings</h4>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">VAST Tag URL *</label>
                                        <input
                                            type="url"
                                            value={formData.vastUrl}
                                            onChange={(e) => setFormData({ ...formData, vastUrl: e.target.value })}
                                            placeholder="https://example.com/vast.xml"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.vpaidEnabled}
                                            onChange={(e) => setFormData({ ...formData, vpaidEnabled: e.target.checked })}
                                            className="w-5 h-5 rounded bg-stadium-dark"
                                        />
                                        <label className="text-sm">Enable VPAID support</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Skip After (seconds)</label>
                                            <input
                                                type="number"
                                                value={formData.videoSkipAfter}
                                                onChange={(e) => setFormData({ ...formData, videoSkipAfter: parseInt(e.target.value) })}
                                                min={0}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Min Duration (seconds)</label>
                                            <input
                                                type="number"
                                                value={formData.videoDuration}
                                                onChange={(e) => setFormData({ ...formData, videoDuration: parseInt(e.target.value) })}
                                                min={1}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Video Ad (Direct URL) */}
                            {formData.network === "video" && (
                                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4 space-y-4">
                                    <h4 className="font-bold text-pink-400">Direct Video Ad Settings</h4>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Video URL (MP4/M3U8) *</label>
                                        <input
                                            type="url"
                                            value={formData.videoUrl}
                                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                            placeholder="https://example.com/ad.mp4"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Skip After (seconds)</label>
                                            <input
                                                type="number"
                                                value={formData.videoSkipAfter}
                                                onChange={(e) => setFormData({ ...formData, videoSkipAfter: parseInt(e.target.value) })}
                                                min={0}
                                                placeholder="0 = no skip"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Required Watch Duration (sec)</label>
                                            <input
                                                type="number"
                                                value={formData.videoDuration}
                                                onChange={(e) => setFormData({ ...formData, videoDuration: parseInt(e.target.value) })}
                                                min={1}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-muted">Or use custom HTML player below</p>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Custom Video Player HTML</label>
                                        <textarea
                                            value={formData.codeHtml}
                                            onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                            rows={4}
                                            placeholder="<video>...</video> or <iframe>...</iframe>"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Popup/Popunder */}
                            {formData.network === "popup" && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-4">
                                    <h4 className="font-bold text-red-400">Popup/Popunder Settings</h4>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Popup URL *</label>
                                        <input
                                            type="url"
                                            value={formData.popupUrl}
                                            onChange={(e) => setFormData({ ...formData, popupUrl: e.target.value })}
                                            placeholder="https://example.com/offer"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Width (px)</label>
                                            <input
                                                type="number"
                                                value={formData.popupWidth}
                                                onChange={(e) => setFormData({ ...formData, popupWidth: parseInt(e.target.value) })}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Height (px)</label>
                                            <input
                                                type="number"
                                                value={formData.popupHeight}
                                                onChange={(e) => setFormData({ ...formData, popupHeight: parseInt(e.target.value) })}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">Or paste popup script code</label>
                                        <textarea
                                            value={formData.codeHtml}
                                            onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                            rows={4}
                                            placeholder="<script>...</script>"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Custom HTML */}
                            {formData.network === "custom" && (
                                <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4 space-y-4">
                                    <h4 className="font-bold text-gray-400">Custom HTML Ad Code</h4>
                                    <div>
                                        <label className="block text-sm text-text-secondary mb-2">HTML/Script Code *</label>
                                        <textarea
                                            value={formData.codeHtml}
                                            onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                            rows={6}
                                            placeholder="Paste your ad code here... (HTML, script tags, iframe, etc.)"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* PPV Unlock */}
                            {formData.network === "ppv" && (
                                <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-lg p-4 space-y-4">
                                    <h4 className="font-bold text-accent-gold">PPV Unlock Ad Settings</h4>
                                    <p className="text-sm text-text-muted">
                                        Xayeysiiskan wuxuu u muuqdaa user-ka marka uu daawaynayo xayeysiis si uu u furo content PPV ah.
                                        Use slot key &quot;ppv_unlock&quot; for the default PPV gate.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Video Ad URL (MP4/M3U8)</label>
                                            <input
                                                type="url"
                                                value={formData.videoUrl}
                                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                                placeholder="https://example.com/ppv-ad.mp4"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Or VAST Tag URL</label>
                                            <input
                                                type="url"
                                                value={formData.vastUrl}
                                                onChange={(e) => setFormData({ ...formData, vastUrl: e.target.value })}
                                                placeholder="https://example.com/vast.xml"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-text-secondary mb-2">Ad Duration (seconds)</label>
                                                <input
                                                    type="number"
                                                    value={formData.videoDuration}
                                                    onChange={(e) => setFormData({ ...formData, videoDuration: parseInt(e.target.value) })}
                                                    min={5}
                                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-text-secondary mb-2">Skip After (seconds)</label>
                                                <input
                                                    type="number"
                                                    value={formData.videoSkipAfter}
                                                    onChange={(e) => setFormData({ ...formData, videoSkipAfter: parseInt(e.target.value) })}
                                                    min={0}
                                                    placeholder="0 = no skip"
                                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">Or Custom Ad Player HTML</label>
                                            <textarea
                                                value={formData.codeHtml}
                                                onChange={(e) => setFormData({ ...formData, codeHtml: e.target.value })}
                                                rows={4}
                                                placeholder="<video>...</video>, <iframe>...</iframe>, or any ad player code"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-text-secondary mb-2">AdSense (fallback)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.adsenseClient}
                                                    onChange={(e) => setFormData({ ...formData, adsenseClient: e.target.value })}
                                                    placeholder="ca-pub-xxx"
                                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.adsenseSlot}
                                                    onChange={(e) => setFormData({ ...formData, adsenseSlot: e.target.value })}
                                                    placeholder="Slot ID"
                                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Show On Pages */}
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

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-border-subtle">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-stadium-hover rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!formData.slotKey}
                                    className="flex-1 px-4 py-3 bg-accent-green text-black font-bold rounded-lg disabled:opacity-50"
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
