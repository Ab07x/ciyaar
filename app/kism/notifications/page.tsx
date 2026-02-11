"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell, Send, Users, Loader2, CheckCircle, X, Upload, Smartphone, ImageIcon } from "lucide-react";
import { usePush } from "@/providers/PushProvider";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Default icons available for notifications
const ICON_OPTIONS = [
    { label: "Default (Fanbroj)", value: "/icon-192.png" },
    { label: "Custom", value: "custom" },
];

function TestPushCard() {
    const { isSubscribed, fcmToken, subscribe } = usePush();
    const [testing, setTesting] = useState(false);

    const handleTestPush = async () => {
        if (!fcmToken) {
            const ok = confirm("You are not subscribed on this device. Subscribe now?");
            if (ok) await subscribe();
            return;
        }

        setTesting(true);
        try {
            const res = await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Test Notification 🔔",
                    body: "This is a test notification sent directly to your device via Firebase.",
                    fcmToken: fcmToken,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Test notification sent! Check your system notifications.");
            } else {
                throw new Error(data.error || "Unknown error");
            }
        } catch (error: any) {
            alert("Test failed: " + error.message);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent-blue/20 rounded-full flex items-center justify-center">
                    <Smartphone size={20} className="text-accent-blue" />
                </div>
                <div>
                    <p className="text-sm text-text-muted">My Device</p>
                    <p className="text-lg font-bold">
                        {isSubscribed ? "Subscribed ✅" : "Not Subscribed ❌"}
                    </p>
                </div>
            </div>

            <button
                onClick={handleTestPush}
                disabled={testing}
                className="w-full py-2 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 rounded-lg text-sm font-bold transition-all"
            >
                {testing ? "Sending..." : "Send Test Push to Me"}
            </button>
        </div>
    );
}

interface NotificationForm {
    title: string;
    body: string;
    url: string;
    image: string;
    icon: string;
    customIcon: string;
    targetAudience: "all" | "premium" | "trial" | "free";
}

