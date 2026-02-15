"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { Save, Settings, MessageSquare, Search, ShieldAlert } from "lucide-react";

type SettingsResponse = {
    siteName?: string;
    whatsappNumber?: string;
    priceMatch?: number;
    priceWeekly?: number;
    priceMonthly?: number;
    priceYearly?: number;
    priceStarter?: number;
    pricePlus?: number;
    pricePro?: number;
    priceElite?: number;
    maxDevicesMatch?: number;
    maxDevicesWeekly?: number;
    maxDevicesMonthly?: number;
    maxDevicesYearly?: number;
    freeMoviesPerDay?: number;
    freeMoviePreviewMinutes?: number;
    freeMovieTimerSpeedMultiplier?: number;
    seoTagline?: string;
    seoDescription?: string;
    seoKeywords?: string;
    ogImage?: string;
    twitterHandle?: string;
    googleAnalyticsId?: string;
    googleVerification?: string;
};

const fetcher = (url: string): Promise<SettingsResponse> => fetch(url).then(r => r.json());

export default function AdminSettingsPage() {
    const { data: settings, mutate } = useSWR("/api/settings", fetcher);

    const [formData, setFormData] = useState({
        siteName: "Fanbroj",
        whatsappNumber: "+252",
        priceMatch: 0.2,
        priceWeekly: 1,
        priceMonthly: 3.5,
        priceYearly: 11,
        // New Plan Pricing
        priceStarter: 24.99,
        pricePlus: 34.00,
        pricePro: 38.00,
        priceElite: 47.00,
        maxDevicesMatch: 1,
        maxDevicesWeekly: 2,
        maxDevicesMonthly: 3,
        maxDevicesYearly: 5,
        freeMoviesPerDay: 2,
        freeMoviePreviewMinutes: 26,
        moviePreviewLockEnabled: true,
        freeMovieTimerSpeedMultiplier: 12,
        // SEO Settings
        seoTagline: "",
        seoDescription: "",
        seoKeywords: "",
        ogImage: "",
        twitterHandle: "",
        googleAnalyticsId: "",
        googleVerification: "",
    });
    const [saved, setSaved] = useState(false);
    const [clearingLogins, setClearingLogins] = useState(false);
    const [clearLoginsResult, setClearLoginsResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (settings) setFormData({
            siteName: settings.siteName || "Fanbroj",
            whatsappNumber: settings.whatsappNumber || "+252",
            priceMatch: settings.priceMatch ?? 0.2,
            priceWeekly: settings.priceWeekly ?? 1,
            priceMonthly: settings.priceMonthly ?? 3.5,
            priceYearly: settings.priceYearly ?? 11,
            // New Plan Pricing
            priceStarter: settings.priceStarter ?? 24.99,
            pricePlus: settings.pricePlus ?? 34.00,
            pricePro: settings.pricePro ?? 38.00,
            priceElite: settings.priceElite ?? 47.00,
            maxDevicesMatch: settings.maxDevicesMatch ?? 1,
            maxDevicesWeekly: settings.maxDevicesWeekly ?? 2,
            maxDevicesMonthly: settings.maxDevicesMonthly ?? 3,
            maxDevicesYearly: settings.maxDevicesYearly ?? 5,
            freeMoviesPerDay: Math.max(2, settings.freeMoviesPerDay ?? 2),
            freeMoviePreviewMinutes: settings.freeMoviePreviewMinutes ?? 26,
            moviePreviewLockEnabled: true,
            freeMovieTimerSpeedMultiplier: settings.freeMovieTimerSpeedMultiplier ?? 12,
            // SEO Settings
            seoTagline: settings.seoTagline || "",
            seoDescription: settings.seoDescription || "",
            seoKeywords: settings.seoKeywords || "",
            ogImage: settings.ogImage || "",
            twitterHandle: settings.twitterHandle || "",
            googleAnalyticsId: settings.googleAnalyticsId || "",
            googleVerification: settings.googleVerification || "",
        });
    }, [settings]);

    const handleSave = async () => {
        try {
            await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            mutate();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
            alert("Failed to save settings");
        }
    };

    const seedAll = async () => {
        try {
            await fetch("/api/settings/seed", { method: "POST" });
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Seed failed");
        }
    };

    const clearAllUserLogins = async () => {
        const confirmed = window.confirm("Tani waxay ka saari doontaa login-ka dhammaan users-ka. Ma hubtaa?");
        if (!confirmed) return;

        setClearingLogins(true);
        setClearLoginsResult(null);
        try {
            const res = await fetch("/api/admin/devices?all=1", { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "Failed to clear user logins");
            }
            setClearLoginsResult({
                type: "success",
                text: `Waxaa la nadiifiyay ${data?.deletedCount ?? 0} login(s). Users-ku waxay dib u galayaan code markay soo noqdaan.`,
            });
        } catch (err) {
            console.error(err);
            setClearLoginsResult({
                type: "error",
                text: "Nadiifinta login-ka way fashilantay. Isku day mar kale.",
            });
        } finally {
            setClearingLogins(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-black">SETTINGS</h1><p className="text-text-muted">Global configuration</p></div>
                <button onClick={handleSave} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${saved ? "bg-accent-green/20 text-accent-green" : "bg-accent-green text-black"}`}><Save size={20} />{saved ? "Saved!" : "Save"}</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-border-subtle"><Settings size={24} className="text-text-muted" /><h3 className="font-bold">General</h3></div>
                    <div><label className="block text-sm text-text-secondary mb-2">Site Name</label><input value={formData.siteName} onChange={e => setFormData({ ...formData, siteName: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div><label className="block text-sm text-text-secondary mb-2">WhatsApp Number</label><input value={formData.whatsappNumber} onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })} placeholder="+252..." className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    <div className="pt-2 border-t border-border-subtle space-y-3">
                        <div className="flex items-center justify-between bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold">Preview Timer Lock (Forced)</p>
                                <p className="text-xs text-text-muted">Always ON for free users on premium movies.</p>
                            </div>
                            <button
                                type="button"
                                disabled
                                className="w-12 h-6 rounded-full relative bg-accent-green/80 cursor-not-allowed"
                                aria-label="Preview timer lock is forced on"
                            >
                                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Preview Minutes</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={formData.freeMoviePreviewMinutes}
                                    onChange={e => setFormData({ ...formData, freeMoviePreviewMinutes: parseInt(e.target.value) || 26 })}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Timer Speed (x)</label>
                                <input
                                    type="number"
                                    min={12}
                                    step="0.1"
                                    value={formData.freeMovieTimerSpeedMultiplier}
                                    onChange={e => setFormData({ ...formData, freeMovieTimerSpeedMultiplier: Math.max(12, parseFloat(e.target.value) || 12) })}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Free Movies / Day</label>
                                <input
                                    type="number"
                                    min={2}
                                    value={formData.freeMoviesPerDay}
                                    onChange={e => setFormData({ ...formData, freeMoviesPerDay: parseInt(e.target.value) || 2 })}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-border-subtle"><MessageSquare size={24} className="text-text-muted" /><h3 className="font-bold">Qiimaha (USD) - Legacy</h3></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs text-text-secondary mb-1">Daily Match</label><input type="number" step="0.01" value={formData.priceMatch} onChange={e => setFormData({ ...formData, priceMatch: parseFloat(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Weekly</label><input type="number" step="0.01" value={formData.priceWeekly} onChange={e => setFormData({ ...formData, priceWeekly: parseFloat(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Monthly</label><input type="number" step="0.01" value={formData.priceMonthly} onChange={e => setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Yearly</label><input type="number" step="0.01" value={formData.priceYearly} onChange={e => setFormData({ ...formData, priceYearly: parseFloat(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div>
                    </div>
                </div>

                <div className="bg-stadium-elevated border border-accent-gold/30 rounded-xl p-6 space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
                        <div className="w-8 h-8 bg-accent-gold/20 rounded-lg flex items-center justify-center">
                            <span className="text-accent-gold font-bold">$</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-accent-gold">Plan Pricing (USD)</h3>
                            <p className="text-xs text-text-muted">Prices shown on the pricing page</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Starter (6-Month)</label>
                            <input type="number" step="0.01" value={formData.priceStarter} onChange={e => setFormData({ ...formData, priceStarter: parseFloat(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Plus (1-Year)</label>
                            <input type="number" step="0.01" value={formData.pricePlus} onChange={e => setFormData({ ...formData, pricePlus: parseFloat(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Pro (2-Year)</label>
                            <input type="number" step="0.01" value={formData.pricePro} onChange={e => setFormData({ ...formData, pricePro: parseFloat(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Elite (3-Year)</label>
                            <input type="number" step="0.01" value={formData.priceElite} onChange={e => setFormData({ ...formData, priceElite: parseFloat(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" />
                        </div>
                    </div>
                </div>

                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-border-subtle"><h3 className="font-bold uppercase text-xs text-text-muted">Device Limits</h3></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs text-text-secondary mb-1">Daily Match</label><input type="number" value={formData.maxDevicesMatch} onChange={e => setFormData({ ...formData, maxDevicesMatch: parseInt(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Weekly</label><input type="number" value={formData.maxDevicesWeekly} onChange={e => setFormData({ ...formData, maxDevicesWeekly: parseInt(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Monthly</label><input type="number" value={formData.maxDevicesMonthly} onChange={e => setFormData({ ...formData, maxDevicesMonthly: parseInt(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div>
                        <div><label className="block text-xs text-text-secondary mb-1">Yearly</label><input type="number" value={formData.maxDevicesYearly} onChange={e => setFormData({ ...formData, maxDevicesYearly: parseInt(e.target.value) })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2" /></div>
                    </div>
                </div>

                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="font-bold mb-4">Seed Default Data</h3>
                    <p className="text-text-muted text-sm mb-4">Ku dar data-ga hore (leagues, ads, settings)</p>
                    <button onClick={seedAll} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl w-full">Seed All Defaults</button>
                </div>

                <div className="bg-stadium-elevated border border-accent-red/30 rounded-xl p-6 md:col-span-2">
                    <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
                        <ShieldAlert size={22} className="text-accent-red" />
                        <div>
                            <h3 className="font-bold text-accent-red">Admin Logout Control</h3>
                            <p className="text-xs text-text-muted">Force logout all user logins from the entire site</p>
                        </div>
                    </div>
                    <p className="text-sm text-text-secondary mt-4 mb-4">
                        Haddii aad tan riixdo, users-ka waxay ka bixi doonaan premium session-kooda ilaa ay mar kale login sameeyaan.
                    </p>
                    <button
                        onClick={clearAllUserLogins}
                        disabled={clearingLogins}
                        className="px-6 py-3 bg-accent-red text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {clearingLogins ? "Clearing logins..." : "Clear All User Logins"}
                    </button>
                    {clearLoginsResult && (
                        <p className={`mt-3 text-sm font-semibold ${clearLoginsResult.type === "success" ? "text-accent-green" : "text-accent-red"}`}>
                            {clearLoginsResult.text}
                        </p>
                    )}
                </div>
            </div>

            {/* SEO Settings Section */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
                    <Search size={24} className="text-accent-green" />
                    <div>
                        <h3 className="font-bold text-lg">SEO Settings</h3>
                        <p className="text-text-muted text-sm">Customize search engine optimization for better visibility</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm text-text-secondary mb-2">Site Tagline</label>
                        <input
                            value={formData.seoTagline}
                            onChange={e => setFormData({ ...formData, seoTagline: e.target.value })}
                            placeholder="Daawo Ciyaaraha Live, Filimada & Musalsalada"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                        <p className="text-xs text-text-muted mt-1">Short tagline shown in browser tabs and search results</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm text-text-secondary mb-2">Site Description (Meta Description)</label>
                        <textarea
                            value={formData.seoDescription}
                            onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                            placeholder="Fanbroj waa website-ka ugu fiican ee daawashada ciyaaraha, filimada iyo musalsalada. Ku raaxayso content-ka ugu cusub."
                            rows={3}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 resize-none"
                        />
                        <p className="text-xs text-text-muted mt-1">Appears in Google search results (recommended: 150-160 characters)</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm text-text-secondary mb-2">Keywords (comma separated)</label>
                        <input
                            value={formData.seoKeywords}
                            onChange={e => setFormData({ ...formData, seoKeywords: e.target.value })}
                            placeholder="ciyaar live, somali movies, af somali films, sports streaming"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                        <p className="text-xs text-text-muted mt-1">Keywords help search engines understand your content</p>
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">OG Image URL</label>
                        <input
                            value={formData.ogImage}
                            onChange={e => setFormData({ ...formData, ogImage: e.target.value })}
                            placeholder="https://fanbroj.net/og-image.jpg"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                        <p className="text-xs text-text-muted mt-1">Image shown when shared on social media (1200x630px recommended)</p>
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Twitter Handle</label>
                        <input
                            value={formData.twitterHandle}
                            onChange={e => setFormData({ ...formData, twitterHandle: e.target.value })}
                            placeholder="@fanbroj"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Google Analytics ID</label>
                        <input
                            value={formData.googleAnalyticsId}
                            onChange={e => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                            placeholder="G-XXXXXXXXXX"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Google Site Verification</label>
                        <input
                            value={formData.googleVerification}
                            onChange={e => setFormData({ ...formData, googleVerification: e.target.value })}
                            placeholder="verification-code"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-stadium-dark border border-border-subtle rounded-xl p-6">
                <h3 className="font-bold mb-2">Environment Variables</h3>
                <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between"><span className="text-text-muted">MONGODB_URI</span><span className="text-accent-green">✓ Set</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">ADMIN_TOKEN</span><span className="text-accent-gold">Required</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">FOOTBALL_API_KEY</span><span className="text-text-muted">Optional</span></div>
                </div>
            </div>
        </div>
    );
}
