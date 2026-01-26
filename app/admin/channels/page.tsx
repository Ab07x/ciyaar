"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Edit, Trash2, Save, X, Play } from "lucide-react";

export default function ChannelsAdminPage() {
    const channels = useQuery(api.channels.list, {});
    const createChannel = useMutation(api.channels.create);
    const updateChannel = useMutation(api.channels.update);
    const deleteChannel = useMutation(api.channels.remove);

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        category: "sports" as const,
        streamUrl: "",
        thumbnailUrl: "",
        isLive: true,
        isPremium: false,
        priority: 10,
    });

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            category: "sports",
            streamUrl: "",
            thumbnailUrl: "",
            isLive: true,
            isPremium: false,
            priority: 10,
        });
        setIsCreating(false);
        setIsEditing(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createChannel(formData);
            resetForm();
        } catch (err) {
            console.error(err);
            alert("Failed to create channel");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing) return;
        try {
            await updateChannel({
                id: isEditing as any,
                ...formData,
            });
            resetForm();
        } catch (err) {
            console.error(err);
            alert("Failed to update channel");
        }
    };

    const startEdit = (channel: any) => {
        setFormData({
            name: channel.name,
            slug: channel.slug,
            category: channel.category,
            streamUrl: channel.embeds[0]?.url || "",
            thumbnailUrl: channel.thumbnailUrl || "",
            isLive: channel.isLive,
            isPremium: channel.isPremium,
            priority: channel.priority,
        });
        setIsEditing(channel._id);
        setIsCreating(true);
    };

    const handleDelete = async (id: any) => {
        if (confirm("Are you sure you want to delete this channel?")) {
            await deleteChannel({ id });
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto text-white">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Play className="text-red-500" /> Live Channels
                </h1>
                <button
                    onClick={() => { setIsCreating(true); setIsEditing(null); }}
                    className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                    <Plus size={20} /> Add Channel
                </button>
            </div>

            {/* Create/Edit Form */}
            {isCreating && (
                <div className="mb-8 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                    <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit Channel" : "New Channel"}</h2>
                    <form onSubmit={isEditing ? handleUpdate : handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="e.g. beIN Sports 1"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Slug</label>
                            <input
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 outline-none"
                                placeholder="e.g. bein-1"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <label className="text-sm text-gray-400">Stream URL (HLS/M3U8)</label>
                            <input
                                required
                                value={formData.streamUrl}
                                onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 font-mono text-sm outline-none"
                                placeholder="http://13.x.x.x/hls/bein1/index.m3u8"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Logo/Thumbnail URL</label>
                            <input
                                value={formData.thumbnailUrl}
                                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 outline-none"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 outline-none"
                            >
                                <option value="sports">Sports</option>
                                <option value="entertainment">Entertainment</option>
                                <option value="news">News</option>
                                <option value="movies">Movies</option>
                            </select>
                        </div>

                        <div className="flex gap-6 mt-2 items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isLive}
                                    onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
                                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-red-600"
                                />
                                <span>Is Live</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPremium}
                                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-yellow-500"
                                />
                                <span>Premium Only</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <span className="text-sm">Priority:</span>
                                <input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                    className="w-16 bg-zinc-800 border border-zinc-700 rounded p-1 text-center"
                                />
                            </label>
                        </div>

                        <div className="col-span-2 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-green-600 px-6 py-2 rounded-lg hover:bg-green-700 font-bold"
                            >
                                <Save size={18} /> {isEditing ? "Update Channel" : "Create Channel"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Channels List */}
            <div className="grid gap-4">
                {channels?.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No channels found. Create one to get started!
                    </div>
                )}

                {channels?.map((channel) => (
                    <div key={channel._id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                                {channel.thumbnailUrl ? (
                                    <img src={channel.thumbnailUrl} alt={channel.name} className="w-10 h-10 object-contain" />
                                ) : (
                                    <Play className="text-zinc-700" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {channel.name}
                                    {channel.isLive && <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded uppercase">Live</span>}
                                    {channel.isPremium && <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded uppercase">Premium</span>}
                                </h3>
                                <p className="text-gray-400 text-sm font-mono truncate max-w-md">
                                    {channel.embeds[0]?.url}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => startEdit(channel)}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400"
                                title="Edit"
                            >
                                <Edit size={20} />
                            </button>
                            <button
                                onClick={() => handleDelete(channel._id)}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-red-500"
                                title="Delete"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
