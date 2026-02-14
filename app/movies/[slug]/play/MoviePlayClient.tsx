"use client";

import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Play,
    Star,
    Download,
    AlertCircle,
    ChevronLeft,
} from "lucide-react";
import { MyListButton } from "@/components/MyListButton";
import { StreamPlayer } from "@/components/StreamPlayer";
import { PremiumAdInterstitial } from "@/components/PremiumAdInterstitial";
import { PPVUnlockGate } from "@/components/PPVUnlockGate";
import PremiumBannerNew from "@/components/PremiumBannerNew";
import { RamadanBanner } from "@/components/RamadanBanner";
import { optimizeImageUrl } from "@/components/MoviePosterImage";

interface MoviePlayClientProps {
    slug: string;
    preloadedMovie?: any;
    preloadedSettings?: any;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const DEFAULT_FREE_MOVIE_PREVIEW_MINUTES = 26;
const DEFAULT_FREE_MOVIE_TIMER_SPEED_MULTIPLIER = 12;

export default function MoviePlayClient({ slug, preloadedMovie, preloadedSettings }: MoviePlayClientProps) {
    const { data: movieResult } = useSWR(`/api/movies?slug=${slug}`, fetcher);
    const movie = movieResult || preloadedMovie;

    const { data: settingsResult } = useSWR("/api/settings", fetcher);
    const settings = settingsResult || preloadedSettings;

    const { data: similarContent } = useSWR(
        slug ? `/api/movies/related?slug=${slug}&limit=10` : null,
        fetcher
    );

    const { isPremium, userId } = useUser();

    // PPV Access Check
    const { data: ppvAccess } = useSWR(
        userId ? `/api/data?type=ppv-check&userId=${userId}&contentType=movie&contentId=${slug}` : null,
        fetcher
    );

    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const [showInterstitial, setShowInterstitial] = useState(true);
    const [adCompleted, setAdCompleted] = useState(false);

    const isUnlocked = !movie?.isPremium || isPremium;
    const isPreviewMode = !!movie?.isPremium && !isPremium;
    const freePreviewMinutesRaw = Number(settings?.freeMoviePreviewMinutes);
    const freePreviewMinutes = Number.isFinite(freePreviewMinutesRaw) && freePreviewMinutesRaw > 0
        ? Math.min(DEFAULT_FREE_MOVIE_PREVIEW_MINUTES, freePreviewMinutesRaw)
        : DEFAULT_FREE_MOVIE_PREVIEW_MINUTES;
    const freeTimerSpeedMultiplierRaw = Number(settings?.freeMovieTimerSpeedMultiplier);
    const freeTimerSpeedMultiplier = Number.isFinite(freeTimerSpeedMultiplierRaw) && freeTimerSpeedMultiplierRaw > 0
        ? Math.max(DEFAULT_FREE_MOVIE_TIMER_SPEED_MULTIPLIER, freeTimerSpeedMultiplierRaw)
        : DEFAULT_FREE_MOVIE_TIMER_SPEED_MULTIPLIER;
    const effectiveEmbedIndex = activeEmbedIndex;
    const effectiveEmbed = movie?.embeds?.[effectiveEmbedIndex];
    const pricingHref = `/pricing?src=movie-preview&content=movie&id=${encodeURIComponent(slug)}`;

    if (!movie || !settings) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-[#020D18]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E50914]"></div>
            </div>
        );
    }

    // Show interstitial ad for non-premium users
    if (!isPremium && !isPreviewMode && showInterstitial && !adCompleted) {
        return (
            <PremiumAdInterstitial
                movieTitle={movie.title}
                duration={10}
                onComplete={() => {
                    setAdCompleted(true);
                    setShowInterstitial(false);
                }}
            />
        );
    }

    const relatedMovies = Array.isArray(similarContent) ? similarContent : [];

