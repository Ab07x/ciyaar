"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
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

export default function HeroAdminPage() {
    const allMovies = useQuery(api.movies.listMovies, { isPublished: true, limit: 100 });
    const featuredMovies = useQuery(api.movies.getFeaturedMovies);
    const updateMovie = useMutation(api.movies.updateMovie);

    const [searchQuery, setSearchQuery] = useState("");
    const [saving, setSaving] = useState<string | null>(null);

    // Filter movies for search
    const availableMovies = (allMovies || []).filter((m: any) =>
        !m.isFeatured &&
        (m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         m.titleSomali?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Add movie to hero
    const addToHero = async (movie: any) => {
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

    // Move movie up in order
    const moveUp = async (movie: any, index: number) => {
        if (index === 0) return;
        const sorted = [...(featuredMovies || [])].sort((a: any, b: any) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
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
        const sorted = [...(featuredMovies || [])].sort((a: any, b: any) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
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
                        <p className="text-text-muted text-sm">Manage homepage featured movies (max 8 slides)</p>
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
                        <h2 className="font-bold text-lg">Current Hero Slides ({sortedFeatured.length}/8)</h2>
                        {sortedFeatured.length >= 8 && (
                            <span className="text-xs text-yellow-500">Max reached</span>
                        )}
                    </div>

                    {sortedFeatured.length === 0 ? (
                        <div className="text-center py-12 text-text-muted">
                            <Film size={48} className="mx-auto mb-3 opacity-30" />
                            <p>No movies in hero slider</p>
                            <p className="text-sm">Add movies from the right panel</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedFeatured.map((movie: any, index: number) => (
                                <div
                                    key={movie._id}
                                    className="flex items-center gap-3 p-3 bg-stadium-dark rounded-xl border border-border-subtle group"
                                >
                                    {/* Order Controls */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveUp(movie, index)}
                                            disabled={index === 0 || saving === movie._id}
                                            className="p-1 hover:bg-stadium-hover rounded disabled:opacity-30"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => moveDown(movie, index)}
                                            disabled={index === sortedFeatured.length - 1 || saving === movie._id}
                                            className="p-1 hover:bg-stadium-hover rounded disabled:opacity-30"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                    </div>

                                    {/* Position Number */}
                                    <div className="w-8 h-8 bg-accent-green text-black rounded-lg flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>

                                    {/* Poster */}
                                    <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
                                        {movie.posterUrl ? (
                                            <Image
                                                src={movie.posterUrl}
                                                alt={movie.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-stadium-hover flex items-center justify-center">
                                                <Film size={16} className="text-text-muted" />
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
                            placeholder="Search movies..."
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-sm"
                        />
                    </div>

                    {/* Movie List */}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {availableMovies.length === 0 ? (
                            <p className="text-center text-text-muted py-8 text-sm">
                                {searchQuery ? "No movies found" : "All published movies are in hero"}
                            </p>
                        ) : (
                            availableMovies.slice(0, 20).map((movie: any) => (
                                <div
                                    key={movie._id}
                                    className="flex items-center gap-3 p-3 bg-stadium-dark hover:bg-stadium-hover rounded-xl border border-border-subtle cursor-pointer transition-colors"
                                    onClick={() => sortedFeatured.length < 8 && addToHero(movie)}
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
                                    {sortedFeatured.length < 8 && (
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
                    <li>• Movies added here will appear in the homepage hero slider</li>
                    <li>• Maximum 8 slides for optimal performance</li>
                    <li>• Use arrows to reorder slides (first = most prominent)</li>
                    <li>• Movies need poster and backdrop images for best display</li>
                    <li>• Slider auto-advances every 6 seconds</li>
                </ul>
            </div>
        </div>
    );
}
