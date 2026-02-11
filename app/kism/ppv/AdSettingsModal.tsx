"use client";

import { useState, useEffect } from "react";
import { X, Save, Upload, Plus, Trash2, Globe, Monitor, Smartphone, Video, Code, Image as ImageIcon } from "lucide-react";

interface AdSettingsModalProps {
    ppvId: string | null;
    initialData?: any;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export function AdSettingsModal({ ppvId, initialData, onClose, onSave }: AdSettingsModalProps) {
    const [loading, setLoading] = useState(false);
    const [adType, setAdType] = useState<"video" | "vast" | "adsense" | "custom" | "image">("video");

    const [formData, setFormData] = useState({
        adVideoUrl: "",
        adVastUrl: "",
        adImageUrl: "",
        adClickUrl: "",
        adHtml: "",
        adAdsenseClient: "",
        adAdsenseSlot: "",
        adDuration: 15,
        adSkipAfter: 5,
    });

    useEffect(() => {
        if (initialData) {
            setAdType(initialData.adType || "video");
            setFormData({
                adVideoUrl: initialData.adVideoUrl || "",
                adVastUrl: initialData.adVastUrl || "",
                adImageUrl: initialData.adImageUrl || "",
                adClickUrl: initialData.adClickUrl || "",
                adHtml: initialData.adHtml || "",
                adAdsenseClient: initialData.adAdsenseClient || "",
                adAdsenseSlot: initialData.adAdsenseSlot || "",
                adDuration: initialData.adDuration || 15,
                adSkipAfter: initialData.adSkipAfter || 5,
            });
        }
    }, [initialData]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSave({
                ...formData,
                adType,
            });
            onClose();
        } catch (error) {
            console.error("Failed to save ad settings", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-stadium-dark border border-border-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-border-strong flex items-center justify-between sticky top-0 bg-stadium-dark z-10">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="p-1.5 bg-accent-gold/20 text-accent-gold rounded-lg"><Video size={20} /></span>
                            Configure Ad for Unlock
                        </h2>
                        <p className="text-sm text-text-muted">Set the specific ad to show for this content</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 flex-1">
                    {/* Ad Type Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {(["video", "vast", "adsense", "custom", "image"] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setAdType(type)}
                                className={`px-2 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${adType === type
                                    ? "bg-accent-green/10 border-accent-green text-accent-green"
                                    : "bg-stadium-elevated border-transparent text-text-secondary hover:bg-stadium-hover"
                                    }`}
                            >
                                {type === "video" && <Video size={18} />}
                                {type === "vast" && <Globe size={18} />}
                                {type === "adsense" && <Code size={18} />}
                                {type === "custom" && <Monitor size={18} />}
                                {type === "image" && <ImageIcon size={18} />}
                                <span className="text-xs font-bold capitalize">{type}</span>
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Form Fields based on Type */}
                    <div className="bg-stadium-elevated border border-border-subtle rounded-xl p-5 space-y-4">

                        {adType === "video" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Direct Video URL (MP4)</label>
                                    <input
                                        value={formData.adVideoUrl}
                                        onChange={(e) => setFormData({ ...formData, adVideoUrl: e.target.value })}
                                        placeholder="https://example.com/ad.mp4"
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none"
                                    />
                                    <p className="text-xs text-text-muted mt-1">Direct link to MP4/WebM video file</p>
                                </div>
                            </>
                        )}

                        {adType === "vast" && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5">VAST / VPAID Tag URL</label>
                                <input
                                    value={formData.adVastUrl}
                                    onChange={(e) => setFormData({ ...formData, adVastUrl: e.target.value })}
                                    placeholder="https://tag.adserver.com/..."
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none"
                                />
                            </div>
                        )}

                        {adType === "adsense" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">AdSense Client ID (ca-pub-...)</label>
                                    <input
                                        value={formData.adAdsenseClient}
                                        onChange={(e) => setFormData({ ...formData, adAdsenseClient: e.target.value })}
                                        placeholder="ca-pub-123456789"
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Slot ID</label>
                                    <input
                                        value={formData.adAdsenseSlot}
                                        onChange={(e) => setFormData({ ...formData, adAdsenseSlot: e.target.value })}
                                        placeholder="1234567890"
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {(adType === "custom" || adType === "image") && (
                            <>
                                {adType === "image" && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Image URL</label>
                                        <input
                                            value={formData.adImageUrl}
                                            onChange={(e) => setFormData({ ...formData, adImageUrl: e.target.value })}
                                            placeholder="https://example.com/banner.jpg"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none"
                                        />
                                    </div>
                                )}

                                {adType === "custom" && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Custom HTML / Embed Code</label>
                                        <textarea
                                            value={formData.adHtml}
                                            onChange={(e) => setFormData({ ...formData, adHtml: e.target.value })}
                                            placeholder="<iframe src='...'></iframe>"
                                            rows={5}
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none font-mono"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Click Destination URL</label>
                                    <input
                                        value={formData.adClickUrl}
                                        onChange={(e) => setFormData({ ...formData, adClickUrl: e.target.value })}
                                        placeholder="https://advertiser.com"
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none"
                                    />
                                </div>
                            </>
                        )}

                        {/* Common Timing Settings */}
                        <div className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Duration (Seconds)</label>
                                <input
                                    type="number"
                                    value={formData.adDuration}
                                    onChange={(e) => setFormData({ ...formData, adDuration: parseInt(e.target.value) })}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none"
                                />
                                <p className="text-xs text-text-muted mt-1">How long the ad must be watched</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Skip After (Seconds)</label>
                                <input
                                    type="number"
                                    value={formData.adSkipAfter}
                                    onChange={(e) => setFormData({ ...formData, adSkipAfter: parseInt(e.target.value) })}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-sm focus:border-accent-green outline-none"
                                />
                                <p className="text-xs text-text-muted mt-1">0 = Non-skippable</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-strong bg-stadium-dark z-10 sticky bottom-0 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-stadium-hover text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-accent-green text-black rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-accent-green/20"
                    >
                        {loading ? "Saving..." : "Save Configuration"}
                    </button>
                </div>
            </div>
        </div>
    );
}
