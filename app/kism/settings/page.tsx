"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { Save, Settings, MessageSquare, Search, Globe } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

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
        freeMoviesPerDay: 3,
        freeMoviePreviewMinutes: 26,
        moviePreviewLockEnabled: true,
        freeMovieTimerSpeedMultiplier: 8,
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

    useEffect(() => {
        if (settings) setFormData({
            siteName: settings.siteName,
            whatsappNumber: settings.whatsappNumber,
            priceMatch: settings.priceMatch,
            priceWeekly: settings.priceWeekly,
            priceMonthly: settings.priceMonthly,
            priceYearly: settings.priceYearly,
            // New Plan Pricing
            priceStarter: (settings as any).priceStarter || 24.99,
            pricePlus: (settings as any).pricePlus || 34.00,
            pricePro: (settings as any).pricePro || 38.00,
            priceElite: (settings as any).priceElite || 47.00,
            maxDevicesMatch: settings.maxDevicesMatch,
            maxDevicesWeekly: settings.maxDevicesWeekly,
            maxDevicesMonthly: settings.maxDevicesMonthly,
            maxDevicesYearly: settings.maxDevicesYearly,
            freeMoviesPerDay: Math.max(3, settings.freeMoviesPerDay ?? 3),
            freeMoviePreviewMinutes: settings.freeMoviePreviewMinutes ?? 26,
            moviePreviewLockEnabled: settings.moviePreviewLockEnabled ?? true,
            freeMovieTimerSpeedMultiplier: settings.freeMovieTimerSpeedMultiplier ?? 8,
            // SEO Settings
            seoTagline: (settings as any).seoTagline || "",
            seoDescription: (settings as any).seoDescription || "",
            seoKeywords: (settings as any).seoKeywords || "",
            ogImage: (settings as any).ogImage || "",
            twitterHandle: (settings as any).twitterHandle || "",
            googleAnalyticsId: (settings as any).googleAnalyticsId || "",
            googleVerification: (settings as any).googleVerification || "",
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
                                <p className="text-sm font-semibold">Enable Preview Timer Lock</p>
                                <p className="text-xs text-text-muted">Force lock after preview time and send free users to pricing.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, moviePreviewLockEnabled: !formData.moviePreviewLockEnabled })}
                                className={`w-12 h-6 rounded-full relative transition-colors ${formData.moviePreviewLockEnabled ? "bg-accent-green" : "bg-border-strong"}`}
                                aria-label="Toggle movie preview timer lock"
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.moviePreviewLockEnabled ? "right-1" : "left-1"}`} />
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
                                    min={1}
                                    step="0.1"
                                    value={formData.freeMovieTimerSpeedMultiplier}
                                    onChange={e => setFormData({ ...formData, freeMovieTimerSpeedMultiplier: parseFloat(e.target.value) || 8 })}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Free Movies / Day</label>
                                <input
                                    type="number"
                                    min={3}
                                    value={formData.freeMoviesPerDay}
                                    onChange={e => setFormData({ ...formData, freeMoviesPerDay: parseInt(e.target.value) || 3 })}
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
