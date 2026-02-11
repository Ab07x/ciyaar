"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { useToast } from "@/providers/ToastProvider";
import { Trash2, Plus, Lock, Eye, Video, Link as LinkIcon, Image as ImageIcon, Edit, X } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ShortsAdminPage() {
    const toast = useToast();

    // Data
    const { data: shorts, mutate } = useSWR("/api/shorts?limit=50", fetcher);

    // State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        videoUrl: "",
        thumbnailUrl: "",
        isPremium: false,
        isPublished: true,
    });

    const resetForm = () => {
        setFormData({ title: "", videoUrl: "", thumbnailUrl: "", isPremium: false, isPublished: true });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (short: any) => {
        setFormData({
            title: short.title || "",
            videoUrl: short.videoUrl || "",
            thumbnailUrl: short.thumbnailUrl || "",
            isPremium: short.isPremium || false,
            isPublished: short.isPublished ?? true,
        });
        setEditingId(short._id);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.videoUrl) {
            toast("Title and video URL required", "error");
            return;
        }
        try {
            if (editingId) {
                await fetch("/api/shorts", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editingId, ...formData }),
                });
                toast("Short updated!", "success");
            } else {
                await fetch("/api/shorts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                toast("Short created!", "success");
            }
            mutate();
            resetForm();
        } catch {
            toast("Failed to save", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this short?")) return;
        await fetch(`/api/shorts?id=${id}`, { method: "DELETE" });
        toast("Deleted", "success");
        mutate();
    };

    if (!shorts) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">SHORTS</h1>
                    <p className="text-text-muted">Manage short video clips</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Short
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold">{editingId ? "Edit Short" : "New Short"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-1">Title *</label>
                            <input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1">Video URL *</label>
                            <input
                                value={formData.videoUrl}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-1">Thumbnail URL</label>
                            <input
                                value={formData.thumbnailUrl}
                                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2"
                            />
                        </div>
                        <div className="flex items-end gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPremium}
                                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Premium</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Published</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={resetForm} className="px-4 py-2 bg-stadium-hover rounded-lg">Cancel</button>
                        <button onClick={handleSubmit} className="px-6 py-2 bg-accent-green text-black font-bold rounded-lg">
                            {editingId ? "Update" : "Create"}
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {shorts.map((short: any) => (
                    <div key={short._id} className="bg-stadium-elevated border border-border-strong rounded-xl p-4 flex items-center gap-4">
                        <div className="w-20 h-12 rounded-lg overflow-hidden bg-stadium-dark flex-shrink-0">
                            {short.thumbnailUrl ? (
                                <img src={short.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-muted">
                                    <Video size={16} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate">{short.title}</h3>
                            <div className="flex gap-2 mt-1">
                                {short.isPremium && (
                                    <span className="text-xs bg-accent-gold/20 text-accent-gold px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                        <Lock size={10} /> Premium
                                    </span>
                                )}
                                <span className={cn("text-xs px-2 py-0.5 rounded font-bold",
                                    short.isPublished ? "bg-accent-green/20 text-accent-green" : "bg-gray-600/20 text-gray-400"
                                )}>
                                    {short.isPublished ? "Published" : "Draft"}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(short)} className="p-2 hover:bg-stadium-hover rounded-lg text-text-muted">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(short._id)} className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {shorts.length === 0 && (
                    <div className="text-center py-12 bg-stadium-elevated rounded-xl border border-border-strong border-dashed">
                        <Video size={48} className="mx-auto mb-4 text-text-muted/30" />
                        <p className="text-text-muted">No shorts yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
