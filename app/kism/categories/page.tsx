"use client";

import useSWR from "swr";
import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Palette } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminCategoriesPage() {
    const toast = useToast();
    const { data: categories, mutate } = useSWR("/api/categories", fetcher);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        color: "#9AE600",
        order: 1,
        isActive: true,
    });

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast("Name and slug are required", "error");
            return;
        }

        if (editingId) {
            await fetch("/api/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingId, ...formData }),
            });
            toast("Category updated", "success");
            setEditingId(null);
        } else {
            await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            toast("Category created", "success");
        }
        setIsAdding(false);
        setFormData({ name: "", slug: "", description: "", color: "#9AE600", order: 1, isActive: true });
        mutate();
    };

    const handleEdit = (cat: any) => {
        setEditingId(cat._id);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || "",
            color: cat.color || "#9AE600",
            order: cat.order,
            isActive: cat.isActive,
        });
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this category?")) {
            await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
            mutate();
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        await fetch("/api/categories", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isActive: !isActive }),
        });
        mutate();
    };

    const handleSeedDefaults = async () => {
        await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "seed" }),
        });
        mutate();
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">CATEGORIES</h1>
                    <p className="text-text-muted">Manage content categories (Fanproj, Hindi AF Somali, etc)</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSeedDefaults}
                        className="px-4 py-2 bg-stadium-elevated border border-border-strong rounded-xl font-bold text-sm hover:bg-stadium-hover transition-colors"
                    >
                        Seed Defaults
                    </button>
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingId(null);
                            setFormData({ name: "", slug: "", description: "", color: "#9AE600", order: (categories?.length || 0) + 1, isActive: true });
                        }}
                        className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-4">{editingId ? "Edit Category" : "New Category"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Name *</label>
                            <input
                                value={formData.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    setFormData({
                                        ...formData,
                                        name,
                                        slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                                    });
                                }}
                                placeholder="e.g. Fanproj"
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Slug *</label>
                            <input
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="e.g. fanproj"
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-12 h-10 rounded cursor-pointer"
                                />
                                <input
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-2"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Order</label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm text-text-secondary mb-2">Description</label>
                        <input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description"
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 rounded"
                            />
                            <span className="font-semibold">Active</span>
                        </label>
                        <div className="flex-1" />
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-text-muted hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-accent-green text-black rounded-lg font-bold"
                        >
                            {editingId ? "Update" : "Create"}
                        </button>
                    </div>
                </div>
            )}

            {/* Categories List */}
            <div className="grid gap-4">
                {!categories ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-green mx-auto"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-12 bg-stadium-elevated border border-border-strong rounded-2xl">
                        <Palette size={48} className="mx-auto mb-4 text-text-muted/30" />
                        <p className="text-text-muted mb-4">No categories yet</p>
                        <button
                            onClick={handleSeedDefaults}
                            className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold text-sm"
                        >
                            Seed Default Categories
                        </button>
                    </div>
                ) : (
                    categories.map((cat: any) => (
                        <div
                            key={cat._id}
                            className={`bg-stadium-elevated border border-border-strong rounded-2xl p-4 flex items-center gap-4 ${!cat.isActive ? "opacity-60" : ""}`}
                        >
                            <GripVertical size={20} className="text-text-muted cursor-grab" />
                            <div
                                className="w-8 h-8 rounded-lg"
                                style={{ backgroundColor: cat.color || "#9AE600" }}
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold">{cat.name}</h3>
                                    <span className="text-xs text-text-muted bg-stadium-dark px-2 py-0.5 rounded">
                                        {cat.slug}
                                    </span>
                                    {!cat.isActive && (
                                        <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">Inactive</span>
                                    )}
                                </div>
                                {cat.description && (
                                    <p className="text-sm text-text-muted">{cat.description}</p>
                                )}
                            </div>
                            <span className="text-sm text-text-muted">Order: {cat.order}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(cat._id, cat.isActive)}
                                    className={`p-2 rounded-lg transition-colors ${cat.isActive
                                        ? "bg-accent-green/20 text-accent-green hover:bg-accent-green/30"
                                        : "bg-gray-600/20 text-gray-400 hover:bg-gray-600/30"
                                        }`}
                                    title={cat.isActive ? "Deactivate" : "Activate"}
                                >
                                    {cat.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button
                                    onClick={() => handleEdit(cat)}
                                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat._id)}
                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
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
