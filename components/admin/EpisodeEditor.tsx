"use client";

import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { X, Save, Plus, Trash2 } from "lucide-react";

interface Props {
    episode: any;
    onClose: () => void;
    onSave: () => void;
}

export default function EpisodeEditor({ episode, onClose, onSave }: Props) {
    const updateEpisode = useMutation(api.series.updateEpisode);


    const [formData, setFormData] = useState({
        title: episode.title,
        titleSomali: episode.titleSomali || "",
        overview: episode.overview || "",
        overviewSomali: episode.overviewSomali || "",
        runtime: episode.runtime || 0,
        airDate: episode.airDate || "",
        embeds: episode.embeds || [],
        isPublished: episode.isPublished,
    });

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateEpisode({
                id: episode._id,
                ...formData,
            });
            onSave();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to save episode");
        }
        setSaving(false);
    };



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-stadium-elevated border border-border-strong rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-strong bg-stadium-elevated sticky top-0 z-10">
                    <h2 className="text-xl font-bold">
                        S{episode.seasonNumber} E{episode.episodeNumber} - {formData.title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-stadium-hover rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase">Title</label>
                            <input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase">Air Date</label>
                            <input
                                type="date"
                                value={formData.airDate}
                                onChange={(e) => setFormData({ ...formData, airDate: e.target.value })}
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2"
                            />
                        </div>
                    </div>

                    {/* Translations */}
                    <div className="bg-stadium-dark p-4 rounded-xl border border-border-subtle">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-sm">Somali Translation</h4>
                        </div>
                        <div className="space-y-3">
                            <input
                                value={formData.titleSomali}
                                onChange={(e) => setFormData({ ...formData, titleSomali: e.target.value })}
                                placeholder="Ciwaan Somali"
                                className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm"
                            />
                            <textarea
                                value={formData.overviewSomali}
                                onChange={(e) => setFormData({ ...formData, overviewSomali: e.target.value })}
                                placeholder="Faahfaahin Somali..."
                                rows={3}
                                className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* Embeds */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold">Embed Sources</h3>
                            <button
                                onClick={() => setFormData({
                                    ...formData,
                                    embeds: [...formData.embeds, { label: "Server 1", url: "" }]
                                })}
                                className="text-xs flex items-center gap-1 bg-accent-green text-black px-2 py-1 rounded font-bold"
                            >
                                <Plus size={14} /> Add Source
                            </button>
                        </div>

                        {formData.embeds.map((embed: any, i: number) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    value={embed.label}
                                    onChange={(e) => {
                                        const newEmbeds = [...formData.embeds];
                                        newEmbeds[i].label = e.target.value;
                                        setFormData({ ...formData, embeds: newEmbeds });
                                    }}
                                    placeholder="Label"
                                    className="w-32 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                />
                                <input
                                    value={embed.url}
                                    onChange={(e) => {
                                        const newEmbeds = [...formData.embeds];
                                        newEmbeds[i].url = e.target.value;
                                        setFormData({ ...formData, embeds: newEmbeds });
                                    }}
                                    placeholder="https://..."
                                    className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                />
                                <select
                                    value={embed.type || "iframe"}
                                    onChange={(e) => {
                                        const newEmbeds = [...formData.embeds];
                                        newEmbeds[i] = { ...newEmbeds[i], type: e.target.value };
                                        setFormData({ ...formData, embeds: newEmbeds });
                                    }}
                                    className="w-24 bg-stadium-dark border border-border-subtle rounded-lg px-2 py-2 text-sm"
                                >
                                    <option value="iframe">Iframe</option>
                                    <option value="m3u8">M3U8</option>
                                    <option value="video">Video</option>
                                </select>
                                <button
                                    onClick={() => {
                                        const newEmbeds = formData.embeds.filter((_: any, idx: number) => idx !== i);
                                        setFormData({ ...formData, embeds: newEmbeds });
                                    }}
                                    className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 bg-stadium-dark rounded-xl">
                        <span className="font-medium">Published</span>
                        <button
                            onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                            className={`w-12 h-6 rounded-full relative transition-colors ${formData.isPublished ? "bg-accent-green" : "bg-border-strong"
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isPublished ? "right-1" : "left-1"
                                }`} />
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-border-strong bg-stadium-elevated sticky bottom-0 z-10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg font-bold hover:bg-stadium-hover">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
