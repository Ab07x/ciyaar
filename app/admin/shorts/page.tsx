"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/providers/ToastProvider";
import { Trash2, Plus, Lock, Eye, Video, Link as LinkIcon, Image as ImageIcon, Edit, X } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export default function ShortsAdminPage() {
    const { toast } = useToast();

    // Data
    const shorts = useQuery(api.shorts.list, { limit: 50 });
    const createShort = useMutation(api.shorts.create);
    const updateShort = useMutation(api.shorts.update);
    const deleteShort = useMutation(api.shorts.remove);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        embedUrl: "",
        thumbnailUrl: "",
        views: 0,
        isLive: false,
        channelName: "",
    });

    const resetForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({
            title: "",
            embedUrl: "",
            thumbnailUrl: "",
            views: 0,
            isLive: false,
            channelName: "",
        });
    };

    const handleEdit = (item: any) => {
        setFormData({
            title: item.title,
            embedUrl: item.embedUrl,
            thumbnailUrl: item.thumbnailUrl,
            views: item.views,
            isLive: item.isLive,
            channelName: item.channelName || "",
        });
        setEditingId(item._id);
        setIsFormOpen(true);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateShort({ id: editingId as any, ...formData });
                toast("Short updated successfully", "success");
            } else {
                await createShort(formData);
                toast("Short created successfully", "success");
            }
            resetForm();
        } catch (error) {
            toast("Failed to save short", "error");
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
                <button
                    onClick={() => {
                        if (isFormOpen) resetForm();
                        else setIsFormOpen(true);
                    }}
                    className={cn("cta-primary", isFormOpen && "bg-stadium-elevated border border-white/10 hover:bg-white/5")}
                >
                    {isFormOpen ? "Cancel" : "Add New Short"}
                    {isFormOpen ? <X size={20} /> : <Plus size={20} />}
                </button>
            </div>

            {/* Create/Edit Form */}
            {isFormOpen && (
                <div className="bg-stadium-elevated p-6 rounded-2xl border border-white/10 animate-in slide-in-from-top-4 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        {editingId ? <Edit size={20} className="text-accent-gold" /> : <Plus size={20} className="text-accent-green" />}
                        {editingId ? "Edit Short" : "Create New Short"}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-muted">Title</label>
                            <input required className="w-full bg-stadium-dark border border-border-strong rounded-lg p-3 text-white focus:border-accent-green outline-none transition-colors"
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Goolkii Caawa" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-muted">Channel Name</label>
                            <input required className="w-full bg-stadium-dark border border-border-strong rounded-lg p-3 text-white focus:border-accent-green outline-none transition-colors"
                                value={formData.channelName} onChange={e => setFormData({ ...formData, channelName: e.target.value })} placeholder="e.g. Gool FM" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-muted">Views</label>
                            <input type="number" className="w-full bg-stadium-dark border border-border-strong rounded-lg p-3 text-white focus:border-accent-green outline-none transition-colors"
                                value={formData.views} onChange={e => setFormData({ ...formData, views: parseInt(e.target.value) })} />
                        </div>
                        <div className="flex items-center gap-2 pt-8">
                            <div className="relative flex items-center">
                                <input type="checkbox" id="isLive" className="peer w-5 h-5 accent-accent-red cursor-pointer"
                                    checked={formData.isLive} onChange={e => setFormData({ ...formData, isLive: e.target.checked })} />
                                <label htmlFor="isLive" className="ml-2 text-white font-bold select-none cursor-pointer">Is Live Stream?</label>
                            </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-text-muted">Embed URL (Iframe/Video)</label>
                            <div className="flex gap-2">
                                <div className="bg-stadium-dark border border-border-strong border-r-0 rounded-l-lg p-3 flex items-center justify-center">
                                    <LinkIcon className="text-text-muted" size={20} />
                                </div>
                                <input required className="w-full bg-stadium-dark border border-border-strong rounded-r-lg p-3 text-white font-mono text-sm focus:border-accent-green outline-none transition-colors"
                                    value={formData.embedUrl} onChange={e => setFormData({ ...formData, embedUrl: e.target.value })} placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ" />
                            </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-text-muted">Thumbnail URL (Poster)</label>
                            <div className="flex gap-2">
                                <div className="bg-stadium-dark border border-border-strong border-r-0 rounded-l-lg p-3 flex items-center justify-center">
                                    <ImageIcon className="text-text-muted" size={20} />
                                </div>
                                <input required className="w-full bg-stadium-dark border border-border-strong rounded-r-lg p-3 text-white font-mono text-sm focus:border-accent-green outline-none transition-colors"
                                    value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} placeholder="https://images.unsplash.com/..." />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex gap-4 pt-4">
                            <button type="submit" className={cn("flex-1 py-3 px-6 rounded-xl font-bold transition-all transform hover:scale-[1.02]", editingId ? "bg-accent-gold text-black hover:bg-white" : "cta-green")}>
                                {editingId ? "Update Changes" : "Publish Short"}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="px-6 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {shorts === undefined ? (
                    [...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
                ) : (
                    shorts.map((item) => (
                        <div key={item._id} className={cn("bg-stadium-elevated rounded-2xl border overflow-hidden group transition-all duration-300",
                            editingId === item._id ? "border-accent-gold ring-2 ring-accent-gold" : "border-white/5 hover:border-white/20 hover:shadow-xl")}>

                            <div className="aspect-[9/16] relative cursor-pointer" onClick={() => handleEdit(item)}>
                                <img src={item.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                    <h3 className="text-white font-bold mb-1 line-clamp-2">{item.title}</h3>
                                    <div className="flex justify-between items-center text-xs text-gray-300">
                                        <span>{item.channelName}</span>
                                        <span className="flex items-center gap-1"><Eye size={12} /> {item.views}</span>
                                    </div>
                                </div>
                                {item.isLive && (
                                    <span className="absolute top-2 right-2 bg-accent-red text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
                                )}
                                {/* Edit Overlay on Hover */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold flex items-center gap-2">
                                        <Edit size={16} /> Edit
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 flex items-center justify-between border-t border-white/5 bg-stadium-elevated relative z-10">
                                <span className="text-xs text-text-muted font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(item)} className="p-2 text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors" title="Edit">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(item._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
