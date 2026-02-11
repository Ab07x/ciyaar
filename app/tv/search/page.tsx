"use client";

import { useState } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { TVMovieCard } from "@/components/tv/TVMovieCard";
import { Tv, Search, User, LogOut, Home, PlayCircle, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function TVSearchPage() {
    const { userId, isPremium } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: movies } = useSWR("/api/movies?isPublished=true&limit=100", fetcher);

    const filteredMovies = movies?.filter((movie: any) =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.titleSomali?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative flex h-screen overflow-hidden bg-black text-white">
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

            {/* Sidebar Navigation */}
            <nav className="relative w-24 flex-shrink-0 bg-zinc-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-8 z-50">
                <div className="mb-10">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <Tv size={24} className="text-white" />
                    </div>
                </div>

                <div className="flex-1 space-y-8 w-full flex flex-col items-center">
                    <NavLink href="/tv" icon={<Home size={28} />} label="Home" />
                    <NavLink href="/tv/search" icon={<Search size={28} />} label="Search" active />
                    <NavLink href="/tv/live" icon={<PlayCircle size={28} />} label="Live" />
                    <NavLink href="/tv/profile" icon={<User size={28} />} label="Profile" />
                </div>

                <div className="mt-auto">
                    <button className="p-4 rounded-xl hover:bg-white/10 focus:bg-white/20 focus:outline-none transition-colors text-white/50 hover:text-white">
                        <LogOut size={24} />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex-1 overflow-y-auto p-8">
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
                                {filteredMovies?.map((movie: any) => (
                                    <TVMovieCard key={movie._id} movie={movie} isPremium={isPremium || false} />
                                ))}
                            </div>
                            {filteredMovies?.length === 0 && (
                                <div className="text-center py-20 text-white/50">
                                    <Search size={64} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-xl">No results found for "{searchQuery}"</p>
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

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-red-600 focus:bg-zinc-800 focus:scale-110 ${active ? 'bg-red-600/20 text-red-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
            {icon}
            <span className="text-[10px] mt-1 font-medium">{label}</span>
        </Link>
    );
}
