
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import { TVMovieCard } from "@/components/tv/TVMovieCard";
import { Tv, Search, User, LogOut, Home, PlayCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function TVPage() {
    const searchParams = useSearchParams();
    const isGuest = searchParams.get("guest") === "true";
    const { userId, isPremium } = useUser();
    const movies = useQuery(api.movies.listMovies, { isPublished: true, limit: 50 });
    const [activeCategory, setActiveCategory] = useState("all");

    // D-pad navigation helper could go here, but relying on native focus for now

    if (!movies) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    const featuredMovie = movies[0];

    return (
        <div className="relative flex h-screen overflow-hidden bg-black text-white">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/bgcdn.webp"
                    alt="Background"
                    fill
                    className="object-cover opacity-30"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            {/* Sidebar Navigation */}
            <nav className="relative w-24 flex-shrink-0 bg-zinc-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-8 z-50">
                <div className="mb-10">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <Tv size={24} className="text-white" />
                    </div>
                </div>

                <div className="flex-1 space-y-8 w-full flex flex-col items-center">
                    <NavLink href="/tv" icon={<Home size={28} />} label="Home" active />
                    <NavLink href="/tv/search" icon={<Search size={28} />} label="Search" />
                    <NavLink href="/tv/live" icon={<PlayCircle size={28} />} label="Live" />
                    <NavLink href="/tv/profile" icon={<User size={28} />} label="Profile" />
                </div>

                <div className="mt-auto">
                    <button className="p-4 rounded-xl hover:bg-white/10 focus:bg-white/20 focus:outline-none transition-colors text-white/50 hover:text-white">
                        <LogOut size={24} />
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth">

                {/* Hero Section */}
                {featuredMovie && (
                    <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden mb-12 group focus-within:ring-4 focus-within:ring-white transition-all">
                        <Image
                            src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
                            alt={featuredMovie.title}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

                        <div className="absolute bottom-0 left-0 p-12 max-w-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                {featuredMovie.isPremium && (
                                    <span className="bg-yellow-500 text-black font-bold px-3 py-1 rounded text-sm">PREMIUM</span>
                                )}
                                <span className="text-white/80 font-medium">{new Date(featuredMovie.releaseDate).getFullYear()}</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">HD</span>
                            </div>
                            <h1 className="text-5xl font-black mb-4 leading-tight">
                                {featuredMovie.titleSomali || featuredMovie.title}
                            </h1>
                            <p className="text-lg text-white/70 line-clamp-2 mb-8">
                                {featuredMovie.overview}
                            </p>
                            <div className="flex gap-4">
                                <Link
                                    href={`/tv/movies/${featuredMovie.slug}`}
                                    className="bg-white text-black px-8 py-3 rounded-xl font-bold text-xl flex items-center gap-2 hover:bg-gray-200 focus:bg-red-600 focus:text-white focus:outline-none transition-colors"
                                >
                                    <Play fill="currentColor" /> Play Now
                                </Link>
                                <button className="bg-white/10 backdrop-blur px-8 py-3 rounded-xl font-bold text-xl hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors">
                                    More Info
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories / Rows */}
                <section className="space-y-10 pb-20">
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-white/90">Latest Movies</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {movies.slice(0, 10).map((movie) => (
                                <TVMovieCard key={movie._id} movie={movie} isPremium={isPremium || false} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-white/90">Trending Now</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {movies.slice(10, 20).map((movie) => (
                                <TVMovieCard key={movie._id} movie={movie} isPremium={isPremium || false} />
                            ))}
                        </div>
                    </div>
                </section>

            </main>

            {/* Login Overlay if needed */}
            {!userId && !isGuest && (
                <div className="absolute inset-0 bg-black/95 z-[100] flex items-center justify-center p-20">
                    <div className="flex gap-20 items-center max-w-5xl w-full">
                        <div className="flex-1 space-y-6">
                            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                Fanbroj TV
                            </h1>
                            <p className="text-3xl text-gray-400">
                                Scan to login with your phone
                            </p>
                            <div className="text-lg text-gray-500">
                                1. Open Camera on your phone<br />
                                2. Scan the QR code<br />
                                3. Start watching instantly
                            </div>
                            <Link
                                href="/tv?guest=true"
                                className="inline-block mt-4 px-8 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 focus:bg-white/20 focus:ring-2 focus:ring-white transition-colors"
                            >
                                Browse as Guest
                            </Link>
                        </div>
                        <div className="bg-white p-4 rounded-3xl">
                            {/* Placeholder QR Code */}
                            <div className="w-80 h-80 bg-gray-900 rounded-xl flex items-center justify-center">
                                <span className="text-gray-500">QR CODE</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
