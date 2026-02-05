"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, Send, Users, Loader2, CheckCircle, Image as ImageIcon, X, Upload, Smartphone } from "lucide-react";
import { usePush } from "@/providers/PushProvider";

// Use relative URLs - admin should be accessed directly via server IP to bypass CloudFront
// Access admin at: http://16.170.141.191:3000/kism/notifications

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
    targetAudience: "all" | "premium" | "trial" | "free";
}

export default function AdminNotificationsPage() {
    const subscriptions = useQuery(api.push.getAllSubscriptions);

    const [formData, setFormData] = useState<NotificationForm>({
        title: "",
        body: "",
        url: "/",
        image: "",
        targetAudience: "all",
    });
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

    const generateUploadUrl = useMutation(api.media.generateUploadUrl);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Use Convex storage (bypasses CloudFront)
            const uploadUrl = await generateUploadUrl();

            const res = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!res.ok) throw new Error("Upload failed");

            const { storageId } = await res.json();

            // Get the public URL from Convex
            const publicUrl = `https://valuable-toad-308.convex.cloud/api/storage/${storageId}`;

            setFormData((prev: NotificationForm) => ({ ...prev, image: publicUrl }));
        } catch (error: any) {
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async () => {
        if (!formData.title || !formData.body) {
            alert("Fadlan geli cinwaanka iyo fariinta.");
            return;
        }

        setSending(true);
        setResult(null);

        try {
            console.log("Sending push notification broadcast...", formData);
            const res = await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    body: formData.body,
                    url: formData.url || "/",
                    image: formData.image,
                    icon: "/icon-192.png",
                    broadcast: true,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `Server error: ${res.status}`);
            }

            console.log("Broadcast result:", data);
            setResult(data);

            if (data.sent > 0) {
                alert(`Si guul leh ayaa loo diray ${data.sent} ogeysiis!`);
                setFormData({
                    title: "",
                    body: "",
                    url: "/",
                    image: "",
                    targetAudience: "all",
                });
            } else {
                alert("Lama helin macaamiil loo diro (Active subscribers: 0).");
            }
        } catch (error: any) {
            console.error("Failed to send notification:", error);
            alert("Khalad ayaa dhacay markii la dirayay ogeysiiska: " + error.message);
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

    const isCloudFront = typeof window !== 'undefined' &&
        (window.location.hostname === 'fanbroj.net' || window.location.hostname === 'www.fanbroj.net');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* CloudFront Warning */}
            {isCloudFront && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                    <p className="font-bold text-red-400">CloudFront Blocks POST Requests</p>
                    <p className="text-sm text-red-300 mt-1">
                        Push notifications won't work through CloudFront. Access admin directly:
                    </p>
                    <a
                        href="http://16.170.141.191:3000/kism/notifications"
                        className="inline-block mt-2 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600"
                    >
                        Go to Direct Admin Panel
                    </a>
                </div>
            )}

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
                            <p className="text-2xl font-black">{subscriptions?.length || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Test Push Section */}
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

                    {/* Image Upload Section */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Large Image (optional)</label>
                        <div className="flex flex-col gap-4 p-4 border-2 border-dashed border-border-subtle rounded-xl bg-stadium-dark/50">
                            {formData.image ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-border-strong group">
                                    <img src={formData.image} alt="Upload" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setFormData((prev: NotificationForm) => ({ ...prev, image: "" }))}
                                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-white/5 transition-colors rounded-lg">
                                    <div className="w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center mb-3">
                                        {uploading ? <Loader2 className="animate-spin text-accent-green" /> : <Upload className="text-accent-green" />}
                                    </div>
                                    <p className="font-bold">Upload Image (AWS Lightsail)</p>
                                    <p className="text-xs text-text-muted mt-1">Recommended size: 720x360 or similar</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
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
                            value={formData.targetAudience || "all"}
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
                    disabled={sending || !formData.title || !formData.body || uploading}
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
                            Send to {subscriptions?.length || 0} Subscribers
                        </>
                    )}
                </button>
            </div>

            {/* Match Reminders Section */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle size={20} className="text-accent-green" />
                            Match Reminders
                        </h2>
                        <p className="text-sm text-text-muted mt-1">
                            Trigger notifications for users who opted in for upcoming matches (starting within 45m).
                        </p>
                    </div>
                    <button
                        onClick={handleTriggerReminders}
                        disabled={triggering}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {triggering ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Bell size={18} />
                        )}
                        Trigger Reminders
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                <h3 className="font-bold mb-4">Preview</h3>
                <div className="bg-white text-black rounded-lg p-4 max-w-sm">
                    <div className="flex items-start gap-3">
                        <img src="/icon-192.png" alt="Icon" className="w-10 h-10 rounded shadow-sm" />
                        <div className="flex-1">
                            <p className="font-bold text-sm leading-tight">{formData.title || "Notification Title"}</p>
                            <p className="text-[13px] text-gray-600 mt-1 leading-snug">{formData.body || "Notification message will appear here"}</p>

                            {formData.image && (
                                <div className="mt-2 rounded-md overflow-hidden border border-gray-100">
                                    <img src={formData.image} alt="Big Image" className="w-full aspect-[2/1] object-cover" />
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

