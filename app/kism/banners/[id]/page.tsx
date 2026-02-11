"use client";

import useSWR from "swr";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // Fetch all banners and find by _id
    const { data: banners } = useSWR("/api/banners", fetcher);
    const banner = banners?.find((b: any) => b._id === id) || null;

    const [formData, setFormData] = useState({
        name: "",
        type: "main" as "main" | "small" | "popup" | "interstitial",
        headline: "",
        subheadline: "",
        ctaText: "",
        ctaLink: "/pricing",
        leftImageUrl: "",
        rightImageUrl: "",
        backgroundImageUrl: "",
        backgroundColor: "#333333",
        accentColor: "#9AE600",
        startDate: "",
        endDate: "",
        isActive: true,
        priority: 1,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (banner) {
            setFormData({
                name: banner.name,
                type: banner.type,
                headline: banner.headline,
                subheadline: banner.subheadline || "",
                ctaText: banner.ctaText,
                ctaLink: banner.ctaLink,
                leftImageUrl: banner.leftImageUrl || "",
                rightImageUrl: banner.rightImageUrl || "",
                backgroundImageUrl: banner.backgroundImageUrl || "",
                backgroundColor: banner.backgroundColor || "#333333",
                accentColor: banner.accentColor || "#9AE600",
                startDate: banner.startDate ? new Date(banner.startDate).toISOString().split("T")[0] : "",
                endDate: banner.endDate ? new Date(banner.endDate).toISOString().split("T")[0] : "",
                isActive: banner.isActive,
                priority: banner.priority,
            });
        }
    }, [banner]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/banners", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    ...formData,
                    startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
                    endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
                }),
            });
            if (!res.ok) throw new Error("Failed to update");
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
            alert("Failed to save banner");
        } finally {
            setSaving(false);
        }
    };

    if (!banner) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/kism/banners" className="p-2 hover:bg-stadium-hover rounded-lg transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black">Edit Banner</h1>
                        <p className="text-text-muted">{banner.name}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${saved ? "bg-accent-green/20 text-accent-green" : "bg-accent-green text-black"}`}
                >
                    <Save size={20} />
                    {saving ? "Saving..." : saved ? "Saved!" : "Save"}
                </button>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-subtle pb-3">Basic Info</h3>
                    <div><label className="block text-sm text-text-secondary mb-2">Banner Name</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Black Friday 2024" className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div><label className="block text-sm text-text-secondary mb-2">Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"><option value="main">Main Banner</option><option value="small">Small Inline</option><option value="popup">Popup Modal</option><option value="interstitial">Full-screen Interstitial</option></select></div>
                    <div className="flex gap-4">
                        <div className="flex-1"><label className="block text-sm text-text-secondary mb-2">Priority</label><input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div className="flex items-end"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded" /><span className="font-semibold">Active</span></label></div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-subtle pb-3">Content</h3>
                    <div><label className="block text-sm text-text-secondary mb-2">Headline</label><input value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div><label className="block text-sm text-text-secondary mb-2">Subheadline</label><input value={formData.subheadline} onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm text-text-secondary mb-2">CTA Text</label><input value={formData.ctaText} onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-sm text-text-secondary mb-2">CTA Link</label><input value={formData.ctaLink} onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-subtle pb-3">Images</h3>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Left Image URL</label>
                        <input value={formData.leftImageUrl} onChange={(e) => setFormData({ ...formData, leftImageUrl: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" />
                        {formData.leftImageUrl && (<div className="mt-2 w-16 h-16 rounded-full overflow-hidden border border-border-subtle"><img src={formData.leftImageUrl} alt="Left preview" className="w-full h-full object-cover" /></div>)}
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Right Image URL</label>
                        <input value={formData.rightImageUrl} onChange={(e) => setFormData({ ...formData, rightImageUrl: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" />
                        {formData.rightImageUrl && (<div className="mt-2 w-16 h-16 rounded-full overflow-hidden border border-border-subtle"><img src={formData.rightImageUrl} alt="Right preview" className="w-full h-full object-cover" /></div>)}
                    </div>
                    <div><label className="block text-sm text-text-secondary mb-2">Background Image URL (optional)</label><input value={formData.backgroundImageUrl} onChange={(e) => setFormData({ ...formData, backgroundImageUrl: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                </div>

                {/* Styling & Scheduling */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-subtle pb-3">Styling & Schedule</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm text-text-secondary mb-2">Background Color</label><div className="flex gap-2"><input type="color" value={formData.backgroundColor} onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer" /><input value={formData.backgroundColor} onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })} className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div></div>
                        <div><label className="block text-sm text-text-secondary mb-2">Accent Color</label><div className="flex gap-2"><input type="color" value={formData.accentColor} onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer" /><input value={formData.accentColor} onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })} className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm text-text-secondary mb-2">Start Date (optional)</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-sm text-text-secondary mb-2">End Date (optional)</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                <h3 className="font-bold text-lg border-b border-border-subtle pb-3 mb-4 flex items-center gap-2">
                    <Eye size={20} />
                    Preview
                    <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded font-bold uppercase">
                        {formData.type}
                    </span>
                </h3>

                {/* INTERSTITIAL Preview */}
                {formData.type === "interstitial" && (
                    <div className="rounded-xl overflow-hidden relative" style={{ backgroundColor: formData.backgroundColor || "#000" }}>
                        {formData.backgroundImageUrl && (<div className="absolute inset-0"><img src={formData.backgroundImageUrl} alt="Background" className="w-full h-full object-cover opacity-30" /></div>)}
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                        <div className="relative z-10 p-6 flex items-center gap-6">
                            {formData.leftImageUrl && (<div className="w-24 h-24 flex-shrink-0"><img src={formData.leftImageUrl} alt="Celebrity" className="w-full h-full object-contain" /></div>)}
                            <div className="flex-1">
                                <p className="text-3xl font-bold" style={{ color: formData.accentColor }}>{formData.headline || "Premium"}</p>
                                <p className="text-2xl font-bold text-white">{formData.subheadline || "Membership ?"}</p>
                                <p className="text-white/50 text-sm mt-2">Get extra features by supporting us with server and development costs.</p>
                                <button className="mt-4 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg uppercase">{formData.ctaText || "CHECK OUR PLANS"}</button>
                            </div>
                            <div className="flex-shrink-0 space-y-2">
                                <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 min-w-[180px]"><span className="text-white text-sm">Watch</span><span className="font-bold text-sm" style={{ color: formData.accentColor }}>Full HD</span></div>
                                <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2"><span className="text-white text-sm">Download</span><span className="font-bold text-sm" style={{ color: formData.accentColor }}>Directly</span></div>
                                <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2"><span className="text-white text-sm">Watch</span><span className="font-bold text-sm" style={{ color: formData.accentColor }}>Without Ads</span></div>
                                <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2"><span className="text-white text-sm">Request</span><span className="font-bold text-sm" style={{ color: formData.accentColor }}>Content</span></div>
                            </div>
                        </div>
                        <div className="h-1 bg-white/20"><div className="h-full w-1/3" style={{ backgroundColor: formData.accentColor }} /></div>
                    </div>
                )}

                {/* POPUP Preview */}
                {formData.type === "popup" && (
                    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-visible shadow-2xl flex flex-col md:flex-row bg-transparent">
                        <div className="absolute inset-0 rounded-2xl z-0" style={{ backgroundColor: formData.backgroundColor }} />
                        <div className="absolute top-4 right-4 z-20 p-1.5 bg-white/10 rounded-full text-white/70"><span className="block w-4 h-4 text-center leading-none text-xs">✕</span></div>
                        <div className="relative z-10 w-full md:w-5/12 h-64 md:h-auto flex-shrink-0">
                            <div className="absolute bottom-0 left-0 md:-left-4 w-full h-full md:h-[115%] flex items-end justify-center md:justify-start">
                                {formData.leftImageUrl && (<div className="relative w-48 h-56 md:w-64 md:h-[300px]"><img src={formData.leftImageUrl} alt="Preview" className="w-full h-full object-contain object-bottom drop-shadow-2xl" /></div>)}
                            </div>
                        </div>
                        <div className="relative z-10 flex-1 p-6 flex flex-col justify-center text-center">
                            <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{formData.headline || "Headline"}</h2>
                            <p className="text-white/80 text-sm mb-8 leading-relaxed">{formData.subheadline || "Subheadline"}</p>
                            <div className="flex justify-center"><button className="px-8 py-3 rounded-lg font-bold text-white shadow-lg text-sm uppercase tracking-wide" style={{ backgroundColor: formData.accentColor, boxShadow: `0 4px 14px 0 ${formData.accentColor}66` }}>{formData.ctaText || "CTA"}</button></div>
                        </div>
                    </div>
                )}

                {/* MAIN / SMALL Preview (Default) */}
                {formData.type !== "interstitial" && formData.type !== "popup" && (
                    <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: formData.backgroundColor }}>
                        {formData.leftImageUrl && (<div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/50 flex-shrink-0"><img src={formData.leftImageUrl} alt="Left" className="w-full h-full object-cover" /></div>)}
                        <div className="flex-1 text-center px-4">
                            <p className="text-white font-semibold">{formData.headline || "Headline"}</p>
                            <p className="text-gray-300 text-sm">{formData.subheadline || "Subheadline"}</p>
                            <button className="mt-2 px-4 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: "#2a4a6a", color: "white" }}><span style={{ color: formData.accentColor }}>✦</span> {formData.ctaText || "CTA"}</button>
                        </div>
                        {formData.rightImageUrl && (<div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/50 flex-shrink-0"><img src={formData.rightImageUrl} alt="Right" className="w-full h-full object-cover" /></div>)}
                    </div>
                )}
            </div>
        </div>
    );
}
