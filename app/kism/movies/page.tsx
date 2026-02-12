"use client";

import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Plus, Edit, Trash2, Film, Crown, Eye, Search, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const ITEMS_PER_PAGE = 35;

export default function AdminMoviesPage() {
    const { data: movieData } = useSWR("/api/movies?limit=500", fetcher);
    const movies = movieData?.movies || movieData || [];

    const [filter, setFilter] = useState<"all" | "published" | "draft" | "premium" | "dubbed">("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this movie?")) return;
        await fetch(`/api/movies?id=${id}`, { method: "DELETE" });
        mutate("/api/movies?limit=500");
    };

    const filtered = movies?.filter((m: any) => {
        if (filter === "published") return m.isPublished;
        if (filter === "draft") return !m.isPublished;
        if (filter === "premium") return m.isPremium;
        if (filter === "dubbed") return m.isDubbed;
        return true;
    }).filter((m: any) =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.titleSomali?.toLowerCase().includes(search.toLowerCase())
    );

    const totalItems = filtered?.length || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedMovies = filtered?.slice(startIndex, endIndex);

    const handleFilterChange = (newFilter: typeof filter) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">MOVIES</h1>
                    <p className="text-text-muted">Filimada – One-click TMDB import ({totalItems} total)</p>
                </div>
                <Link
                    href="/kism/movies/new"
                    className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Movie
                </Link>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {["all", "published", "draft", "premium", "dubbed"].map((f) => (
                        <button
                            key={f}
                            onClick={() => handleFilterChange(f as any)}
                            className={`px-3 py-1 rounded-full text-sm capitalize ${filter === f
                                ? "bg-accent-green text-black font-bold"
                                : "bg-stadium-hover text-text-secondary"
                                }`}
                        >
                            {f === "dubbed" ? "Af-Somali" : f}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search movies..."
                        className="w-full bg-stadium-elevated border border-border-subtle rounded-lg pl-10 pr-4 py-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                {paginatedMovies?.map((movie: any) => (
                    <div
                        key={movie._id}
                        className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden group"
                    >
                        <div className="relative aspect-[2/3]">
                            {movie.posterUrl ? (
                                <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-stadium-dark flex items-center justify-center">
                                    <Film size={48} className="text-text-muted/30" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Link href={`/kism/movies/${movie._id}`} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                                    <Edit size={18} />
                                </Link>
                                <button onClick={() => handleDelete(movie._id)} className="p-2 bg-accent-red/50 rounded-lg hover:bg-accent-red">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {movie.isPremium && (
                                    <div className="flex items-center gap-1 bg-accent-gold px-2 py-0.5 rounded text-xs font-bold text-black">
                                        <Crown size={10} /> PREMIUM
                                    </div>
                                )}
                                {movie.isDubbed && (
                                    <div className="bg-accent-green px-2 py-0.5 rounded text-xs font-bold text-black border border-black/10">
                                        AF-SOMALI
                                    </div>
                                )}
                                {movie.isTop10 && (
                                    <div className="bg-red-600 px-2 py-0.5 rounded text-xs font-bold text-white border border-white/20">
                                        TOP {movie.top10Order || "?"}
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-2 right-2">
                                {movie.isPublished ? (
                                    <div className="w-6 h-6 bg-accent-green rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-black" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 bg-text-muted rounded-full flex items-center justify-center">
                                        <X size={14} className="text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-3">
                            <h3 className="font-bold text-sm truncate">{movie.titleSomali || movie.title}</h3>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-text-muted">{movie.releaseDate?.split("-")[0]}</span>
                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <Eye size={12} /> {movie.views || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 border-t border-border-subtle">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-stadium-elevated border border-border-subtle disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stadium-hover">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex gap-1">
                        {currentPage > 3 && (
                            <>
                                <button onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded-lg bg-stadium-elevated border border-border-subtle hover:bg-stadium-hover text-sm">1</button>
                                {currentPage > 4 && <span className="px-2 text-text-muted">...</span>}
                            </>
                        )}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                            .map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded-lg text-sm ${currentPage === page ? "bg-accent-green text-black font-bold" : "bg-stadium-elevated border border-border-subtle hover:bg-stadium-hover"}`}>
                                    {page}
                                </button>
                            ))}
                        {currentPage < totalPages - 2 && (
                            <>
                                {currentPage < totalPages - 3 && <span className="px-2 text-text-muted">...</span>}
                                <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded-lg bg-stadium-elevated border border-border-subtle hover:bg-stadium-hover text-sm">
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-stadium-elevated border border-border-subtle disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stadium-hover">
                        <ChevronRight size={18} />
                    </button>
                    <span className="ml-4 text-sm text-text-muted">Page {currentPage} of {totalPages}</span>
                </div>
            )}

            {filtered?.length === 0 && (
                <div className="text-center py-12">
                    <Film size={48} className="mx-auto mb-4 text-text-muted/30" />
                    <p className="text-text-muted">Ma jiraan filimo. Ku dar mid cusub TMDB-ga.</p>
                </div>
            )}
        </div>
    );
}
