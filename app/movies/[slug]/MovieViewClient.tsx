"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoviePosterImage } from "@/components/MoviePosterImage";
import {
    Play,
    Star,
    Clock,
    Calendar,
    Youtube,
    Download,
    Heart,
    Plus,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { MyListButton } from "@/components/MyListButton";
import { ContentCarousel } from "@/components/ContentCarousel";
import PremiumBannerNew from "@/components/PremiumBannerNew";
import { generateMovieSchema } from "@/lib/seo/schema";

interface MovieViewClientProps {
    slug: string;
    preloadedMovie?: any;
}

export default function MovieViewClient({ slug, preloadedMovie }: MovieViewClientProps) {
    const movieResult = useQuery(api.movies.getMovieBySlug, { slug });
    const movie = movieResult || preloadedMovie;

    const similarContent = useQuery(api.recommendations.getSimilarContent, {
        contentId: slug,
        contentType: "movie",
        limit: 10
    });

    const incrementViews = useMutation(api.movies.incrementViews);
    const trackPageView = useMutation(api.analytics.trackPageView);
    const { isPremium } = useUser();

    const hasTracked = useRef(false);

    useEffect(() => {
        if (movie && "_id" in movie && !hasTracked.current) {
            hasTracked.current = true;
            incrementViews({ id: movie._id });
            trackPageView({ pageType: "movie", pageId: slug });
        }
    }, [movie?._id, incrementViews, trackPageView, slug]);

    if (!movie) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-[#020D18]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E50914]"></div>
            </div>
        );
    }

    const getTrailerId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div className="min-h-screen bg-[#020D18]">
            {/* Hero Section with Backdrop and Play Button */}
            <div className="relative">
                {/* Backdrop Image */}
                <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
                    <Image
                        src={movie.backdropUrl || movie.posterUrl}
                        alt={movie.title}
                        fill
                        priority
                        quality={85}
                        sizes="100vw"
                        className="object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020D18] via-[#020D18]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020D18]/80 via-transparent to-[#020D18]/80" />

                    {/* Play Button Overlay */}
                    <Link
                        href={`/movies/${slug}/play`}
                        className="absolute inset-0 flex items-center justify-center group"
                    >
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300 border-2 border-white/50">
                            <Play size={40} fill="white" className="text-white ml-2" />
                        </div>
                    </Link>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                            {movie.titleSomali || movie.title}
                            <span className="text-[#E50914] ml-2">({movie.releaseDate?.split("-")[0]})</span>
                        </h1>
                        {movie.rating && (
                            <div className="flex items-center gap-2">
                                <Star size={18} className="text-[#E50914]" fill="currentColor" />
                                <span className="text-white font-bold">{movie.rating.toFixed(1)}</span>
                                <span className="text-gray-400">/ 10</span>
                                {movie.runtime && (
                                    <>
                                        <span className="text-gray-500 mx-2">•</span>
                                        <Clock size={14} className="text-gray-400" />
                                        <span className="text-gray-400">{movie.runtime} min</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ad Banner */}
            <PremiumBannerNew />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left - Poster */}
                    <div className="lg:w-[300px] flex-shrink-0">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-4 border-white/10">
                            <MoviePosterImage
                                src={movie.posterUrl}
                                alt={movie.title}
                                priority
                                quality={85}
                                sizes="(max-width: 1024px) 50vw, 300px"
                            />
                            {movie.isPremium && (
                                <div className="absolute top-3 right-3 bg-[#E50914] text-white text-xs font-bold px-2 py-1 rounded">
                                    VIP
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right - Info */}
                    <div className="flex-1">
                        {/* Genres & Year & Runtime */}
                        <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
                            <span className="text-[#E50914] font-bold">{movie.releaseDate?.split("-")[0]}</span>
                            {movie.genres?.map((g: string) => (
                                <span key={g} className="px-2 py-1 bg-[#333333] text-white rounded">{g}</span>
                            ))}
                            {movie.runtime && (
                                <span className="text-gray-400 flex items-center gap-1">
                                    <Clock size={14} />
                                    {movie.runtime} min
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 leading-relaxed mb-6">
                            {movie.overviewSomali || movie.overview}
                        </p>

                        {/* Tags */}
                        {((movie.tags && movie.tags.length > 0) || (movie.seoKeywords && movie.seoKeywords.length > 0)) && (
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {movie.tags?.map((tag: string, i: number) => (
                                    <span key={`tag-${i}`} className="px-2 py-1 bg-blue-500/15 text-blue-400 text-xs rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Stars Section */}
                        {movie.cast && movie.cast.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-white font-bold mb-3">Stars:</h3>
                                <div className="flex flex-wrap gap-4">
                                    {movie.cast.slice(0, 5).map((c: any, i: number) => (
                                        <div key={i} className="flex flex-col items-center text-center w-16">
                                            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#333333] mb-1">
                                                {c.profileUrl ? (
                                                    <Image
                                                        src={c.profileUrl}
                                                        alt={c.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[#333333] flex items-center justify-center text-white font-bold">
                                                        {c.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 line-clamp-2">{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Director */}
                        {movie.director && (
                            <p className="text-sm text-gray-400 mb-6">
                                <span className="text-white font-bold">Director:</span> {movie.director}
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Buttons - Lookmovie Style */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                    {/* Trailer */}
                    {movie.trailerUrl ? (
                        <a
                            href={movie.trailerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Play size={18} fill="currentColor" />
                            TRAILER
                        </a>
                    ) : (
                        <div className="h-12 bg-red-600/50 text-white/50 rounded-lg font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                            <Play size={18} fill="currentColor" />
                            TRAILER
                        </div>
                    )}

                    {/* Download */}
                    {movie.downloadUrl ? (
                        <a
                            href={movie.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download size={18} />
                            DOWNLOAD
                        </a>
                    ) : (
                        <div className="h-12 bg-blue-600/50 text-white/50 rounded-lg font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                            <Download size={18} />
                            DOWNLOAD
                        </div>
                    )}

                    {/* Watch Later */}
                    <MyListButton
                        contentType="movie"
                        contentId={slug}
                        className="h-12 bg-[#333333] hover:bg-[#2a4a6c] text-white rounded-lg font-bold border-none"
                    />

                    {/* Play Button - Green */}
                    <Link
                        href={`/movies/${slug}/play`}
                        className="h-12 bg-[#9AE600] hover:bg-[#8AD500] text-black rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Play size={18} fill="currentColor" />
                        Daawo NOW
                    </Link>
                </div>

                {/* You May Also Like */}
                {similarContent && similarContent.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-wider">You May Also Like:</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {similarContent.slice(0, 5).map((item: any) => (
                                <Link
                                    key={item._id || item.slug}
                                    href={`/movies/${item.slug}`}
                                    className="group block"
                                >
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#333333] mb-2">
                                        {item.posterUrl ? (
                                            <Image
                                                src={item.posterUrl}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 640px) 50vw, 20vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <Play size={32} />
                                            </div>
                                        )}
                                        {/* Rating Badge */}
                                        {item.rating && (
                                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Star size={10} className="text-[#E50914]" fill="currentColor" />
                                                {item.rating.toFixed(1)}
                                            </div>
                                        )}
                                        {/* HD Badge */}
                                        <div className="absolute bottom-2 left-2 bg-[#333333] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            HD
                                        </div>
                                        {/* Hover Play */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-lg transform scale-90 group-hover:scale-110 transition-transform">
                                                Daawo NOW
                                                <Play size={16} fill="currentColor" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-white text-sm font-medium truncate">
                                        {item.titleSomali || item.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* JSON-LD Schema for Rich Snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(generateMovieSchema(movie))
                }}
            />
        </div>
    );
}
