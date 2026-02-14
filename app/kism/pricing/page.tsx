"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { Save, DollarSign, Smartphone } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminPricingPage() {
    const { data: settings, mutate } = useSWR("/api/settings", fetcher);
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        priceMatch: 0.2, priceWeekly: 1, priceMonthly: 3.5, priceYearly: 11,
        maxDevicesMatch: 1, maxDevicesWeekly: 2, maxDevicesMonthly: 3, maxDevicesYearly: 5,
        freeMoviesPerDay: 3, freeMoviePreviewMinutes: 26, moviePreviewLockEnabled: true, freeMovieTimerSpeedMultiplier: 12,
    });

    useEffect(() => {
        if (settings) setFormData({
            priceMatch: settings.priceMatch ?? 0.2,
            priceWeekly: settings.priceWeekly ?? 1,
            priceMonthly: settings.priceMonthly ?? 3.5,
            priceYearly: settings.priceYearly ?? 11,
            maxDevicesMatch: settings.maxDevicesMatch ?? 1,
            maxDevicesWeekly: settings.maxDevicesWeekly ?? 2,
            maxDevicesMonthly: settings.maxDevicesMonthly ?? 3,
            maxDevicesYearly: settings.maxDevicesYearly ?? 5,
            freeMoviesPerDay: Math.max(3, settings.freeMoviesPerDay ?? 3),
            freeMoviePreviewMinutes: settings.freeMoviePreviewMinutes ?? 26,
            moviePreviewLockEnabled: true,
            freeMovieTimerSpeedMultiplier: settings.freeMovieTimerSpeedMultiplier ?? 12,
        });
    }, [settings]);

    const handleSave = async () => {
        await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        mutate();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-2xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">PRICING</h1>
                    <p className="text-text-muted">Hagaaji qiimaha iyo xadka qalabka</p>
                </div>
                <button onClick={handleSave} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${saved ? "bg-accent-green/20 text-accent-green" : "bg-accent-green text-black"}`}>
                    <Save size={20} />{saved ? "Saved!" : "Save"}
                </button>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border-subtle"><DollarSign size={24} className="text-accent-gold" /><h3 className="font-bold">Qiimaha (USD)</h3></div>
                <div className="grid grid-cols-2 gap-4">
                    {(["Match", "Weekly", "Monthly", "Yearly"] as const).map((plan) => (
                        <div key={plan}><label className="block text-sm text-text-secondary mb-2">{plan}</label>
                            <input type="number" step="0.01" value={(formData as any)[`price${plan}`]} onChange={(e) => setFormData({ ...formData, [`price${plan}`]: parseFloat(e.target.value) || 0 })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    ))}
                </div>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border-subtle"><Smartphone size={24} className="text-blue-400" /><h3 className="font-bold">Xadka Qalabka</h3></div>
                <div className="grid grid-cols-2 gap-4">
                    {(["Match", "Weekly", "Monthly", "Yearly"] as const).map((plan) => (
                        <div key={plan}><label className="block text-sm text-text-secondary mb-2">{plan}</label>
                            <input type="number" min={1} value={(formData as any)[`maxDevices${plan}`]} onChange={(e) => setFormData({ ...formData, [`maxDevices${plan}`]: parseInt(e.target.value) || 1 })} className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3" /></div>
                    ))}
                </div>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
                    <DollarSign size={24} className="text-accent-red" />
                    <h3 className="font-bold">Aggressive Paywall Settings</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex items-center justify-between bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3">
                        <div>
                            <label className="block text-sm font-semibold">Preview Timer Lock (Forced)</label>
                            <p className="text-xs text-text-secondary">Always ON for free users on premium movies.</p>
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
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Free Movies / Day</label>
                        <input
                            type="number"
                            min={3}
                            value={formData.freeMoviesPerDay}
                            onChange={(e) => setFormData({ ...formData, freeMoviesPerDay: parseInt(e.target.value) || 3 })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Free Preview Minutes</label>
                        <input
                            type="number"
                            min={1}
                            value={formData.freeMoviePreviewMinutes}
                            onChange={(e) => setFormData({ ...formData, freeMoviePreviewMinutes: parseInt(e.target.value) || 26 })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Timer Speed (x)</label>
                        <input
                            type="number"
                            min={12}
                            step="0.1"
                            value={formData.freeMovieTimerSpeedMultiplier}
                            onChange={(e) => setFormData({ ...formData, freeMovieTimerSpeedMultiplier: Math.max(12, parseFloat(e.target.value) || 12) })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
