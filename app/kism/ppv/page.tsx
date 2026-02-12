"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    Plus,
    Trash2,
    Edit,
    Tv,
    Film,
    Clock,
    Eye,
    ToggleLeft,
    ToggleRight,
    Search,
    TrendingUp,
    Settings,
} from "lucide-react";
import { AdSettingsModal } from "./AdSettingsModal";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminPPVPage() {
    const { data: ppvContent, mutate } = useSWR("/api/ppv", fetcher);
    const { data: ppvStats } = useSWR("/api/ppv?stats=true", fetcher);
    const { data: movies } = useSWR("/api/movies?limit=1000&isPublished=true", fetcher);
    const { data: matches } = useSWR("/api/matches", fetcher);

    const [showForm, setShowForm] = useState(false);
    const [showAdModal, setShowAdModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "match" | "movie">("all");
    const [search, setSearch] = useState("");

    // Form state (ad-only mode - no price)
    const [formData, setFormData] = useState({
        contentType: "movie" as "match" | "movie",
        contentId: "",
        title: "",
        minAdsRequired: 3,
        accessDuration: 2, // Default 2 hours for matches/movies
        isActive: true,
        // Ad Fields
        adType: undefined as "video" | "vast" | "adsense" | "custom" | "image" | undefined,
        adVideoUrl: "",
        adVastUrl: "",
        adImageUrl: "",
        adClickUrl: "",
        adHtml: "",
        adAdsenseClient: "",
        adAdsenseSlot: "",
        adDuration: 15,
        adSkipAfter: 5,
    });

    const resetForm = () => {
        setFormData({
            contentType: "movie",
            contentId: "",
            title: "",
            minAdsRequired: 3,
            accessDuration: 2,
            isActive: true,
            adType: undefined,
            adVideoUrl: "",
            adVastUrl: "",
            adImageUrl: "",
            adClickUrl: "",
            adHtml: "",
            adAdsenseClient: "",
            adAdsenseSlot: "",
            adDuration: 15,
            adSkipAfter: 5,
        });
        setEditingId(null);
        setShowForm(false);
    };

    // Format duration for display
    const formatDuration = (hours: number) => {
        if (hours < 1) {
            return `${Math.round(hours * 60)}min`;
        } else if (hours < 24) {
            return `${hours}h`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days}d`;
        }
    };

    const handleEdit = (item: any) => {
        setFormData({
            contentType: item.contentType,
            contentId: item.contentId,
            title: item.title,
            minAdsRequired: item.minAdsRequired,
            accessDuration: item.accessDuration,
            isActive: item.isActive,
            adType: item.adType,
            adVideoUrl: item.adVideoUrl || "",
            adVastUrl: item.adVastUrl || "",
            adImageUrl: item.adImageUrl || "",
            adClickUrl: item.adClickUrl || "",
            adHtml: item.adHtml || "",
            adAdsenseClient: item.adAdsenseClient || "",
            adAdsenseSlot: item.adAdsenseSlot || "",
            adDuration: item.adDuration || 15,
            adSkipAfter: item.adSkipAfter || 5,
        });
        setEditingId(item._id);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        const payload = {
            id: editingId || undefined,
            contentType: formData.contentType,
            contentId: formData.contentId,
            title: formData.title,
            price: 0, // Ad-only mode
            adSupportedEnabled: true, // Always enabled
            minAdsRequired: formData.minAdsRequired,
            accessDuration: formData.accessDuration,
            isActive: formData.isActive,
            // Ad Config
            adType: formData.adType,
            adVideoUrl: formData.adVideoUrl,
            adVastUrl: formData.adVastUrl,
            adImageUrl: formData.adImageUrl,
            adClickUrl: formData.adClickUrl,
            adHtml: formData.adHtml,
            adAdsenseClient: formData.adAdsenseClient,
            adAdsenseSlot: formData.adAdsenseSlot,
            adDuration: formData.adDuration,
            adSkipAfter: formData.adSkipAfter,
        };

        await fetch("/api/ppv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        resetForm();
        mutate();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this PPV config?")) {
            await fetch(`/api/ppv?id=${id}`, { method: "DELETE" });
            mutate();
        }
    };

    const filtered = ppvContent?.filter((p: any) => {
        if (filter !== "all" && p.contentType !== filter) return false;
        if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    // Get content options based on type
    const movieList = movies?.movies || movies || [];
    const matchList = Array.isArray(matches) ? matches : matches?.matches || [];
    const contentOptions = formData.contentType === "movie"
        ? movieList.map((m: any) => ({ id: m.slug, title: m.title }))
        : matchList.map((m: any) => ({ id: m._id, title: `${m.teamA} vs ${m.teamB}` }));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">AD-UNLOCK CONTENT</h1>
                    <p className="text-text-muted">Maamul content - Xayeysiis daawo si aad u furto</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add PPV Content
                </button>
            </div>

            {/* Stats */}
            {ppvStats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <Eye size={16} />
                            <span className="text-sm">Unlocks Guud</span>
                        </div>
                        <div className="text-2xl font-black">{ppvStats.totalPurchases}</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <TrendingUp size={16} />
                            <span className="text-sm">Hadda Active</span>
                        </div>
                        <div className="text-2xl font-black text-accent-green">{ppvStats.activePurchases}</div>
                    </div>
                    <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <Tv size={16} />
                            <span className="text-sm">Xayeysiis La Daawadey</span>
                        </div>
                        <div className="text-2xl font-black text-accent-gold">{ppvStats.adSupportedPurchases}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {(["all", "movie", "match"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-sm capitalize ${filter === f
                                ? "bg-accent-green text-black font-bold"
                                : "bg-stadium-hover text-text-secondary"
                                }`}
                        >
                            {f === "all" ? "All" : f === "movie" ? "Movies" : "Matches"}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search PPV content..."
                        className="w-full bg-stadium-elevated border border-border-subtle rounded-lg pl-10 pr-4 py-2"
                    />
                </div>
            </div>

            {/* PPV List */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-hover">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Content</th>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Type</th>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Ads Required</th>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Access Duration</th>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Status</th>
                            <th className="text-right px-4 py-3 text-sm font-bold text-text-muted">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered?.map((item: any) => (
                            <tr key={item._id} className="border-t border-border-subtle hover:bg-stadium-hover/50">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{item.title}</div>
                                    <div className="text-xs text-text-muted">{item.contentId}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.contentType === "movie"
                                        ? "bg-purple-500/20 text-purple-400"
                                        : "bg-blue-500/20 text-blue-400"
                                        }`}>
                                        {item.contentType === "movie" ? <Film size={12} className="inline mr-1" /> : <Tv size={12} className="inline mr-1" />}
                                        {item.contentType}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-accent-green font-bold">{item.minAdsRequired} xayeysiis</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="flex items-center gap-1 text-text-secondary">
                                        <Clock size={14} />
                                        {formatDuration(item.accessDuration)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {item.isActive ? (
                                        <span className="text-accent-green flex items-center gap-1">
                                            <ToggleRight size={16} />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="text-text-muted flex items-center gap-1">
                                            <ToggleLeft size={16} />
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 hover:bg-stadium-hover rounded-lg text-text-muted hover:text-white"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!filtered || filtered.length === 0) && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                                    No PPV content configured
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-stadium-dark border border-border-strong rounded-2xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-6">
                            {editingId ? "Edit PPV Content" : "Add PPV Content"}
                        </h2>

                        <div className="space-y-4">
                            {/* Content Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Content Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFormData({ ...formData, contentType: "movie", contentId: "" })}
                                        className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${formData.contentType === "movie"
                                            ? "bg-purple-500 text-white"
                                            : "bg-stadium-hover text-text-muted"
                                            }`}
                                    >
                                        <Film size={18} />
                                        Movie
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, contentType: "match", contentId: "" })}
                                        className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${formData.contentType === "match"
                                            ? "bg-blue-500 text-white"
                                            : "bg-stadium-hover text-text-muted"
                                            }`}
                                    >
                                        <Tv size={18} />
                                        Match
                                    </button>
                                </div>
                            </div>

                            {/* Content Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Content</label>
                                <select
                                    value={formData.contentId}
                                    onChange={(e) => {
                                        const selected = contentOptions.find((o: any) => o.id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            contentId: e.target.value,
                                            title: selected?.title || "",
                                        });
                                    }}
                                    className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-4 py-2"
                                >
                                    <option value="">Select...</option>
                                    {contentOptions.map((opt: any) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ads Required */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Xayeysiisyo Loo Baahan Yahay</label>
                                <p className="text-xs text-text-muted mb-2">Imisa xayeysiis oo user-ka daawado ka hor inta uusan furin</p>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.minAdsRequired}
                                    onChange={(e) => setFormData({ ...formData, minAdsRequired: parseInt(e.target.value) })}
                                    className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-4 py-2"
                                />
                            </div>

                            {/* Access Duration */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Access Duration</label>
                                <select
                                    value={formData.accessDuration}
                                    onChange={(e) => setFormData({ ...formData, accessDuration: parseFloat(e.target.value) })}
                                    className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-4 py-2"
                                >
                                    <option value={0.33}>20 minutes</option>
                                    <option value={1}>1 hour</option>
                                    <option value={2}>2 hours</option>
                                    <option value={3}>3 hours</option>
                                    <option value={6}>6 hours</option>
                                    <option value={12}>12 hours</option>
                                    <option value={24}>24 hours (1 day)</option>
                                    <option value={48}>48 hours (2 days)</option>
                                    <option value={72}>72 hours (3 days)</option>
                                    <option value={168}>168 hours (1 week)</option>
                                </select>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Active</label>
                                <button
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`p-2 rounded-lg ${formData.isActive ? "text-accent-green" : "text-text-muted"}`}
                                >
                                    {formData.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                            </div>

                            {/* Embedded Ad Configuration */}
                            <div className="border-t border-border-subtle pt-4 mt-4">
                                <h3 className="text-sm font-bold text-accent-gold mb-3 flex items-center justify-between">
                                    <span>Custom Ad Configuration</span>
                                    {formData.adType ? (
                                        <span className="text-[10px] bg-accent-gold text-black px-2 py-0.5 rounded uppercase font-black">
                                            {formData.adType} Configured
                                        </span>
                                    ) : (
                                        <span className="text-[10px] bg-stadium-hover text-text-muted px-2 py-0.5 rounded uppercase font-bold">
                                            Using Global
                                        </span>
                                    )}
                                </h3>

                                <div className="bg-stadium-elevated border border-border-subtle rounded-xl p-4 mb-3">
                                    {formData.adType ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-text-muted">Type:</span>
                                                <span className="font-bold uppercase text-white">{formData.adType}</span>
                                            </div>
                                            {formData.adVideoUrl && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-text-muted">Video:</span>
                                                    <span className="text-accent-green truncate max-w-[150px]">{formData.adVideoUrl}</span>
                                                </div>
                                            )}
                                            {formData.adHtml && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-text-muted">Content:</span>
                                                    <span className="text-accent-green">Custom HTML Set</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-text-muted">Duration:</span>
                                                <span className="text-white">{formData.adDuration || 15}s</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-muted text-center py-2">
                                            No specific ad configured. The system will use global ad settings if available.
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowAdModal(true)}
                                    className="w-full py-3 border border-dashed border-accent-gold/40 hover:border-accent-gold text-accent-gold rounded-xl font-bold text-sm bg-accent-gold/5 hover:bg-accent-gold/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Settings size={16} />
                                    Configure Embedded Ad
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={resetForm}
                                className="flex-1 px-4 py-2 bg-stadium-hover text-white rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.contentId}
                                className="flex-1 px-4 py-2 bg-accent-green text-black font-bold rounded-lg disabled:opacity-50"
                            >
                                {editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ad Settings Modal */}
            {showAdModal && (
                <AdSettingsModal
                    ppvId={editingId}
                    initialData={formData}
                    onClose={() => setShowAdModal(false)}
                    onSave={async (adData) => {
                        setFormData({
                            ...formData,
                            ...adData
                        });
                        // Don't close parent form, just the modal
                    }}
                />
            )}
        </div>
    );
}
