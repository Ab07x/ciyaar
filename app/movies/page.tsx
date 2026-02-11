"use client";

import useSWR from "swr";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { MoviePosterImage } from "@/components/MoviePosterImage";
import { useUser } from "@/providers/UserProvider";
import { useState, Suspense } from "react";
import { Film, Crown, Star, Play, Lock, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import PremiumBannerNew from "@/components/PremiumBannerNew";
import { useSearchParams } from "next/navigation";
import { SectionLoader } from "@/components/ui/LoadingSpinner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const ITEMS_PER_PAGE = 35;

function MoviesContent() {
    const { data: moviesData } = useSWR("/api/movies?isPublished=true&pageSize=1000", fetcher);
    const movies = moviesData?.movies || moviesData || [];
    const { isPremium } = useUser();
    const searchParams = useSearchParams();

    const [filter, setFilter] = useState<"all" | "dubbed" | "premium">("all");
    const [genreFilter, setGenreFilter] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const categoryParam = searchParams.get("category");

    if (!moviesData) {
        return <SectionLoader />;
    }

    const allGenres = Array.from(new Set(movies.flatMap((m: any) => m.genres || []))).slice(0, 10);

    let filteredMovies = [...movies];

    if (categoryParam) {
        filteredMovies = filteredMovies.filter((m: any) => m.category === categoryParam);
    }

    if (filter === "dubbed") {
        filteredMovies = filteredMovies.filter((m: any) => m.isDubbed);
    } else if (filter === "premium") {
        filteredMovies = filteredMovies.filter((m: any) => m.isPremium);
    }
    if (genreFilter) {
        filteredMovies = filteredMovies.filter((m: any) => m.genres?.includes(genreFilter));
    }

    const totalItems = filteredMovies.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedMovies = filteredMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
                <section className="relative py-12 md:py-16 overflow-hidden border-b border-[#1a3a5c]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#E50914]/5 via-transparent to-transparent" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Film size={24} className="text-[#E50914]" />
                            <span className="text-[#E50914] font-bold uppercase">
                                {categoryParam ? categoryParam.replace(/-/g, " ") : "Filimada"}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">
                            Daawo <span className="text-[#E50914]">Filimada</span> Cusub
                        </h1>
                        <p className="text-text-secondary">
                            {totalItems} filim la helay
                        </p>
                    </div>
                </section>

                {!isPremium && <PremiumBannerNew className="my-6" />}

                <div className="container mx-auto px-4 pb-16">
                    <AdSlot slotKey="movies_top" className="mb-8" />

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
                                            ? "bg-[#E50914] text-white"
                                            : "text-text-secondary hover:text-white"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <Filter size={16} className="text-text-muted" />
                            {allGenres.map((genre: any) => (
                                <button
                                    key={genre}
                                    onClick={() => handleGenreChange(genreFilter === genre ? null : genre)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                                        genreFilter === genre
                                            ? "bg-[#E50914] text-white"
                                            : "bg-[#1a3a5c] text-text-muted hover:text-white"
                                    )}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
                        {paginatedMovies.map((movie: any) => {
                            const isLocked = movie.isPremium && !isPremium;
                            return (
                                <Link
                                    key={movie._id}
                                    href={`/movies/${movie.slug}-af-somali`}
                                    className="group relative rounded-lg overflow-hidden bg-[#1a3a5c] border border-[#2a4a6c] hover:border-[#E50914]/50 transition-all"
                                >
                                    <div className="relative aspect-[2/3]">
                                        <MoviePosterImage
                                            src={movie.posterUrl}
                                            alt={movie.title}
                                            className="group-hover:scale-105 transition-transform duration-500"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

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

                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            {movie.isPremium && (
                                                <div className="flex items-center gap-1 bg-[#E50914] px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
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

                                        {movie.rating && movie.rating > 0 && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#1a3a5c]/90 px-1.5 py-0.5 rounded">
                                                <Star size={10} className="text-[#E50914]" fill="currentColor" />
                                                <span className="text-[10px] font-bold">{movie.rating.toFixed(1)}</span>
                                            </div>
                                        )}

                                        <div className="absolute bottom-12 left-2 bg-[#1a3a5c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            HD
                                        </div>

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

                    {totalPages > 1 && (
                        <div className="mt-12">
                            <div className="flex justify-center items-center gap-1.5 flex-wrap">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg bg-[#1a3a5c] border border-[#2a4a6c] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a4a6c]"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[36px] px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === page
                                            ? "bg-[#E50914] text-white scale-110 shadow-lg"
                                            : "bg-[#1a3a5c] border border-[#2a4a6c] hover:bg-[#2a4a6c] text-gray-300"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg bg-[#1a3a5c] border border-[#2a4a6c] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a4a6c]"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <p className="text-center text-text-muted text-sm mt-4">
                                Page {currentPage} of {totalPages}
                            </p>
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

export default function MoviesPage() {
    return (
        <Suspense fallback={<SectionLoader minHeight="100vh" />}>
            <MoviesContent />
        </Suspense>
    );
}
