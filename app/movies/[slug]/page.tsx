"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { useState, useEffect } from "react";
import { AdSlot } from "@/components/AdSlot";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    Crown,
    Star,
    Clock,
    Calendar,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Youtube,
    Download,
    X,
} from "lucide-react";
import { MyListButton } from "@/components/MyListButton";
import { PremiumPromoBanner } from "@/components/PremiumPromoBanner";
import { PremiumAdInterstitial } from "@/components/PremiumAdInterstitial";
import { PremiumPopupBanner } from "@/components/PremiumPopupBanner";
import { MovieCard } from "@/components/MovieCard";
import { StreamPlayer } from "@/components/StreamPlayer";
import { PPVUnlockGate } from "@/components/PPVUnlockGate";
import { RatingSystem } from "@/components/RatingSystem";

export default function MovieWatchPage() {
    const params = useParams();
    const slug = params.slug as string;

    const movie = useQuery(api.movies.getMovieBySlug, { slug });
    const relatedMovies = useQuery(api.movies.getRelatedMovies, { slug, limit: 10 });
    const settings = useQuery(api.settings.getSettings);
    const incrementViews = useMutation(api.movies.incrementViews);
    const trackPageView = useMutation(api.analytics.trackPageView);
    const { isPremium, redeemCode, userId } = useUser();

    // PPV Access Check
    const ppvAccess = useQuery(
        api.ppv.checkAccess,
        { userId: userId || undefined, contentType: "movie", contentId: slug }
    );

    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [localUnlocked, setLocalUnlocked] = useState(false);
    const [showInterstitial, setShowInterstitial] = useState(true);
    const [adCompleted, setAdCompleted] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [showPremiumPopup, setShowPremiumPopup] = useState(false);

    const getTrailerId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Increment views and track page view on first load
    useEffect(() => {
        if (movie && "_id" in movie) {
            incrementViews({ id: movie._id });
            trackPageView({ pageType: "movie", pageId: slug });
        }
    }, [movie?._id, incrementViews, trackPageView, slug]);

    if (!movie || !settings) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    const isUnlocked = !movie.isPremium || isPremium || localUnlocked;
    const activeEmbed = movie.embeds[activeEmbedIndex];

    const handleRedeem = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setError("");
        const result = await redeemCode(code.trim());
        setLoading(false);
        if (result.success) setLocalUnlocked(true);
        else setError(result.error || "Code qaldan");
    };

    const whatsappLink = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}?text=Waxaan rabaa inaan furo film ${movie.title}`;

    // Show interstitial ad for ALL non-premium users (free/guest) before viewing content
    if (!isPremium && showInterstitial && !adCompleted) {
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

    return (
        <div className="relative min-h-screen">
            {/* Background Image */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: "url('/theater.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-stadium-dark/95 via-stadium-dark/90 to-stadium-dark" />
            </div>

            <div className="relative z-10 min-h-screen">
                {/* Backdrop */}
                {movie.backdropUrl && (
                    <div className="absolute top-0 left-0 right-0 h-[50vh] overflow-hidden pointer-events-none">
                        <Image
                            src={movie.backdropUrl}
                            alt=""
                            fill
                            className="object-cover opacity-20"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stadium-dark/80 to-stadium-dark" />
                    </div>
                )}

                <div className="container mx-auto px-4 py-6 relative z-10">
                    {/* Breadcrumb */}
                    <Link
                        href="/movies"
                        className="inline-flex items-center gap-2 text-text-muted hover:text-accent-green transition-colors mb-6"
                    >
                        <ArrowLeft size={16} />
                        Ku laabo Filimada
                    </Link>

                    {/* Player - Full Width of Container (Centered & Bigger) */}
                    {/* PPV Gate - Shows if content is PPV and user doesn't have access */}
                    {ppvAccess?.isPPV && !ppvAccess?.hasAccess ? (
                        <div className="mb-8">
                            <PPVUnlockGate
                                contentType="movie"
                                contentId={slug}
                                contentTitle={movie.titleSomali || movie.title}
                            >
                                <div className="player-stage bg-stadium-elevated rounded-2xl overflow-hidden border border-border-strong relative aspect-video shadow-2xl">
                                    {activeEmbed?.url ? (
                                        <StreamPlayer
                                            source={{
                                                url: activeEmbed.url,
                                                type: (activeEmbed as any).type || "auto",
                                                isProtected: (activeEmbed as any).isProtected
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
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <p className="text-text-muted">Lama hayo embed links</p>
                                        </div>
                                    )}
                                </div>
                            </PPVUnlockGate>
                        </div>
                    ) : (
                        <div className="player-stage bg-stadium-elevated rounded-2xl overflow-hidden border border-border-strong mb-8 relative aspect-video shadow-2xl">
                            {movie.isPremium && !isUnlocked ? (
                                /* Premium Lock */
                                <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-stadium-dark/90 to-stadium-elevated z-10 overflow-y-auto">
                                    <div className="bg-stadium-dark border-2 border-accent-gold rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md text-center my-auto">
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                                            <Crown size={20} className="sm:hidden text-accent-gold" />
                                            <Crown size={28} className="hidden sm:block text-accent-gold" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-accent-gold mb-1 sm:mb-2">PREMIUM FILM</h3>
                                        <p className="text-text-secondary text-sm sm:text-base mb-3 sm:mb-4">Film-kan waxaa u baahan subscription</p>
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={code}
                                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                                    placeholder="CODE"
                                                    className="flex-1 bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 sm:px-4 sm:py-3 uppercase text-center tracking-wider text-sm"
                                                />
                                                <button
                                                    onClick={handleRedeem}
                                                    disabled={loading}
                                                    className="px-4 py-2 sm:px-6 sm:py-3 bg-accent-green text-black font-bold rounded-lg text-sm"
                                                >
                                                    {loading ? "..." : "Fur"}
                                                </button>
                                            </div>
                                            {error && <p className="text-accent-red text-xs sm:text-sm">{error}</p>}
                                            <div className="flex gap-2 sm:gap-3">
                                                <Link href="/pricing" className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-accent-gold text-black font-bold rounded-lg text-center text-sm">
                                                    Iibso
                                                </Link>
                                                <a
                                                    href={whatsappLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-2 text-sm"
                                                >
                                                    <MessageSquare size={16} />
                                                    WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeEmbed?.url ? (
                                <StreamPlayer
                                    source={{
                                        url: activeEmbed.url,
                                        type: (activeEmbed as any).type || "auto",
                                        isProtected: (activeEmbed as any).isProtected
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
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-text-muted">Lama hayo embed links</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons (Trailer, Download, My List) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Trailer */}
                        {movie.trailerUrl && (
                            <button
                                onClick={() => setShowTrailer(true)}
                                className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg border border-red-500/50"
                            >
                                <Youtube size={24} />
                                TRAILER
                            </button>
                        )}

                        {/* Download */}
                        {movie.downloadUrl && (
                            isPremium ? (
                                <a
                                    href={movie.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg border border-blue-500/50"
                                >
                                    <Download size={24} />
                                    DOWNLOAD
                                </a>
                            ) : (
                                <button
                                    onClick={() => setShowPremiumPopup(true)}
                                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg border border-blue-500/50"
                                >
                                    <Download size={24} />
                                    DOWNLOAD <Crown size={16} className="text-yellow-400" />
                                </button>
                            )
                        )}

                        {/* My List */}
                        <div className="h-14">
                            <MyListButton
                                contentType="movie"
                                contentId={slug}
                                className="w-full h-full text-lg bg-green-600 hover:bg-green-700 text-white border-none shadow-lg"
                            />
                        </div>
                    </div>

                    {/* Premium Promo Banner - Hidden for premium users */}
                    {!isPremium && (
                        <div className="mb-8">
                            <PremiumPromoBanner />
                        </div>
                    )}

                    {/* Premium Popup Banner - Shows when triggered (Download/MyList) */}
                    <PremiumPopupBanner
                        show={showPremiumPopup}
                        onClose={() => setShowPremiumPopup(false)}
                    />

                    {/* Embed switcher */}
                    {isUnlocked && movie.embeds.length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-8 justify-center">
                            {movie.embeds.map((embed, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveEmbedIndex(i)}
                                    className={cn(
                                        "px-4 py-2 text-sm font-semibold rounded-md border transition-all",
                                        activeEmbedIndex === i
                                            ? "bg-accent-green text-black border-accent-green"
                                            : "bg-stadium-elevated text-text-secondary border-border-subtle hover:border-text-muted"
                                    )}
                                >
                                    {embed.label} {embed.quality && `(${embed.quality})`}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Info */}
                        <div className="lg:col-span-2">
                            {/* Movie Info */}
                            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6">
                                <div className="flex items-start gap-4 mb-6">
                                    {movie.posterUrl && (
                                        <div className="relative w-24 h-36 flex-shrink-0 hidden sm:block">
                                            <Image
                                                src={movie.posterUrl}
                                                alt={movie.title}
                                                fill
                                                className="rounded-lg object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <h1 className="text-2xl md:text-3xl font-black mb-2">
                                                {movie.titleSomali || movie.title}
                                            </h1>
                                            <MyListButton contentType="movie" contentId={slug} variant="icon" />
                                        </div>
                                        {movie.titleSomali && (
                                            <p className="text-text-muted text-sm mb-2">{movie.title}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} /> {movie.releaseDate}
                                            </span>
                                            {movie.runtime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} /> {movie.runtime} min
                                                </span>
                                            )}
                                            {movie.rating && (
                                                <span className="flex items-center gap-1">
                                                    <Star size={14} className="text-accent-gold" /> {movie.rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>


                                    </div>
                                </div>

                                {/* Genres */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {movie.genres.map((g) => (
                                        <span key={g} className="px-3 py-1 bg-stadium-hover rounded-full text-xs font-medium">
                                            {g}
                                        </span>
                                    ))}
                                </div>

                                {/* Description */}
                                <p className="text-text-secondary leading-relaxed">
                                    {movie.overviewSomali || movie.overview}
                                </p>

                                {/* Cast */}
                                {movie.cast.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-border-subtle">
                                        <h3 className="font-bold mb-3">Cast</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {movie.cast.map((c, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-stadium-hover rounded-full pr-3 relative">
                                                    {c.profileUrl ? (
                                                        <Image
                                                            src={c.profileUrl}
                                                            alt={c.name}
                                                            width={32}
                                                            height={32}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-stadium-dark flex items-center justify-center text-xs">
                                                            {c.name[0]}
                                                        </div>
                                                    )}
                                                    <span className="text-sm">{c.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <AdSlot slotKey="movie_below" className="mt-6" />
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <AdSlot slotKey="movie_sidebar" className="mb-6" />
                        </div>
                    </div>

                    {/* You May Also Like Section */}
                    {relatedMovies && relatedMovies.length > 0 && (
                        <div className="mt-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
                                    <span className="w-1 h-6 bg-accent-green rounded-full"></span>
                                    YOU MAY ALSO LIKE
                                </h2>
                            </div>
                            <div className="relative group">
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                                    {relatedMovies.map((m) => (
                                        <Link
                                            key={m._id}
                                            href={`/movies/${m.slug}`}
                                            className="flex-shrink-0 w-[140px] md:w-[180px] snap-start group/card"
                                        >
                                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-border-subtle group-hover/card:border-accent-green/50 transition-all">
                                                <Image
                                                    src={m.posterUrl}
                                                    alt={m.title}
                                                    fill
                                                    className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                                                />
                                                {/* Rating Badge */}
                                                {m.rating && (
                                                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-xs">
                                                        <Star size={10} className="text-yellow-400" fill="currentColor" />
                                                        <span className="text-white font-bold">{m.rating.toFixed(1)}</span>
                                                        <span className="text-white/60">/10</span>
                                                    </div>
                                                )}
                                                {/* Year Badge */}
                                                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-xs text-white">
                                                    {m.releaseDate?.split("-")[0]}
                                                </div>
                                                {/* Quality Badge */}
                                                {m.embeds?.[0]?.quality && (
                                                    <div className="absolute bottom-2 right-2 bg-accent-green text-black px-2 py-0.5 rounded text-xs font-bold">
                                                        {m.embeds[0].quality}
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="mt-2 text-sm font-semibold line-clamp-2 group-hover/card:text-accent-green transition-colors">
                                                {m.titleSomali || m.title}
                                            </h3>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Trailer Modal */}
                {showTrailer && movie.trailerUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowTrailer(false)}>
                        <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                            <button
                                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
                                onClick={() => setShowTrailer(false)}
                            >
                                <X size={24} />
                            </button>
                            <iframe
                                src={`https://www.youtube.com/embed/${getTrailerId(movie.trailerUrl)}?autoplay=1`}
                                className="w-full h-full"
                                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}

                {/* JSON-LD Schema */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Movie",
                            name: movie.title,
                            alternateName: movie.titleSomali,
                            description: movie.overviewSomali || movie.overview,
                            image: movie.posterUrl,
                            datePublished: movie.releaseDate,
                            duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
                            aggregateRating: movie.rating ? {
                                "@type": "AggregateRating",
                                ratingValue: movie.rating,
                                bestRating: "10",
                                ratingCount: "100" // Placeholder or from DB
                            } : undefined,
                            actor: movie.cast?.map(c => ({
                                "@type": "Person",
                                name: c.name
                            })),
                            director: movie.director ? {
                                "@type": "Person",
                                name: movie.director
                            } : undefined,
                            genre: movie.genres,
                            offers: {
                                "@type": "Offer",
                                price: movie.isPremium ? "5.00" : "0",
                                priceCurrency: "USD",
                                availability: "https://schema.org/OnlineOnly"
                            }
                        })
                    }}
                />
            </div>
        </div>
    );
}
