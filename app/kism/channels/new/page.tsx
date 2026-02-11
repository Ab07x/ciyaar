"use client";

import useSWR from "swr";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronLeft, Plus, X } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
    params?: Promise<{ id: string }>;
}

export default function ChannelFormPage({ params }: Props) {
    const router = useRouter();
    const idParams = params ? use(params) : null;
    const id = idParams?.id;

    const { data: channel } = useSWR(
        id ? `/api/channels?slug=${id}` : null,
        fetcher
    );

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        thumbnailUrl: "",
        category: "sports" as "sports" | "entertainment" | "news" | "movies",
        isPremium: false,
        isLive: false,
        priority: 0,
        embeds: [{ label: "Server 1", url: "", type: "iframe" as "m3u8" | "iframe" | "video" }],
    });

    useEffect(() => {
        if (channel && "name" in channel) {
            setFormData({
                name: channel.name,
                slug: channel.slug,
                description: channel.description || "",
                thumbnailUrl: channel.thumbnailUrl || "",
                category: channel.category,
                isPremium: channel.isPremium,
                isLive: channel.isLive,
                priority: channel.priority,
                embeds: channel.embeds?.length > 0
                    ? channel.embeds.map((e: any) => ({ ...e, type: (e as any).type || "iframe" }))
                    : [{ label: "Server 1", url: "", type: "iframe" as const }],
            });
        }
    }, [channel]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            description: formData.description || undefined,
            thumbnailUrl: formData.thumbnailUrl || undefined,
        };

        try {
            if (channel && "_id" in channel) {
                const res = await fetch("/api/channels", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: channel._id, ...data }),
                });
                if (!res.ok) throw new Error("Failed to update");
            } else {
                const res = await fetch("/api/channels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (!res.ok) throw new Error("Failed to create");
            }
            router.push("/kism/channels");
        } catch (err) {
            console.error(err);
            alert("Failed to save channel");
        }
    };

    const generateSlug = () => {
        const slug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        setFormData({ ...formData, slug });
    };

    const addEmbed = () => {
        if (formData.embeds.length < 10) {
            setFormData({
                ...formData,
                embeds: [...formData.embeds, { label: `Server ${formData.embeds.length + 1}`, url: "", type: "iframe" as const }],
            });
        }
    };

    const removeEmbed = (i: number) => {
        setFormData({
            ...formData,
            embeds: formData.embeds.filter((_, idx) => idx !== i),
        });
    };

    const updateEmbed = (i: number, field: "label" | "url" | "type", value: string) => {
        const embeds = [...formData.embeds];
        (embeds[i] as any)[field] = value;
        setFormData({ ...formData, embeds });
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/kism/channels" className="p-2 bg-stadium-elevated rounded-lg">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-black">{id ? "EDIT CHANNEL" : "NEW CHANNEL"}</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                >
                    <Save size={20} />
                    {id ? "Update" : "Publish"}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="text-sm font-bold text-text-muted uppercase border-b border-border-strong pb-3">
                        Basic Info
                    </h3>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Channel Name</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            placeholder="e.g. beIN Sports 1"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs text-text-secondary">Slug</label>
                            <button type="button" onClick={generateSlug} className="text-xs text-accent-green">
                                Auto
                            </button>
                        </div>
                        <input
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            required
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            placeholder="e.g. bein-sports-1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 min-h-[100px]"
                            placeholder="Short description..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Thumbnail URL</label>
                        <input
                            value={formData.thumbnailUrl}
                            onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                {/* Settings */}
                <div className="space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="text-sm font-bold text-text-muted uppercase border-b border-border-strong pb-3">
                        Settings
                    </h3>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        >
                            <option value="sports">Sports</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="news">News</option>
                            <option value="movies">Movies</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Priority (higher = featured)</label>
                        <input
                            type="number"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-2">
                        <div className="p-4 bg-stadium-dark rounded-xl border border-border-subtle">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Premium</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isPremium: !formData.isPremium })}
                                    className={`w-12 h-6 rounded-full relative ${formData.isPremium ? "bg-accent-gold" : "bg-border-strong"}`}
                                >
                                    <div
                                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isPremium ? "right-1" : "left-1"}`}
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 bg-stadium-dark rounded-xl border border-border-subtle">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Live Now</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isLive: !formData.isLive })}
                                    className={`w-12 h-6 rounded-full relative ${formData.isLive ? "bg-accent-red" : "bg-border-strong"}`}
                                >
                                    <div
                                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isLive ? "right-1" : "left-1"}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Embed Links */}
                <div className="md:col-span-2 space-y-4 bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <div className="flex justify-between items-center border-b border-border-strong pb-3">
                        <h3 className="text-sm font-bold text-text-muted uppercase">Embed Links (1-10)</h3>
                        {formData.embeds.length < 10 && (
                            <button
                                type="button"
                                onClick={addEmbed}
                                className="text-xs text-accent-green flex items-center gap-1"
                            >
                                <Plus size={14} />
                                Add
                            </button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {formData.embeds.map((embed, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    value={embed.label}
                                    onChange={(e) => updateEmbed(i, "label", e.target.value)}
                                    placeholder="Label"
                                    className="w-1/5 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                />
                                <select
                                    value={(embed as any).type || "iframe"}
                                    onChange={(e) => updateEmbed(i, "type", e.target.value)}
                                    className="w-24 bg-stadium-dark border border-border-subtle rounded-lg px-2 py-2 text-sm"
                                >
                                    <option value="iframe">Iframe</option>
                                    <option value="m3u8">M3U8</option>
                                    <option value="video">Video</option>
                                </select>
                                <input
                                    value={embed.url}
                                    onChange={(e) => updateEmbed(i, "url", e.target.value)}
                                    placeholder={(embed as any).type === "m3u8" ? "https://example.com/stream.m3u8" : "Iframe URL"}
                                    className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                />
                                {formData.embeds.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEmbed(i)}
                                        className="text-text-muted hover:text-accent-red"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
}