export default function AdminNotificationsPage() {
    const { data: subscriptionsData } = useSWR("/api/push/subscriptions", fetcher);
    const subscriptions = subscriptionsData?.subscriptions || subscriptionsData || [];

    const [formData, setFormData] = useState<NotificationForm>({
        title: "",
        body: "",
        url: "/",
        image: "",
        icon: "/icon-192.png",
        customIcon: "",
        targetAudience: "all",
    });
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);
    const [triggering, setTriggering] = useState(false);

    // Upload image to local server
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const res = await fetch("/api/upload/notification-image", {
                method: "POST",
                body: formDataUpload,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            setFormData((prev) => ({ ...prev, image: data.url }));
        } catch (error: any) {
            alert("Upload failed: " + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    // Upload custom icon
    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingIcon(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const res = await fetch("/api/upload/notification-image", {
                method: "POST",
                body: formDataUpload,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            setFormData((prev) => ({ ...prev, customIcon: data.url, icon: "custom" }));
        } catch (error: any) {
            alert("Icon upload failed: " + error.message);
        } finally {
            setUploadingIcon(false);
        }
    };

    const getIconUrl = () => {
        if (formData.icon === "custom" && formData.customIcon) {
            return formData.customIcon;
        }
        return formData.icon || "/icon-192.png";
    };

    const handleSend = async () => {
        if (!formData.title || !formData.body) {
            alert("Fadlan geli cinwaanka iyo fariinta.");
            return;
        }

        setSending(true);

        try {
            const res = await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    body: formData.body,
                    url: formData.url || "/",
                    image: formData.image || undefined,
                    icon: getIconUrl(),
                    broadcast: true,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `Server error: ${res.status}`);
            }

            if (data.sent > 0) {
                alert(`Si guul leh ayaa loo diray ${data.sent} ogeysiis!`);
                setFormData({
                    title: "",
                    body: "",
                    url: "/",
                    image: "",
                    icon: "/icon-192.png",
                    customIcon: "",
                    targetAudience: "all",
                });
            } else {
                alert("Lama helin macaamiil loo diro (Active subscribers: 0).");
            }
        } catch (error: any) {
            alert("Khalad ayaa dhacay: " + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleTriggerReminders = async () => {
        setTriggering(true);
        try {
            const res = await fetch("/api/push/reminders", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                alert(`Processed ${data.remindersProcessed} reminders. Sent: ${data.sent}, Failed: ${data.failed}`);
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            alert("Failed to trigger reminders: " + error.message);
        } finally {
            setTriggering(false);
        }
    };


    const subCount = Array.isArray(subscriptions) ? subscriptions.length : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black mb-2">Push Notifications</h1>
                <p className="text-text-muted">Send notifications to all subscribers</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-accent-green/20 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-accent-green" />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">Total Subscribers</p>
                            <p className="text-2xl font-black">{subCount}</p>
                        </div>
                    </div>
                </div>

                <TestPushCard />
            </div>

            {/* Send Form */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Bell size={20} />
                    Send Notification
                </h2>

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. New Match Starting Soon!"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Message</label>
                        <textarea
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            placeholder="e.g. Barcelona vs Real Madrid kicks off in 15 minutes!"
                            rows={3}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    {/* Notification Icon */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Notification Icon</label>
                        <div className="flex flex-wrap gap-3">
                            {ICON_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon: opt.value })}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${formData.icon === opt.value
                                        ? "border-accent-green bg-accent-green/20 text-accent-green"
                                        : "border-border-subtle bg-stadium-dark hover:border-border-strong"
                                        }`}
                                >
                                    {opt.value !== "custom" && (
                                        <img src={opt.value} alt={opt.label} className="w-6 h-6 rounded" />
                                    )}
                                    {opt.value === "custom" && <ImageIcon size={18} />}
                                    <span className="text-sm">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Custom Icon Upload */}
                        {formData.icon === "custom" && (
                            <div className="mt-3 p-4 border border-dashed border-border-subtle rounded-lg bg-stadium-dark/50">
                                {formData.customIcon ? (
                                    <div className="flex items-center gap-4">
                                        <img src={formData.customIcon} alt="Custom Icon" className="w-16 h-16 rounded-lg object-cover" />
                                        <div>
                                            <p className="text-sm font-medium">Custom Icon Uploaded</p>
                                            <button
                                                onClick={() => setFormData({ ...formData, customIcon: "" })}
                                                className="text-xs text-red-400 hover:text-red-300 mt-1"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center py-4 cursor-pointer hover:bg-white/5 transition-colors rounded-lg">
                                        {uploadingIcon ? (
                                            <Loader2 className="animate-spin text-accent-green mb-2" />
                                        ) : (
                                            <Upload className="text-accent-green mb-2" />
                                        )}
                                        <p className="text-sm font-medium">Upload Custom Icon</p>
                                        <p className="text-xs text-text-muted">Recommended: 192x192 PNG</p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleIconUpload}
                                            disabled={uploadingIcon}
                                        />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Large Image Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Large Image (optional)</label>
                        <div className="p-4 border-2 border-dashed border-border-subtle rounded-xl bg-stadium-dark/50">
                            {formData.image ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-border-strong group">
                                    <img src={formData.image} alt="Notification Image" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setFormData({ ...formData, image: "" })}
                                        className="absolute top-2 right-2 p-2 bg-black/70 text-white rounded-full hover:bg-black transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-white/5 transition-colors rounded-lg">
                                    <div className="w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center mb-3">
                                        {uploadingImage ? (
                                            <Loader2 className="animate-spin text-accent-green" />
                                        ) : (
                                            <Upload className="text-accent-green" />
                                        )}
                                    </div>
                                    <p className="font-bold">Upload Image</p>
                                    <p className="text-xs text-text-muted mt-1">Recommended: 720x360 or similar</p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Link (optional)</label>
                        <input
                            type="text"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="/ciyaar/match-slug"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                        <p className="text-xs text-text-muted mt-1">Where users go when they click the notification</p>
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Target Audience</label>
                        <select
                            value={formData.targetAudience}
                            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        >
                            <option value="all">All Users</option>
                            <option value="premium">Premium Subscribers Only</option>
                            <option value="trial">Trial Users Only</option>
                            <option value="free">Free Users Only</option>
                        </select>
                    </div>
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={sending || !formData.title || !formData.body || uploadingImage || uploadingIcon}
                    className="w-full bg-accent-green text-black font-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sending ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            Send to {subCount} Subscribers
                        </>
                    )}
                </button>
            </div>

            {/* Match Reminders */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle size={20} className="text-accent-green" />
                            Match Reminders
                        </h2>
                        <p className="text-sm text-text-muted mt-1">
                            Trigger notifications for users who opted in for upcoming matches.
                        </p>
                    </div>
                    <button
                        onClick={handleTriggerReminders}
                        disabled={triggering}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {triggering ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                        Trigger Reminders
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                <h3 className="font-bold mb-4">Preview</h3>
                <div className="bg-white text-black rounded-lg p-4 max-w-sm">
                    <div className="flex items-start gap-3">
                        <img
                            src={getIconUrl()}
                            alt="Icon"
                            className="w-10 h-10 rounded shadow-sm bg-gray-100"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/icon-192.png"; }}
                        />
                        <div className="flex-1">
                            <p className="font-bold text-sm leading-tight">{formData.title || "Notification Title"}</p>
                            <p className="text-[13px] text-gray-600 mt-1 leading-snug">{formData.body || "Notification message will appear here"}</p>

                            {formData.image && (
                                <div className="mt-2 rounded-md overflow-hidden border border-gray-100">
                                    <img
                                        src={formData.image}
                                        alt="Big Image"
                                        className="w-full aspect-[2/1] object-cover bg-gray-100"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                            )}

                            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-semibold">fanbroj.net • Just now</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
