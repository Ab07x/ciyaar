"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ChevronLeft,
    Star,
    GripVertical,
    Plus,
    X,
    Search,
    Film,
    Loader2,
    Eye,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const MAX_HERO_SLIDES = 12;

export default function HeroAdminPage() {
    const allMovies = useQuery(api.movies.listMovies, { isPublished: true, limit: 1000 });
    const featuredMovies = useQuery(api.movies.getFeaturedMovies);
    const updateMovie = useMutation(api.movies.updateMovie);

    const [searchQuery, setSearchQuery] = useState("");
    const [saving, setSaving] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Filter movies for search - show searched ones at top
    const availableMovies = (allMovies || [])
        .filter((m: any) =>
            !m.isFeatured &&
            (m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.titleSomali?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a: any, b: any) => {
            // If searching, prioritize exact matches
            if (searchQuery) {
                const aMatch = a.title.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                    a.titleSomali?.toLowerCase().startsWith(searchQuery.toLowerCase());
                const bMatch = b.title.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
                    b.titleSomali?.toLowerCase().startsWith(searchQuery.toLowerCase());
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
            }
            // Then by rating
            return (b.rating || 0) - (a.rating || 0);
        });

    // Add movie to hero
    const addToHero = async (movie: any) => {
        if (sortedFeatured.length >= MAX_HERO_SLIDES) return;
        setSaving(movie._id);
        try {
            const maxOrder = Math.max(0, ...(featuredMovies || []).map((m: any) => m.featuredOrder || 0));
            await updateMovie({
                id: movie._id as Id<"movies">,
                isFeatured: true,
                featuredOrder: maxOrder + 1,
            });
        } catch (err) {
            console.error(err);
            alert("Failed to add movie");
        }
        setSaving(null);
    };

    // Remove movie from hero
    const removeFromHero = async (movie: any) => {
        setSaving(movie._id);
        try {
            await updateMovie({
                id: movie._id as Id<"movies">,
                isFeatured: false,
                featuredOrder: 0,
            });
        } catch (err) {
            console.error(err);
            alert("Failed to remove movie");
        }
        setSaving(null);
    };

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (targetIndex: number) => {
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const sorted = [...sortedFeatured];
        const [draggedItem] = sorted.splice(draggedIndex, 1);
        sorted.splice(targetIndex, 0, draggedItem);

        // Update all orders
        setSaving("reordering");
        try {
            for (let i = 0; i < sorted.length; i++) {
                await updateMovie({
                    id: sorted[i]._id as Id<"movies">,
                    featuredOrder: i + 1,
                });
            }
        } catch (err) {
            console.error(err);
            alert("Failed to reorder");
        }
        setSaving(null);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Move movie up in order
    const moveUp = async (movie: any, index: number) => {
        if (index === 0) return;
        const sorted = [...sortedFeatured];
        const prevMovie = sorted[index - 1];

        setSaving(movie._id);
        try {
            await updateMovie({
                id: movie._id as Id<"movies">,
                featuredOrder: prevMovie.featuredOrder || index - 1,
            });
            await updateMovie({
                id: prevMovie._id as Id<"movies">,
                featuredOrder: movie.featuredOrder || index,
            });
        } catch (err) {
            console.error(err);
        }
        setSaving(null);
    };

    // Move movie down in order
    const moveDown = async (movie: any, index: number) => {
        const sorted = [...sortedFeatured];
        if (index === sorted.length - 1) return;
        const nextMovie = sorted[index + 1];

        setSaving(movie._id);
        try {
            await updateMovie({
                id: movie._id as Id<"movies">,
                featuredOrder: nextMovie.featuredOrder || index + 1,
            });
            await updateMovie({
                id: nextMovie._id as Id<"movies">,
                featuredOrder: movie.featuredOrder || index,
            });
        } catch (err) {
            console.error(err);
        }
        setSaving(null);
    };

    const sortedFeatured = [...(featuredMovies || [])].sort((a: any, b: any) =>
        (a.featuredOrder || 0) - (b.featuredOrder || 0)
    );

    return (
        <div className="max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/kism" className="p-2 bg-stadium-elevated rounded-lg hover:bg-stadium-hover">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black">HERO SLIDER</h1>
                        <p className="text-text-muted text-sm">Manage homepage featured movies (max {MAX_HERO_SLIDES} slides)</p>
                    </div>
                </div>
                <Link
                    href="/"
                    target="_blank"
                    className="px-4 py-2 bg-stadium-elevated hover:bg-stadium-hover rounded-lg flex items-center gap-2 text-sm"
                >
                    <Eye size={16} />
                    Preview Homepage
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Hero Slides */}
                <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Current Hero Slides ({sortedFeatured.length}/{MAX_HERO_SLIDES})</h2>
                        {sortedFeatured.length >= MAX_HERO_SLIDES && (
                            <span className="text-xs text-yellow-500">Max reached</span>
                        )}
                    </div>

                    {saving === "reordering" && (
                        <div className="mb-4 p-2 bg-accent-green/20 rounded-lg text-sm text-accent-green flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            Saving new order...
                        </div>
                    )}

                    {sortedFeatured.length === 0 ? (
                        <div className="text-center py-12 text-text-muted">
                            <Film size={48} className="mx-auto mb-3 opacity-30" />
                            <p>No movies in hero slider</p>
                            <p className="text-sm">Add movies from the right panel</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedFeatured.map((movie: any, index: number) => (
                                <div
                                    key={movie._id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={() => handleDrop(index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-3 p-3 bg-stadium-dark rounded-xl border transition-all group cursor-grab active:cursor-grabbing ${
                                        dragOverIndex === index
                                            ? "border-accent-green bg-accent-green/10"
                                            : draggedIndex === index
                                            ? "border-accent-green/50 opacity-50"
                                            : "border-border-subtle"
                                    }`}
                                >
                                    {/* Drag Handle */}
                                    <GripVertical size={18} className="text-text-muted" />

                                    {/* Order Controls */}
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            onClick={() => moveUp(movie, index)}
                                            disabled={index === 0 || saving === movie._id}
                                            className="p-0.5 hover:bg-stadium-hover rounded disabled:opacity-30"
                                        >
                                            <ArrowUp size={12} />
                                        </button>
                                        <button
                                            onClick={() => moveDown(movie, index)}
                                            disabled={index === sortedFeatured.length - 1 || saving === movie._id}
                                            className="p-0.5 hover:bg-stadium-hover rounded disabled:opacity-30"
                                        >
                                            <ArrowDown size={12} />
                                        </button>
                                    </div>

                                    {/* Position Number */}
                                    <div className="w-7 h-7 bg-accent-green text-black rounded-lg flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>

                                    {/* Poster */}
                                    <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0">
                                        {movie.posterUrl ? (
                                            <Image
                                                src={movie.posterUrl}
                                                alt={movie.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-stadium-hover flex items-center justify-center">
                                                <Film size={14} className="text-text-muted" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{movie.titleSomali || movie.title}</p>
                                        <p className="text-xs text-text-muted">{movie.releaseDate?.split("-")[0]}</p>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeFromHero(movie)}
                                        disabled={saving === movie._id}
                                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {saving === movie._id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <X size={16} />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-text-muted mt-4">
                        Drag and drop to reorder, or use arrow buttons
                    </p>
                </div>

                {/* Add Movies */}
                <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                    <h2 className="font-bold text-lg mb-4">Add Movies to Hero</h2>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search movies by title..."
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-sm focus:border-accent-green focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Results count */}
                    <p className="text-xs text-text-muted mb-3">
                        {availableMovies.length} movies available
                        {searchQuery && ` matching "${searchQuery}"`}
                    </p>

                    {/* Movie List */}
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {availableMovies.length === 0 ? (
                            <p className="text-center text-text-muted py-8 text-sm">
                                {searchQuery ? "No movies found" : "All published movies are in hero"}
                            </p>
                        ) : (
                            availableMovies.map((movie: any) => (
                                <div
                                    key={movie._id}
                                    className={`flex items-center gap-3 p-3 bg-stadium-dark hover:bg-stadium-hover rounded-xl border border-border-subtle transition-colors ${
                                        sortedFeatured.length >= MAX_HERO_SLIDES ? "opacity-50" : "cursor-pointer"
                                    }`}
                                    onClick={() => addToHero(movie)}
                                >
                                    {/* Poster */}
                                    <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0">
                                        {movie.posterUrl ? (
                                            <Image
                                                src={movie.posterUrl}
                                                alt={movie.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-stadium-hover flex items-center justify-center">
                                                <Film size={14} className="text-text-muted" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{movie.titleSomali || movie.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-text-muted">
                                            <span>{movie.releaseDate?.split("-")[0]}</span>
                                            {movie.rating && (
                                                <span className="flex items-center gap-0.5">
                                                    <Star size={10} className="text-yellow-400" fill="currentColor" />
                                                    {movie.rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add Button */}
                                    {sortedFeatured.length < MAX_HERO_SLIDES && (
                                        <button
                                            disabled={saving === movie._id}
                                            className="p-2 bg-accent-green/20 hover:bg-accent-green/30 text-accent-green rounded-lg"
                                        >
                                            {saving === movie._id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Plus size={16} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h3 className="font-bold text-blue-400 mb-2">How Hero Slider Works</h3>
                <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Movies added here appear in the homepage hero slider</li>
                    <li>• Maximum {MAX_HERO_SLIDES} slides for optimal performance</li>
                    <li>• Drag and drop or use arrows to reorder (first = most prominent)</li>
                    <li>• Movies need poster and backdrop images for best display</li>
                    <li>• Search to quickly find and add specific movies</li>
                </ul>
            </div>
        </div>
    );
}
