"use client";

import { useState } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { TVMovie, TVMovieCard } from "@/components/tv/TVMovieCard";
import { Search, X } from "lucide-react";
import Image from "next/image";

type MovieListResponse = TVMovie[] | { movies?: TVMovie[] };

export default function TVSearchPage() {
    const { isPremium } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: moviesResponse } = useSWR<MovieListResponse>("/api/movies?isPublished=true&limit=100", fetcher);

    const movies = Array.isArray(moviesResponse) ? moviesResponse : (moviesResponse?.movies || []);

    const filteredMovies = movies.filter((movie) =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.titleSomali?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative h-screen overflow-hidden bg-black text-white">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/bgcdn.webp"
                    alt="Background"
                    fill
                    className="object-cover opacity-20"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
            </div>

            {/* Main Content */}
            <main className="relative z-10 h-full overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Search Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-black mb-6">Search</h1>

                        {/* Search Input */}
                        <div className="relative max-w-3xl">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for movies, series..."
                                className="w-full bg-zinc-900/80 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 text-xl focus:outline-none focus:ring-4 focus:ring-red-600 transition-all"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    {searchQuery ? (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">
                                {filteredMovies?.length || 0} Results
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {filteredMovies?.map((movie) => (
                                    <TVMovieCard key={movie._id} movie={movie} isPremium={isPremium || false} />
                                ))}
                            </div>
                            {filteredMovies?.length === 0 && (
                                <div className="text-center py-20 text-white/50">
                                    <Search size={64} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-xl">No results found for &quot;{searchQuery}&quot;</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-white/50">
                            <Search size={64} className="mx-auto mb-4 opacity-30" />
                            <p className="text-xl">Start typing to search...</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
