"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, Save, Upload, Globe, Search, Shield, Lock } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";

// ... imports

// Define interface based on schema
interface Settings {
    siteName?: string;
    seoTagline?: string;
    seoDescription?: string;
    seoKeywords?: string;
    googleVerification?: string;
    googleAnalyticsId?: string;
    logoUrl?: string;
    faviconUrl?: string;
    adminPassword?: string;
    sitemapEnabled?: boolean;
    footballApiKey?: string;
    _id: string;
    _creationTime: number;
}

export default function AdminSEOPage() {
    const settings = useQuery(api.settings.getSettings);
    const updateSettings = useMutation(api.settings.updateSettings);
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // Form states (synced with settings once loaded)
    const [formData, setFormData] = useState<Partial<Settings>>({});
    const [initialized, setInitialized] = useState(false);

    // Sync settings to state
    if (settings && !initialized) {
        // Safe cast as settings comes from DB
        const s = settings as any;
        setFormData({
            siteName: s.siteName,
            seoTagline: s.seoTagline || "",
            seoDescription: s.seoDescription || "",
            seoKeywords: s.seoKeywords || "",
            googleVerification: s.googleVerification || "",
            googleAnalyticsId: s.googleAnalyticsId || "",
            logoUrl: s.logoUrl || "",
            faviconUrl: s.faviconUrl || "",
            adminPassword: s.adminPassword || "",
            sitemapEnabled: s.sitemapEnabled ?? true,
            footballApiKey: s.footballApiKey || "",
        });
        setInitialized(true);
    }
    // ... rest of component

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateSettings(formData);
            toast("Settings updated successfully", "success");
        } catch (error) {
            console.error(error);
            toast("Failed to update settings", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!settings) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black mb-2">SEO & Branding</h1>
                <p className="text-text-secondary">Manage site visibility, branding, and admin security.</p>
            </div>

            {/* BRANDING SECTION */}
            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-strong">
                    <Globe className="text-accent-gold" />
                    <h2 className="text-xl font-bold">Branding</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Site Name</label>
                        <input
                            type="text"
                            value={formData.siteName || ""}
                            onChange={(e) => handleChange("siteName", e.target.value)}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-xl px-4 py-3"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Logo URL</label>
                        <input
                            type="text"
                            value={formData.logoUrl || ""}
                            onChange={(e) => handleChange("logoUrl", e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-xl px-4 py-3"
                        />
                        {formData.logoUrl && <img src={formData.logoUrl} alt="Preview" className="h-8 mt-2 bg-black/50 p-1 rounded" />}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Favicon URL</label>
                        <input
                            type="text"
                            value={formData.faviconUrl || ""}
                            onChange={(e) => handleChange("faviconUrl", e.target.value)}
                            placeholder="https://example.com/favicon.ico"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-xl px-4 py-3"
                        />
                        {formData.faviconUrl && <img src={formData.faviconUrl} alt="Preview" className="h-8 w-8 mt-2 bg-black/50 p-1 rounded" />}
                    </div>
                </div>
            </div>

            {/* SEO SECTION */}
            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-strong">
                    <Search className="text-accent-green" />
                    <h2 className="text-xl font-bold">Search Optimization (SEO)</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Default Title Tagline</label>
                        <p className="text-xs text-text-muted">Appears after site name (e.g. Fanbroj | Your Tagline)</p>
                        <input
                            type="text"
                            value={formData.seoTagline || ""}
                            onChange={(e) => handleChange("seoTagline", e.target.value)}
                            placeholder="Daawo Ciyaar Live & Filimaan"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-xl px-4 py-3"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Meta Description</label>
                        <textarea
                            value={formData.seoDescription || ""}
                            onChange={(e) => handleChange("seoDescription", e.target.value)}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-xl px-4 py-3 min-h-[100px]"
                            placeholder="Brief description of your site for Google results..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Keywords (comma separated)</label>
                        <input
                            type="text"
                            value={formData.seoKeywords || ""}
                            onChange={(e) => handleChange("seoKeywords", e.target.value)}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-xl px-4 py-3"
                            placeholder="ciyaar, live, somali, football..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-secondary">Google Verification ID (GCS)</label>
                            <input
                                type="text"
                                value={formData.googleVerification || ""}
                                onChange={(e) => handleChange("googleVerification", e.target.value)}
                                placeholder="Verification string from GCS"
                                className="w-full bg-stadium-dark border border-border-subtle rounded-xl px-4 py-3 font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-secondary">Sitemap URL</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/sitemap.xml`}
                                    readOnly
                                    className="w-full bg-stadium-dark/50 border border-border-subtle rounded-xl px-4 py-3 text-text-muted select-all"
                                />
                                <a
                                    href="/sitemap.xml"
                                    target="_blank"
                                    className="p-3 bg-stadium-hover rounded-xl hover:text-accent-green"
                                >
                                    <Globe size={20} />
                                </a>
                            </div>
                            <p className="text-xs text-text-muted mt-1">Submit this URL to Google Search Console</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* INTEGRATIONS SECTION */}
            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-strong">
                    <Check className="text-accent-blue" />
                    <h2 className="text-xl font-bold">Integrations & API Keys</h2>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">FOOTBALL_API_KEY</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-text-muted" size={18} />
                            <input
                                type="text"
                                value={formData.footballApiKey || ""}
                                onChange={(e) => handleChange("footballApiKey", e.target.value)}
                                placeholder="Enter API-Football key..."
                                className="w-full bg-stadium-dark border border-border-subtle rounded-xl pl-12 pr-4 py-3 font-mono text-sm"
                            />
                        </div>
                        <p className="text-xs text-text-muted">
                            Used for syncing fixtures and livescores from API-Football.
                        </p>
                    </div>
                </div>
            </div>

            {/* ADMIN SECURITY SECTION */}
            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-strong">
                    <Shield className="text-accent-red" />
                    <h2 className="text-xl font-bold">Admin Security</h2>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Update Admin Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-text-muted" size={18} />
                            <input
                                type="text"
                                value={formData.adminPassword || ""}
                                onChange={(e) => handleChange("adminPassword", e.target.value)}
                                placeholder="Set new admin password..."
                                className="w-full bg-stadium-dark border border-border-subtle rounded-xl pl-12 pr-4 py-3"
                            />
                        </div>
                        <p className="text-xs text-text-muted">
                            Setting this will override the default ADMIN_TOKEN environment variable.
                            <span className="text-accent-green ml-1">Leave empty to use env default.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* SAVE ACTION */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-accent-green text-black px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                    {loading ? (
                        <span>Saving...</span>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