    return (
        <div className="min-h-screen bg-[#020D18]">
            {/* Ad Banner */}
            <PremiumBannerNew />

            {/* Title */}
            <div className="max-w-7xl mx-auto px-4 mb-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/movies/${slug}`}
                        className="p-2 bg-[#333333] hover:bg-[#2a4a6c] rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} className="text-white" />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">
                            {movie.titleSomali || movie.title}
                            <span className="text-[#E50914] ml-2">({movie.releaseDate?.split("-")[0]})</span>
                        </h1>
                        {movie.titleSomali && (
                            <p className="text-gray-400 text-sm">{movie.title}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Video Player */}
            <div className="max-w-7xl mx-auto px-4 mb-6">
                {/* PPV Gate */}
                {ppvAccess?.isPPV && !ppvAccess?.hasAccess ? (
                    <PPVUnlockGate
                        contentType="movie"
                        contentId={slug}
                        contentTitle={movie.titleSomali || movie.title}
                    >
                        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-4 border-[#333333]">
                            {effectiveEmbed?.url ? (
                                <StreamPlayer
                                    source={{
                                        url: effectiveEmbed.url,
                                        type: (effectiveEmbed as any).type || "auto",
                                        isProtected: (effectiveEmbed as any).isProtected
                                    }}
                                    poster={movie.backdropUrl || movie.posterUrl}
                                    className="absolute inset-0"
                                    trackParams={{
                                        contentType: "movie",
                                        contentId: slug,
                                        duration: movie.runtime ? movie.runtime * 60 : undefined
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                    <AlertCircle size={48} />
                                </div>
                            )}
                        </div>
                    </PPVUnlockGate>
                ) : effectiveEmbed?.url ? (
                    /* Video Player */
                    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-[#333333]">
                        <StreamPlayer
                            source={{
                                url: effectiveEmbed.url,
                                type: (effectiveEmbed as any).type || "auto",
                                isProtected: (effectiveEmbed as any).isProtected
                            }}
                            poster={movie.backdropUrl || movie.posterUrl}
                            className="absolute inset-0"
                            trackParams={{
                                contentType: "movie",
                                contentId: slug,
                                duration: movie.runtime ? movie.runtime * 60 : undefined
                            }}
                            conversionGate={{
                                enabled: isPreviewMode,
                                previewSeconds: freePreviewMinutes * 60,
                                reachedDailyLimit: false,
                                timerSpeedMultiplier: freeTimerSpeedMultiplier,
                                ctaHref: pricingHref,
                                forceRedirectOnLock: false,
                                contentLabel: movie.titleSomali || movie.title,
                            }}
                        />
                    </div>
                ) : (
                    /* No Embed */
                    <div className="relative w-full aspect-video bg-black rounded-2xl flex items-center justify-center border-4 border-[#333333]">
                        <div className="text-center">
                            <AlertCircle size={48} className="mx-auto text-gray-500 mb-2" />
                            <p className="text-gray-400">Lama hayo embed links</p>
                        </div>
                    </div>
                )}

                {/* Server Switcher */}
                {(isUnlocked || isPreviewMode) && movie.embeds?.length > 1 && (
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {movie.embeds.map((embed: any, i: number) => {
                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setActiveEmbedIndex(i);
                                    }}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${effectiveEmbedIndex === i
                                        ? "bg-[#9AE600] text-black border-[#9AE600]"
                                        : "bg-[#333333] text-white border-[#2a4a6c] hover:border-[#E50914]"
                                        }`}
                                >
                                    {embed.label} {embed.quality && `(${embed.quality})`}
                                </button>
                            );
                        })}
                    </div>
                )}

                {isPreviewMode && (
                    <p className="text-center text-xs text-yellow-300 mt-3">
                        Free Preview: {freePreviewMinutes} daqiiqo • Timer x{freeTimerSpeedMultiplier}
                    </p>
                )}

                {/* Ramadan Banner below player */}
                <RamadanBanner variant="player" className="mt-3" />
            </div>

            {!isPreviewMode && (
                <>
                    {/* Action Buttons */}
                    <div className="max-w-7xl mx-auto px-4 mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

                            <MyListButton
                                contentType="movie"
                                contentId={slug}
                                className="h-12 bg-[#333333] hover:bg-[#2a4a6c] text-white rounded-lg font-bold border-none"
                            />

                            <MyListButton
                                contentType="movie"
                                contentId={slug}
                                className="h-12 bg-[#9AE600] hover:bg-[#8AD500] text-black rounded-lg font-bold border-none"
                                variant="icon"
                            />
                        </div>
                    </div>

                    {/* You May Also Like */}
                    {relatedMovies.length > 0 && (
                        <div className="max-w-7xl mx-auto px-4 pb-12">
                            <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-wider">You May Also Like:</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {relatedMovies.slice(0, 5).map((item: any) => (
                                    <Link
                                        key={item._id || item.slug}
                                        href={`/movies/${item.slug}`}
                                        className="group block"
                                    >
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#333333] mb-2">
                                            {item.posterUrl ? (
                                                <Image
                                                    src={optimizeImageUrl(item.posterUrl, "poster") || item.posterUrl}
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
                                            {item.rating && (
                                                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Star size={10} className="text-[#E50914]" fill="currentColor" />
                                                    {item.rating.toFixed(1)}
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 left-2 bg-[#333333] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                HD
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <div className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-2 py-1 md:px-4 md:py-2 rounded-full flex items-center gap-1 md:gap-2 text-xs md:text-sm shadow-lg transform scale-100 md:scale-90 md:group-hover:scale-100 transition-transform">
                                                    Daawo NOW
                                                    <Play size={14} className="md:w-4 md:h-4" fill="currentColor" />
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

                    {/* Report Issue */}
                    <div className="max-w-7xl mx-auto px-4 pb-8">
                        <p className="text-center text-gray-500 text-sm">
                            <a href="#" className="hover:text-[#E50914] transition-colors">REPORT AN ISSUE</a>
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
