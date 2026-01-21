"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/providers/ToastProvider";
import { Trash2, Plus, Lock, Eye, Video, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ShortsAdminPage() {
    const { toast } = useToast();

    // Data
    const shorts = useQuery(api.shorts.list, { limit: 50 });
    const createShort = useMutation(api.shorts.create);
    const deleteShort = useMutation(api.shorts.remove);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        embedUrl: "",
        thumbnailUrl: "",
        views: 0,
        isLive: false,
        channelName: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createShort(formData);
            toast("Short created successfully", "success");
            setIsFormOpen(false);
            setFormData({
                title: "",
                embedUrl: "",
                thumbnailUrl: "",
                views: 0,
                isLive: false,
                channelName: "",
            });
        } catch (error) {
            toast("Failed to create short", "error");
        }
    };

    const handleDelete = async (id: any) => {
        if (confirm("Are you sure you want to delete this short?")) {
            await deleteShort({ id });
            toast("Short deleted", "success");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">CiyaarSnaps Manager</h1>
                    <p className="text-text-muted">Manage Shorts, Reels, and Live Clips</p>
                </div>
                <button onClick={() => setIsFormOpen(!isFormOpen)} className="cta-primary">
                    {isFormOpen ? "Cancel" : "Add New Short"} <Plus size={20} />
                </button>
            </div>

            {/* Create Form */}
            {isFormOpen && (
                <div className="bg-stadium-elevated p-6 rounded-2xl border border-white/10 animate-in slide-in-from-top-4">
                    <h2 className="text-xl font-bold text-white mb-4">Create New Short</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-muted">Title</label>
                            <input required className="w-full bg-stadium-dark border border-border-strong rounded-lg p-2 text-white"
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Goolkii Caawa" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-muted">Channel Name</label>
                            <input required className="w-full bg-stadium-dark border border-border-strong rounded-lg p-2 text-white"
                                value={formData.channelName} onChange={e => setFormData({ ...formData, channelName: e.target.value })} placeholder="e.g. Gool FM" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-muted">Views</label>
                            <input type="number" className="w-full bg-stadium-dark border border-border-strong rounded-lg p-2 text-white"
                                value={formData.views} onChange={e => setFormData({ ...formData, views: parseInt(e.target.value) })} />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input type="checkbox" id="isLive" className="w-5 h-5 accent-accent-red"
                                checked={formData.isLive} onChange={e => setFormData({ ...formData, isLive: e.target.checked })} />
                            <label htmlFor="isLive" className="text-white font-bold select-none cursor-pointer">Is Live Stream?</label>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-text-muted">Embed URL (Iframe/Video)</label>
                            <div className="flex gap-2">
                                <LinkIcon className="text-text-muted" size={20} />
                                <input required className="w-full bg-stadium-dark border border-border-strong rounded-lg p-2 text-white font-mono text-sm"
                                    value={formData.embedUrl} onChange={e => setFormData({ ...formData, embedUrl: e.target.value })} placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ" />
                            </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-text-muted">Thumbnail URL (Poster)</label>
                            <div className="flex gap-2">
                                <ImageIcon className="text-text-muted" size={20} />
                                <input required className="w-full bg-stadium-dark border border-border-strong rounded-lg p-2 text-white font-mono text-sm"
                                    value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} placeholder="https://images.unsplash.com/..." />
                            </div>
                        </div>
                        <button type="submit" className="md:col-span-2 cta-gold mt-4">Publish Short</button>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {shorts === undefined ? (
                    [...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
                ) : (
                    shorts.map((item) => (
                        <div key={item._id} className="bg-stadium-elevated rounded-2xl border border-white/5 overflow-hidden group hover:border-white/20 transition-all">
                            <div className="aspect-[9/16] relative">
                                <img src={item.thumbnailUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                    <h3 className="text-white font-bold mb-1 line-clamp-2">{item.title}</h3>
                                    <div className="flex justify-between items-center text-xs text-gray-300">
                                        <span>{item.channelName}</span>
                                        <span className="flex items-center gap-1"><Eye size={12} /> {item.views}</span>
                                    </div>
                                </div>
                                {item.isLive && (
                                    <span className="absolute top-2 right-2 bg-accent-red text-white text-[10px] font-bold px-2 py-1 rounded">LIVE</span>
                                )}
                            </div>
                            <div className="p-3 flex items-center justify-between border-t border-white/5">
                                <span className="text-xs text-text-muted font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                                <button onClick={() => handleDelete(item._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
