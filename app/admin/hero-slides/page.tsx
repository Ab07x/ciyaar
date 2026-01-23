"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Film, Tv, Image as ImageIcon } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";

export default function AdminHeroSlidesPage() {
    const slides = useQuery(api.heroSlides.getAllSlides);
    const movies = useQuery(api.movies.listMovies, { isPublished: true, limit: 50 });
    const series = useQuery(api.series.listSeries, { isPublished: true, limit: 50 });
    const createSlide = useMutation(api.heroSlides.createSlide);
    const updateSlide = useMutation(api.heroSlides.updateSlide);
    const deleteSlide = useMutation(api.heroSlides.deleteSlide);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<Id<"hero_slides"> | null>(null);
    const [formData, setFormData] = useState({
        contentType: "movie" as "movie" | "series" | "custom",
        contentId: "",
        title: "",
        subtitle: "",
        description: "",
        imageUrl: "",
        ctaText: "Daawo Hadda",
        ctaLink: "",
        order: 1,
        isActive: true,
    });

    const handleSave = async () => {
        if (formData.contentType !== "custom" && !formData.contentId) {
            alert("Please select a movie or series");
            return;
        }
        if (formData.contentType === "custom" && (!formData.title || !formData.imageUrl)) {
            alert("Custom slides require title and image URL");
            return;
        }

        if (editingId) {
            await updateSlide({ id: editingId, ...formData });
            setEditingId(null);
        } else {
            await createSlide(formData);
        }
        setIsAdding(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            contentType: "movie",
            contentId: "",
            title: "",
            subtitle: "",
            description: "",
            imageUrl: "",
            ctaText: "Daawo Hadda",
            ctaLink: "",
            order: (slides?.length || 0) + 1,
            isActive: true,
        });
    };

    const handleEdit = (slide: any) => {
        setEditingId(slide._id);
        setFormData({
            contentType: slide.contentType,
            contentId: slide.contentId || "",
            title: slide.title || "",
            subtitle: slide.subtitle || "",
            description: slide.description || "",
            imageUrl: slide.imageUrl || "",
            ctaText: slide.ctaText || "Daawo Hadda",
            ctaLink: slide.ctaLink || "",
            order: slide.order,
            isActive: slide.isActive,
        });
        setIsAdding(true);
    };

    const handleDelete = async (id: Id<"hero_slides">) => {
        if (confirm("Are you sure you want to delete this slide?")) {
            await deleteSlide({ id });
        }
    };

    const handleToggleActive = async (id: Id<"hero_slides">, isActive: boolean) => {
        await updateSlide({ id, isActive: !isActive });
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">HERO SLIDES</h1>
                    <p className="text-text-muted">Manage homepage hero slider content</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingId(null);
                        resetForm();
                    }}
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Slide
                </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-4">{editingId ? "Edit Slide" : "New Slide"}</h3>

                    {/* Content Type Selector */}
                    <div className="flex gap-4 mb-6">
                        {[
                            { type: "movie", label: "Movie", icon: Film },
                            { type: "series", label: "Series", icon: Tv },
                            { type: "custom", label: "Custom", icon: ImageIcon },
                        ].map(({ type, label, icon: Icon }) => (
                            <button
                                key={type}
                                onClick={() => setFormData({ ...formData, contentType: type as any, contentId: "" })}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${formData.contentType === type
                                    ? "border-accent-green bg-accent-green/10 text-accent-green"
                                    : "border-border-subtle hover:border-white/30"
                                    }`}
                            >
                                <Icon size={20} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Movie/Series Selector */}
                    {formData.contentType !== "custom" && (
                        <div className="mb-4">
                            <label className="block text-sm text-text-secondary mb-2">
                                Select {formData.contentType === "movie" ? "Movie" : "Series"} *
                            </label>
                            <select
                                value={formData.contentId}
                                onChange={(e) => setFormData({ ...formData, contentId: e.target.value })}
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            >
                                <option value="">Select...</option>
                                {formData.contentType === "movie"
                                    ? movies?.map((m) => (
                                        <option key={m._id} value={m.slug}>
                                            {m.title} ({m.releaseDate?.split("-")[0]})
                                        </option>
                                    ))
                                    : series?.map((s) => (
                                        <option key={s._id} value={s.slug}>
                                            {s.title} ({s.firstAirDate?.split("-")[0]})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    {/* Custom Slide Fields */}
                    {formData.contentType === "custom" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Title *</label>
                                <input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Slide title"
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Subtitle</label>
                                <input
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="Optional subtitle"
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-text-secondary mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Slide description"
                                    rows={3}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">Background Image URL *</label>
                                <input
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">CTA Link</label>
                                <input
                                    value={formData.ctaLink}
                                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                                    placeholder="/pricing"
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>
                        </div>
                    )}

                    {/* Common Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">CTA Button Text</label>
                            <input
                                value={formData.ctaText}
                                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                                placeholder="Daawo Hadda"
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            />
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
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer pb-3">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                                <span className="font-semibold">Active</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
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

            {/* Slides List */}
            <div className="grid gap-4">
                {!slides ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-green mx-auto"></div>
                    </div>
                ) : slides.length === 0 ? (
                    <div className="text-center py-12 bg-stadium-elevated border border-border-strong rounded-2xl">
                        <ImageIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
                        <p className="text-text-muted mb-4">No hero slides yet</p>
                        <p className="text-text-muted text-sm">Add slides to feature movies/series on the homepage hero</p>
                    </div>
                ) : (
                    slides.map((slide) => (
                        <div
                            key={slide._id}
                            className={`bg-stadium-elevated border border-border-strong rounded-2xl p-4 flex items-center gap-4 ${!slide.isActive ? "opacity-60" : ""}`}
                        >
                            <GripVertical size={20} className="text-text-muted cursor-grab" />

                            {/* Preview */}
                            <div className="w-32 h-20 rounded-lg overflow-hidden bg-stadium-dark relative flex-shrink-0">
                                {(slide.content?.backdropUrl || slide.content?.posterUrl || slide.imageUrl) && (
                                    <Image
                                        src={slide.content?.backdropUrl || slide.content?.posterUrl || slide.imageUrl || ""}
                                        alt=""
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${slide.contentType === "movie"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : slide.contentType === "series"
                                            ? "bg-purple-500/20 text-purple-400"
                                            : "bg-orange-500/20 text-orange-400"
                                        }`}>
                                        {slide.contentType.toUpperCase()}
                                    </span>
                                    <h3 className="font-bold">
                                        {slide.content?.title || slide.title || "Custom Slide"}
                                    </h3>
                                    {!slide.isActive && (
                                        <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">Inactive</span>
                                    )}
                                </div>
                                {slide.contentId && (
                                    <p className="text-sm text-text-muted">/{slide.contentType}s/{slide.contentId}</p>
                                )}
                            </div>

                            <span className="text-sm text-text-muted px-3">#{slide.order}</span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(slide._id, slide.isActive)}
                                    className={`p-2 rounded-lg transition-colors ${slide.isActive
                                        ? "bg-accent-green/20 text-accent-green hover:bg-accent-green/30"
                                        : "bg-gray-600/20 text-gray-400 hover:bg-gray-600/30"
                                        }`}
                                >
                                    {slide.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button
                                    onClick={() => handleEdit(slide)}
                                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(slide._id)}
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
