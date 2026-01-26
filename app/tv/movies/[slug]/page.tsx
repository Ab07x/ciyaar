
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Play, Star, Clock, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/providers/UserProvider";

export default function TVMovieDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const movie = useQuery(api.movies.getMovieBySlug, { slug });
    const { isPremium } = useUser();

    if (!movie) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="relative h-screen bg-black text-white overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0">
                <Image
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover opacity-40"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="absolute top-12 left-12 z-50 flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 focus:bg-white/20 focus:ring-2 focus:ring-white transition-all text-lg font-bold"
            >
                <ArrowLeft /> Back
            </button>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center px-24 max-w-5xl">
                <div className="flex items-center gap-6 mb-6">
                    {movie.isPremium && (
                        <span className="px-4 py-1.5 bg-yellow-500 text-black font-black uppercase tracking-wider rounded text-sm">
                            Premium
                        </span>
                    )}
                    {movie.rating > 0 && (
                        <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
                            <Star fill="currentColor" />
                            {movie.rating.toFixed(1)}
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-white/60 font-bold text-xl">
                        <Calendar size={20} />
                        {new Date(movie.releaseDate).getFullYear()}
                    </div>
                </div>

                <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight tracking-tight">
                    {movie.titleSomali || movie.title}
                </h1>

                <div className="flex flex-wrap gap-3 mb-8">
                    {movie.genres?.map((genre) => (
                        <span key={genre} className="px-4 py-1.5 border border-white/20 rounded-full text-white/80 text-lg">
                            {genre}
                        </span>
                    ))}
                </div>

                <p className="text-2xl text-white/70 line-clamp-3 max-w-4xl mb-12 leading-relaxed">
                    {movie.overview}
                </p>

                <div className="flex gap-6">
                    <Link
                        href={`/movies/${movie.slug}`} // Assuming we rely on the main player for now, or we build a specific /tv/player/[slug]
                        className="flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-2xl transition-all hover:scale-105 focus:bg-white focus:text-black focus:ring-4 focus:ring-red-600 focus:outline-none"
                    >
                        <Play fill="currentColor" size={32} />
                        Play Now
                    </Link>

                    {/* Example of Trailer button if available */}
                    <button className="flex items-center gap-3 px-10 py-5 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-2xl font-bold text-2xl transition-all focus:bg-white/30 focus:ring-4 focus:ring-white focus:outline-none">
                        Trailer
                    </button>

                    {!isPremium && movie.isPremium && (
                        <div className="ml-6 flex items-center gap-4 text-yellow-500 font-bold text-xl animate-pulse">
                            <Crown />
                            Subscribe to watch
                        </div>
                    )}
                </div>
            </div>

            {/* Poster Preview on the right (optional, for visual balance) */}
            <div className="absolute right-24 top-1/2 -translate-y-1/2 w-[400px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 hidden xl:block">
                <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                />
            </div>
        </div>
    );
}

function Crown(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m2 4 3 12h14l3-12-6 7-4-3-4 3-6-7z" />
        </svg>
    )
}
