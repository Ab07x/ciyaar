"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { useUser } from "@/providers/UserProvider";
import { useState } from "react";
import { Film, Crown, Star, Play, Lock, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import PremiumBannerNew from "@/components/PremiumBannerNew";
import { useSearchParams } from "next/navigation";

const ITEMS_PER_PAGE = 35; // 7x5

export default function MoviesPage() {
    const movies = useQuery(api.movies.listMovies, { isPublished: true });
    const { isPremium } = useUser();
    const searchParams = useSearchParams();

    const [filter, setFilter] = useState<"all" | "dubbed" | "premium">("all");
    const [genreFilter, setGenreFilter] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Check for category from URL
    const categoryParam = searchParams.get("category");

    if (!movies) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-[#0d1b2a]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f0ad4e]"></div>
            </div>
        );
    }

    // Get unique genres
    const allGenres = Array.from(new Set(movies.flatMap((m) => m.genres))).slice(0, 10);

    // Filter movies
    let filteredMovies = movies;

    // Category filter from URL
    if (categoryParam) {
        filteredMovies = filteredMovies.filter((m) => m.category === categoryParam);
    }

    if (filter === "dubbed") {
        filteredMovies = filteredMovies.filter((m) => m.isDubbed);
    } else if (filter === "premium") {
        filteredMovies = filteredMovies.filter((m) => m.isPremium);
    }
    if (genreFilter) {
        filteredMovies = filteredMovies.filter((m) => m.genres.includes(genreFilter));
    }

    // Pagination
    const totalItems = filteredMovies.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedMovies = filteredMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset page when filter changes
    const handleFilterChange = (newFilter: typeof filter) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const handleGenreChange = (genre: string | null) => {
        setGenreFilter(genre);
        setCurrentPage(1);
    };

    return (
        <div className="relative min-h-screen bg-[#0d1b2a]">
            <main className="relative z-10">
                {/* Hero */}
                <section className="relative py-12 md:py-16 overflow-hidden border-b border-[#1a3a5c]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#f0ad4e]/5 via-transparent to-transparent" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Film size={24} className="text-[#f0ad4e]" />
                            <span className="text-[#f0ad4e] font-bold uppercase">
                                {categoryParam ? categoryParam.replace(/-/g, " ") : "Filimada"}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">
                            Daawo <span className="text-[#f0ad4e]">Filimada</span> Cusub
                        </h1>
                        <p className="text-text-secondary">
                            {totalItems} filim la helay
                        </p>
                    </div>
                </section>

                {/* Premium Promo Banner */}
                {!isPremium && <PremiumBannerNew className="my-6" />}

                <div className="container mx-auto px-4 pb-16">
                    <AdSlot slotKey="movies_top" className="mb-8" />

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-8 p-4 bg-[#1b2838] rounded-xl border border-[#1a3a5c]">
                        <div className="flex gap-2 p-1 bg-[#1a3a5c] rounded-lg">
                            {[
                                { id: "all", label: "Dhammaan" },
                                { id: "dubbed", label: "Af-Somali" },
                                { id: "premium", label: "Premium" },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => handleFilterChange(f.id as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                                        filter === f.id
                                            ? "bg-[#f0ad4e] text-black"
                                            : "text-text-secondary hover:text-white"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Genre filter */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <Filter size={16} className="text-text-muted" />
                            {allGenres.map((genre) => (
                                <button
                                    key={genre}
                                    onClick={() => handleGenreChange(genreFilter === genre ? null : genre)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                                        genreFilter === genre
                                            ? "bg-[#f0ad4e] text-black"
                                            : "bg-[#1a3a5c] text-text-muted hover:text-white"
                                    )}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Movies Grid - 7 columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                        {paginatedMovies.map((movie) => {
                            const isLocked = movie.isPremium && !isPremium;
                            return (
                                <Link
                                    key={movie._id}
                                    href={`/movies/${movie.slug}`}
                                    className="group relative rounded-lg overflow-hidden bg-[#1a3a5c] border border-[#2a4a6c] hover:border-[#f0ad4e]/50 transition-all"
                                >
                                    <div className="relative aspect-[2/3]">
                                        {movie.posterUrl ? (
                                            <img
                                                src={movie.posterUrl}
                                                alt={movie.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#0d1b2a] flex items-center justify-center">
                                                <Film size={48} className="text-text-muted/30" />
                                            </div>
                                        )}

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                        {/* Play button - DAAWO NOW on hover */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isLocked ? (
                                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                                                    <Lock size={24} className="text-white" />
                                                </div>
                                            ) : (
                                                <div className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-lg">
                                                    Daawo NOW
                                                    <Play size={16} fill="currentColor" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Badges */}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            {movie.isPremium && (
                                                <div className="flex items-center gap-1 bg-yellow-500 px-1.5 py-0.5 rounded text-[10px] font-bold text-black">
                                                    <Crown size={8} />
                                                    VIP
                                                </div>
                                            )}
                                            {movie.isDubbed && (
                                                <div className="bg-[#9AE600] px-1.5 py-0.5 rounded text-[10px] font-bold text-black">
                                                    AF-SOMALI
                                                </div>
                                            )}
                                        </div>

                                        {/* Rating */}
                                        {movie.rating && movie.rating > 0 && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#1a3a5c]/90 px-1.5 py-0.5 rounded">
                                                <Star size={10} className="text-yellow-400" fill="currentColor" />
                                                <span className="text-[10px] font-bold">{movie.rating.toFixed(1)}</span>
                                            </div>
                                        )}

                                        {/* HD Badge */}
                                        <div className="absolute bottom-12 left-2 bg-[#1a3a5c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            HD
                                        </div>

                                        {/* Title at bottom */}
                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                            <h3 className="font-bold text-xs line-clamp-2">
                                                {movie.titleSomali || movie.title}
                                            </h3>
                                            <span className="text-[10px] text-gray-400">
                                                {movie.releaseDate?.split("-")[0]}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t border-[#1a3a5c]">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-[#1a3a5c] border border-[#2a4a6c] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a4a6c]"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="flex gap-1">
                                {currentPage > 3 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            className="px-3 py-1 rounded-lg bg-[#1a3a5c] border border-[#2a4a6c] hover:bg-[#2a4a6c] text-sm"
                                        >
                                            1
                                        </button>
                                        {currentPage > 4 && <span className="px-2 text-text-muted">...</span>}
                                    </>
                                )}

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                                    .map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 rounded-lg text-sm ${currentPage === page
                                                ? "bg-[#f0ad4e] text-black font-bold"
                                                : "bg-[#1a3a5c] border border-[#2a4a6c] hover:bg-[#2a4a6c]"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                {currentPage < totalPages - 2 && (
                                    <>
                                        {currentPage < totalPages - 3 && <span className="px-2 text-text-muted">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="px-3 py-1 rounded-lg bg-[#1a3a5c] border border-[#2a4a6c] hover:bg-[#2a4a6c] text-sm"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg bg-[#1a3a5c] border border-[#2a4a6c] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a4a6c]"
                            >
                                <ChevronRight size={18} />
                            </button>

                            <span className="ml-4 text-sm text-text-muted">
                                Page {currentPage} / {totalPages}
                            </span>
                        </div>
                    )}

                    {filteredMovies.length === 0 && (
                        <div className="text-center py-16">
                            <Film size={64} className="mx-auto mb-4 text-text-muted/30" />
                            <p className="text-text-muted">Ma jiraan filimo la mid ah filter-kaaga.</p>
                        </div>
                    )}

                    <AdSlot slotKey="movies_bottom" className="mt-12" />
                </div>
            </main>
        </div>
    );
}
