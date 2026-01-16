"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Save, Settings, MessageSquare } from "lucide-react";

export default function AdminSettingsPage() {
    const settings = useQuery(api.settings.getSettings);
    const updateSettings = useMutation(api.settings.updateSettings);
    const seedSettings = useMutation(api.settings.seedSettings);
    const seedLeagues = useMutation(api.leagues.seedLeagues);
    const seedAds = useMutation(api.ads.seedAds);

    const [formData, setFormData] = useState({ siteName: "Fanbroj", whatsappNumber: "+252" });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (settings) setFormData({ siteName: settings.siteName, whatsappNumber: settings.whatsappNumber });
    }, [settings]);

    const handleSave = async () => {
        await updateSettings(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const seedAll = async () => {
        await seedSettings();
        await seedLeagues();
        await seedAds();
        window.location.reload();
    };

    return (
        <div className="max-w-2xl space-y-8">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-black">SETTINGS</h1><p className="text-text-muted">Global configuration</p></div>
                <button onClick={handleSave} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${saved ? "bg-accent-green/20 text-accent-green" : "bg-accent-green text-black"}`}><Save size={20} />{saved ? "Saved!" : "Save"}</button>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border-subtle"><Settings size={24} className="text-text-muted" /><h3 className="font-bold">General</h3></div>
                <div><label className="block text-sm text-text-secondary mb-2">Site Name</label><input value={formData.siteName} onChange={e => setFormData({ ...formData, siteName: e.target.value })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                <div><label className="block text-sm text-text-secondary mb-2">WhatsApp Number</label><input value={formData.whatsappNumber} onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })} placeholder="+252..." className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                <h3 className="font-bold mb-4">Seed Default Data</h3>
                <p className="text-text-muted text-sm mb-4">Ku dar data-ga hore (leagues, ads, settings)</p>
                <button onClick={seedAll} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl">Seed All Defaults</button>
            </div>

            <div className="bg-stadium-dark border border-border-subtle rounded-xl p-6">
                <h3 className="font-bold mb-2">Environment Variables</h3>
                <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between"><span className="text-text-muted">NEXT_PUBLIC_CONVEX_URL</span><span className="text-accent-green">✓ Set</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">ADMIN_TOKEN</span><span className="text-accent-gold">Required</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">FOOTBALL_API_KEY</span><span className="text-text-muted">Optional</span></div>
                </div>
            </div>
        </div>
    );
}
