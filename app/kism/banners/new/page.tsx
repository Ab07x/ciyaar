"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewBannerPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        type: "main" as "main" | "small" | "popup" | "interstitial",
        headline: "Ads suck but keep the site free.",
        subheadline: "Remove ads and get many features with Premium Membership",
        ctaText: "CHECK OPTIONS",
        ctaLink: "/pricing",
        leftImageUrl: "/img/dragon-left.png",
        rightImageUrl: "/img/right-cartoons.png",
        backgroundImageUrl: "",
        backgroundColor: "#333333",
        accentColor: "#9AE600",
        startDate: "",
        endDate: "",
        isActive: true,
        priority: 1,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!formData.name || !formData.headline) {
            alert("Please fill in name and headline");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
                    endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
                }),
            });
            if (!res.ok) throw new Error("Failed to create banner");
            router.push("/kism/banners");
        } catch (err) {
            console.error(err);
            alert("Failed to create banner");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/kism/banners" className="p-2 hover:bg-stadium-hover rounded-lg transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black">New Banner</h1>
                        <p className="text-text-muted">Create a promotional banner</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                >
                    <Save size={20} />
                    {saving ? "Creating..." : "Create Banner"}
                </button>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-subtle pb-3">Basic Info</h3>
                    <div><label className="block text-sm text-text-secondary mb-2">Banner Name *</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Black Friday 2024, New Year Sale" className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div><label className="block text-sm text-text-secondary mb-2">Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"><option value="main">Main Banner (below hero/videos)</option><option value="small">Small Inline Banner</option><option value="popup">Popup Modal</option><option value="interstitial">Full-screen Interstitial</option></select></div>
                    <div className="flex gap-4">
                        <div className="flex-1"><label className="block text-sm text-text-secondary mb-2">Priority</label><input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div className="flex items-end"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded" /><span className="font-semibold">Active</span></label></div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-subtle pb-3">Content</h3>
                    <div><label className="block text-sm text-text-secondary mb-2">Headline *</label><input value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} placeholder="Ads suck but keep the site free." className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div><label className="block text-sm text-text-secondary mb-2">Subheadline</label><input value={formData.subheadline} onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })} placeholder="Remove ads and get many features..." className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm text-text-secondary mb-2">CTA Text</label><input value={formData.ctaText} onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })} placeholder="CHECK OPTIONS" className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-sm text-text-secondary mb-2">CTA Link</label><input value={formData.ctaLink} onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })} placeholder="/pricing" className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-subtle pb-3">Images</h3>
                    <div><label className="block text-sm text-text-secondary mb-2">Left Image URL</label><input value={formData.leftImageUrl} onChange={(e) => setFormData({ ...formData, leftImageUrl: e.target.value })} placeholder="/img/dragon-left.png" className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div><label className="block text-sm text-text-secondary mb-2">Right Image URL</label><input value={formData.rightImageUrl} onChange={(e) => setFormData({ ...formData, rightImageUrl: e.target.value })} placeholder="/img/right-cartoons.png" className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div><label className="block text-sm text-text-secondary mb-2">Background Image URL</label><input value={formData.backgroundImageUrl} onChange={(e) => setFormData({ ...formData, backgroundImageUrl: e.target.value })} placeholder="Optional background image" className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                </div>

                {/* Styling & Scheduling */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg border-b border-border-subtle pb-3">Styling & Schedule</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm text-text-secondary mb-2">Background Color</label><div className="flex gap-2"><input type="color" value={formData.backgroundColor} onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer" /><input value={formData.backgroundColor} onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })} className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div></div>
                        <div><label className="block text-sm text-text-secondary mb-2">Accent Color</label><div className="flex gap-2"><input type="color" value={formData.accentColor} onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer" /><input value={formData.accentColor} onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })} className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm text-text-secondary mb-2">Start Date</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                        <div><label className="block text-sm text-text-secondary mb-2">End Date</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    </div>
                    <p className="text-xs text-text-muted">Leave dates empty for always-active banner</p>
                </div>
            </div>
        </div>
    );
}
