"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

export function NotificationPreferences() {
    const { deviceId } = useUser();
    const prefs = useQuery(api.notifications.getNotificationPreferences,
        deviceId ? { deviceId } : "skip"
    );
    const updatePrefs = useMutation(api.notifications.updateNotificationPreferences);
    const [saving, setSaving] = useState(false);

    if (!prefs) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
        );
    }

    const handleToggle = async (key: string, value: boolean) => {
        if (!deviceId) return;
        setSaving(true);
        try {
            await updatePrefs({
                deviceId,
                [key]: value,
            });
        } finally {
            setSaving(false);
        }
    };

    const settings = [
        {
            key: "matchReminders",
            label: "Xusuusin Ciyaaraha",
            description: "Hel ogeysiis 15 daqiiqo kahor ciyaarta",
            value: prefs.matchReminders,
            icon: "⚽",
        },
        {
            key: "newReleases",
            label: "Filimo/Musalsalo Cusub",
            description: "Marka content cusub la soo galiyo",
            value: prefs.newReleases,
            icon: "🎬",
        },
        {
            key: "promotions",
            label: "Qiimo Jaban & Offers",
            description: "Hel discount codes & special offers",
            value: prefs.promotions,
            icon: "🎁",
        },
        {
            key: "contentRequests",
            label: "Codsigaaga",
            description: "Marka filimkaaga la soo galiyo",
            value: prefs.contentRequests,
            icon: "📢",
        },
    ];

    return (
        <div className="bg-stadium-elevated border border-border-subtle rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent-green/20 flex items-center justify-center">
                    <Bell className="text-accent-green" size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white">Ogeysiisyada</h3>
                    <p className="text-sm text-text-muted">Dooro kuwa aad rabto</p>
                </div>
            </div>

            <div className="space-y-4">
                {settings.map((setting) => (
                    <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 bg-stadium-dark rounded-xl border border-border-subtle"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{setting.icon}</span>
                            <div>
                                <p className="font-bold text-white text-sm">{setting.label}</p>
                                <p className="text-xs text-text-muted">{setting.description}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle(setting.key, !setting.value)}
                            disabled={saving}
                            className={`relative w-12 h-6 rounded-full transition-colors ${setting.value ? "bg-accent-green" : "bg-stadium-hover"
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${setting.value ? "left-7" : "left-1"
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
