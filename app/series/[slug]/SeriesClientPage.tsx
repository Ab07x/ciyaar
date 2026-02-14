"use client";

import useSWR from "swr";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { AdSlot } from "@/components/AdSlot";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/components/MoviePosterImage";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    Crown,
    Star,
    Clock,
    Calendar,
    Play,
    Lock,
    MessageSquare,
    Tv,
    ChevronDown,
} from "lucide-react";
import { MyListButton } from "@/components/MyListButton";
import PremiumBannerNew from "@/components/PremiumBannerNew";
import { PremiumAdInterstitial } from "@/components/PremiumAdInterstitial";
import { StreamPlayer } from "@/components/StreamPlayer";
import { ContentCarousel } from "@/components/ContentCarousel";
import { generateTVSchema } from "@/lib/seo/schema";
import { ShareableWidget } from "@/components/ShareableWidget";

function SeriesWatchContent({ initialSeries }: { initialSeries?: any }) {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = params.slug as string;

    // Parse query params for specific episode
    const seasonParam = searchParams.get("s");
    const episodeParam = searchParams.get("e");

    const [activeSeason, setActiveSeason] = useState(1);

    const fetcher = (url: string) => fetch(url).then((r) => r.json());

    const { data: series } = useSWR(`/api/series/${slug}`, fetcher, { fallbackData: initialSeries });
    const { data: episodesData } = useSWR(
        series ? `/api/series/${slug}/episodes` : null,
        fetcher
    );
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { data: similarContent } = useSWR(
        `/api/recommendations?contentId=${slug}&contentType=series&limit=10`,
        fetcher
    );

    const { isPremium, redeemCode } = useUser();
    const hasTracked = useRef(false);

    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [localUnlocked, setLocalUnlocked] = useState(false);
    const [showInterstitial, setShowInterstitial] = useState(true);
    const [adCompleted, setAdCompleted] = useState(false);

    const episodesBySeason = useMemo(() => {
        const raw = episodesData as any;
        if (!raw) return {} as Record<number, any[]>;

        // Backward compatible: accept flat episode arrays or already-grouped objects.
        if (Array.isArray(raw)) {
            return raw.reduce((acc: Record<number, any[]>, ep: any) => {
                const season = Number(ep?.seasonNumber) || 1;
                if (!acc[season]) acc[season] = [];
                acc[season].push(ep);
                return acc;
            }, {});
        }

        const grouped: Record<number, any[]> = {};
        Object.entries(raw).forEach(([seasonKey, value]) => {
            const season = Number(seasonKey);
            if (!Number.isFinite(season)) return;
            grouped[season] = Array.isArray(value) ? (value as any[]) : [];
        });
        return grouped;
    }, [episodesData]);

    // Track page view once on mount
    useEffect(() => {
        if (!hasTracked.current && series) {
            hasTracked.current = true;
            fetch("/api/analytics/pageview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageType: "series", pageId: slug }),
            }).catch(() => { });
        }
    }, [series, slug]);

    // Effect to update active season if url changes
    useEffect(() => {
        if (seasonParam) {
            setActiveSeason(parseInt(seasonParam));
        }
    }, [seasonParam]);

    useEffect(() => {
        if (seasonParam) return;
        const seasons = Object.keys(episodesBySeason).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        if (seasons.length === 0) return;
        if ((episodesBySeason[activeSeason] || []).length === 0) {
            setActiveSeason(seasons[0]);
        }
    }, [activeSeason, episodesBySeason, seasonParam]);

    if (!series || !settings || !episodesData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    // Determine current playing episode
    const currentEpisodeNumber = episodeParam ? parseInt(episodeParam) : null;
    const currentSeasonNumber = seasonParam ? parseInt(seasonParam) : null;

    let activeEpisode = null;
    if (currentSeasonNumber && currentEpisodeNumber && Array.isArray(episodesBySeason[currentSeasonNumber])) {
        activeEpisode = episodesBySeason[currentSeasonNumber].find((e: any) => e.episodeNumber === currentEpisodeNumber);
    }

    const isLocked = series.isPremium && !isPremium && !localUnlocked;
    const activeEmbed = activeEpisode?.embeds?.[activeEmbedIndex];

    const handleRedeem = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setError("");
        const result = await redeemCode(code.trim());
        setLoading(false);
        if (result.success) setLocalUnlocked(true);
        else setError(result.error || "Code qaldan");
    };

    const whatsappLink = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}?text=Waxaan rabaa inaan furo musalsalka ${series.title}`;

    const handleEpisodeClick = (s: number, e: number) => {
        router.push(`/series/${slug}?s=${s}&e=${e}`);
        setActiveEmbedIndex(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Show interstitial ad for ALL non-premium users (free/guest) before viewing content
    if (!isPremium && showInterstitial && !adCompleted) {
        return (
            <PremiumAdInterstitial
                movieTitle={series.title}
                duration={10}
                onComplete={() => {
                    setAdCompleted(true);
                    setShowInterstitial(false);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen">
            {/* Backdrop */}
            {series.backdropUrl && (
                <div className="absolute top-0 left-0 right-0 h-[50vh] overflow-hidden pointer-events-none">
                    <Image
                        src={optimizeImageUrl(series.backdropUrl, "backdrop") || series.backdropUrl}
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
                    href="/series"
                    className="inline-flex items-center gap-2 text-text-muted hover:text-accent-green transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Ku laabo Musalsalada
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Player Stage - Only shown if an episode is selected */}
                        {activeEpisode ? (
                            <div className="player-stage bg-stadium-elevated rounded-2xl overflow-hidden border border-border-strong mb-6 relative">
                                {isLocked ? (
                                    /* Premium Lock */
                                    <div className="aspect-video w-full flex items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-stadium-dark/90 to-stadium-elevated overflow-y-auto">
                                        <div className="bg-stadium-dark border-2 border-accent-gold rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md text-center my-auto">
                                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                                                <Crown size={20} className="sm:hidden text-accent-gold" />
                                                <Crown size={28} className="hidden sm:block text-accent-gold" />
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-bold text-accent-gold mb-1 sm:mb-2">PREMIUM SERIES</h3>
                                            <p className="text-text-secondary text-sm sm:text-base mb-3 sm:mb-4">Musalsalkan waxaa u baahan subscription</p>
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
                                    <div className="aspect-video w-full relative">
                                        <StreamPlayer
                                            source={{
                                                url: activeEmbed.url,
                                                type: (activeEmbed as any).type || "auto",
                                                isProtected: (activeEmbed as any).isProtected
                                            }}
                                            poster={series.backdropUrl || series.posterUrl}
                                            className="absolute inset-0"
                                            trackParams={{
                                                contentType: "episode",
                                                contentId: `${slug}-s${activeEpisode.seasonNumber}-e${activeEpisode.episodeNumber}`,
                                                seriesId: slug,
                                                duration: activeEpisode.runtime ? activeEpisode.runtime * 60 : undefined
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-video w-full flex items-center justify-center bg-stadium-dark">
                                        <p className="text-text-muted">Lama hayo embed links</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Series Poster Header if no episode selected */
                            <div className="mb-8 flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-full md:w-1/3 max-w-[240px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl relative flex-shrink-0 mx-auto md:mx-0">
                                    {series.posterUrl ? (
                                        <Image src={optimizeImageUrl(series.posterUrl, "poster") || series.posterUrl} alt={series.title} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-stadium-dark flex items-center justify-center">
                                            <Tv size={48} className="text-text-muted/30" />
                                        </div>
                                    )}
                                    {series.isPremium && (
                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent-gold px-2 py-0.5 rounded text-xs font-bold text-black z-10">
                                            <Crown size={10} />
                                            PREMIUM
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                            <Lock size={48} className="text-white/80" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h1 className="text-3xl md:text-4xl font-black mb-2">
                                        {series.titleSomali || series.title}
                                    </h1>
                                    {series.titleSomali && (
                                        <p className="text-text-muted text-lg mb-4">{series.title}</p>
                                    )}
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-text-secondary mb-6">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} /> {series.firstAirDate?.split("-")[0]}
                                        </span>
                                        {series.rating && (
                                            <span className="flex items-center gap-1">
                                                <Star size={14} className="text-accent-gold" /> {series.rating.toFixed(1)}
                                            </span>
                                        )}
                                        <span>{series.numberOfSeasons} Seasons</span>
                                        <span>{series.numberOfEpisodes} Episodes</span>
                                    </div>

                                    <p className="text-text-secondary leading-relaxed mb-6 max-w-2xl">
                                        {series.overviewSomali || series.overview}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                        {Object.keys(episodesBySeason).length > 0 && (
                                            <button
                                                onClick={() => {
                                                    const firstS = Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b)[0];
                                                    const firstE = episodesBySeason[firstS]?.[0];
                                                    if (!firstE) return;
                                                    handleEpisodeClick(Number(firstS), firstE.episodeNumber);
                                                }}
                                                className="px-6 py-3 bg-accent-green text-black font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all"
                                            >
                                                <Play size={20} fill="black" />
                                                Bilow Daawashada
                                            </button>
                                        )}
                                        <MyListButton contentType="series" contentId={slug} variant="full" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Premium Promo Banner - Hidden for premium users */}
                        {activeEpisode && !isPremium && (
                            <div className="mb-6">
                                <PremiumBannerNew />
                            </div>
                        )}

                        {/* Embed switcher if watching and unlocked */}
                        {activeEpisode && !isLocked && activeEpisode.embeds && activeEpisode.embeds.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {activeEpisode.embeds.map((embed: any, i: number) => (
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
                                        {embed.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Title Info when watching */}
                        {activeEpisode && (
                            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6 mb-8">
                                <h2 className="text-xl font-bold mb-1">
                                    S{activeEpisode.seasonNumber} E{activeEpisode.episodeNumber} - {activeEpisode.title}
                                </h2>
                                <p className="text-text-secondary text-sm">
                                    {activeEpisode.overview || `Episode ${activeEpisode.episodeNumber} of ${series.title}`}
                                </p>
                            </div>
                        )}

                        <AdSlot slotKey="series_mid" className="mb-8" />

                        {/* Episodes List */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold">Episodes</h3>

                                {/* Season Selector */}
                                <div className="relative">
                                    <select
                                        value={activeSeason}
                                        onChange={(e) => setActiveSeason(Number(e.target.value))}
                                        className="appearance-none bg-stadium-elevated border border-border-strong rounded-lg pl-4 pr-10 py-2 font-bold focus:outline-none focus:border-accent-green transition-colors cursor-pointer"
                                    >
                                        {Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b).map((s) => (
                                            <option key={s} value={s}>Season {s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(episodesBySeason[activeSeason] || [])?.map((ep: any) => (
                                    <button
                                        key={ep._id}
                                        onClick={() => handleEpisodeClick(ep.seasonNumber, ep.episodeNumber)}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-xl border transition-all text-left group",
                                            activeEpisode?._id === ep._id
                                                ? "bg-accent-green/10 border-accent-green"
                                                : "bg-stadium-elevated border-border-subtle hover:border-text-muted hover:bg-stadium-hover"
                                        )}
                                    >
                                        <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-stadium-dark flex-shrink-0">
                                            {ep.stillUrl ? (
                                                <Image src={ep.stillUrl} alt={ep.title} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Play size={24} className="text-text-muted/50" />
                                                </div>
                                            )}
                                            {/* Overlay Play Icon */}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play size={20} className="text-white fill-current" />
                                            </div>
                                            {isLocked && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <Lock size={16} className="text-white/70" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-accent-green">
                                                    EPISODE {ep.episodeNumber}
                                                </span>
                                                {ep.runtime && (
                                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                                        <Clock size={10} /> {ep.runtime}m
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className={cn(
                                                "font-bold truncate",
                                                activeEpisode?._id === ep._id ? "text-accent-green" : "text-white"
                                            )}>
                                                {ep.title}
                                            </h4>
                                            <p className="text-xs text-text-muted line-clamp-1 mt-1">
                                                {ep.overview || "No description available."}
                                            </p>
                                        </div>
                                    </button>
                                ))}

                                {(!(episodesBySeason[activeSeason]) || episodesBySeason[activeSeason].length === 0) && (
                                    <div className="col-span-full py-12 text-center text-text-muted bg-stadium-elevated/50 rounded-xl border border-dashed border-border-subtle">
                                        No episodes found for Season {activeSeason}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Series Info - Reduced if detail view is active, full if watch mode */}
                        {activeEpisode && (
                            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                                <div className="flex gap-4 mb-4">
                                    {series.posterUrl && (
                                        <div className="relative w-20 h-30 flex-shrink-0">
                                            <Image src={optimizeImageUrl(series.posterUrl, "poster") || series.posterUrl} alt={series.title} width={80} height={120} className="rounded-lg object-cover" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold mb-1 line-clamp-2">{series.titleSomali || series.title}</h3>
                                            <MyListButton contentType="series" contentId={slug} variant="icon" />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                                            <Star size={12} className="text-accent-gold" /> {series.rating?.toFixed(1) || "N/A"}
                                            <span>• {series.firstAirDate?.slice(0, 4)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {series.genres.slice(0, 3).map((g: string) => (
                                        <span key={g} className="text-xs px-2 py-1 bg-stadium-hover rounded text-text-secondary">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <AdSlot slotKey="series_sidebar" />

                        {/* Cast */}
                        {series.cast.length > 0 && (
                            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                                <h3 className="font-bold mb-4">Cast</h3>
                                <div className="flex flex-col gap-3">
                                    {series.cast.slice(0, 5).map((c: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3">
                                            {c.profileUrl ? (
                                                <Image src={c.profileUrl} alt={c.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-stadium-dark flex items-center justify-center text-xs font-bold">
                                                    {c.name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-bold">{c.name}</p>
                                                <p className="text-xs text-text-muted">{c.character}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Similar Content Section */}
                        {similarContent && (similarContent as any).length > 0 && (
                            <div className="mt-8">
                                <ContentCarousel
                                    title="YOU MAY ALSO LIKE"
                                    data={similarContent}
                                    type="mixed"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* JSON-LD Schema for Rich Snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(generateTVSchema(series))
                }}
            />

            {/* Shareable Widget - Floating */}
            <ShareableWidget
                title={series.titleSomali || series.title}
                type="series"
                url={`https://fanbroj.net/series/${slug}`}
            />
        </div>
    );
}

export default function SeriesWatchPage({ initialSeries }: { initialSeries?: any }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div></div>}>
            <SeriesWatchContent initialSeries={initialSeries} />
        </Suspense>
    );
}
