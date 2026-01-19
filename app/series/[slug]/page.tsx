"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { useState, useEffect } from "react";
import { AdSlot } from "@/components/AdSlot";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
import type { Id } from "@/convex/_generated/dataModel";

export default function SeriesWatchPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = params.slug as string;

    // Parse query params for specific episode
    const seasonParam = searchParams.get("s");
    const episodeParam = searchParams.get("e");

    // Default to Season 1, Episode 1 if not specified, 
    // BUT we only auto-select if we want to default to watch mode.
    // Actually, let's keep "Detail View" as default if no params, 
    // but maybe auto-select first episode for the list.

    const [activeSeason, setActiveSeason] = useState(1);

    const series = useQuery(api.series.getSeriesBySlug, { slug });
    const episodesData = useQuery(
        api.series.getEpisodesBySeries,
        series ? { seriesId: series._id } : "skip"
    );
    const settings = useQuery(api.settings.getSettings);
    // const incrementViews = useMutation(api.series.incrementViews); // Assuming this is needed later if not present

    const { isPremium, redeemCode } = useUser();

    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [localUnlocked, setLocalUnlocked] = useState(false);

    // Effect to update active season if url changes
    useEffect(() => {
        if (seasonParam) {
            setActiveSeason(parseInt(seasonParam));
        }
    }, [seasonParam]);

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
    if (currentSeasonNumber && currentEpisodeNumber && episodesData[currentSeasonNumber]) {
        activeEpisode = episodesData[currentSeasonNumber].find(e => e.episodeNumber === currentEpisodeNumber);
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
        // Reset unlock state if switching episodes? Maybe not for series if unlock is global or per series?
        // Usually series unlock is per series or subscription.
        // If "Unlock" unlocks the whole series, we keep localUnlocked.

        // Push to new URL
        router.push(`/series/${slug}?s=${s}&e=${e}`);
        setActiveEmbedIndex(0);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen">
            {/* Backdrop */}
            {series.backdropUrl && (
                <div className="absolute top-0 left-0 right-0 h-[50vh] overflow-hidden pointer-events-none">
                    <img
                        src={series.backdropUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-20"
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
                                    <div className="aspect-video w-full flex items-center justify-center p-4 bg-gradient-to-b from-stadium-dark/90 to-stadium-elevated">
                                        <div className="bg-stadium-dark border-2 border-accent-gold rounded-2xl p-8 max-w-md text-center">
                                            <div className="w-16 h-16 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Crown size={32} className="text-accent-gold" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-accent-gold mb-2">PREMIUM SERIES</h3>
                                            <p className="text-text-secondary mb-6">Musalsalkan waxaa u baahan subscription</p>
                                            <div className="space-y-4">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={code}
                                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                                        placeholder="CODE"
                                                        className="flex-1 bg-stadium-elevated border border-border-subtle rounded-lg px-4 py-3 uppercase text-center tracking-wider"
                                                    />
                                                    <button
                                                        onClick={handleRedeem}
                                                        disabled={loading}
                                                        className="px-6 py-3 bg-accent-green text-black font-bold rounded-lg"
                                                    >
                                                        {loading ? "..." : "Fur"}
                                                    </button>
                                                </div>
                                                {error && <p className="text-accent-red text-sm">{error}</p>}
                                                <div className="flex gap-3">
                                                    <Link href="/pricing" className="flex-1 px-4 py-3 bg-accent-gold text-black font-bold rounded-lg text-center">
                                                        Iibso
                                                    </Link>
                                                    <a
                                                        href={whatsappLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                                                    >
                                                        <MessageSquare size={18} />
                                                        WhatsApp
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeEmbed?.url ? (
                                    <div className="aspect-video w-full">
                                        <iframe
                                            src={activeEmbed.url}
                                            className="w-full h-full"
                                            allowFullScreen
                                            scrolling="no"
                                            allow="autoplay; encrypted-media"
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
                                        <img src={series.posterUrl} alt={series.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-stadium-dark flex items-center justify-center">
                                            <Tv size={48} className="text-text-muted/30" />
                                        </div>
                                    )}
                                    {series.isPremium && (
                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent-gold px-2 py-0.5 rounded text-xs font-bold text-black">
                                            <Crown size={10} />
                                            PREMIUM
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
                                        {Object.keys(episodesData).length > 0 && (
                                            <button
                                                onClick={() => {
                                                    const firstS = Object.keys(episodesData).sort()[0];
                                                    const firstE = episodesData[Number(firstS)][0];
                                                    handleEpisodeClick(Number(firstS), firstE.episodeNumber);
                                                }}
                                                className="px-6 py-3 bg-accent-green text-black font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all"
                                            >
                                                <Play size={20} fill="black" />
                                                Bilow Daawashada
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Embed switcher if watching and unlocked */}
                        {activeEpisode && !isLocked && activeEpisode.embeds && activeEpisode.embeds.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {activeEpisode.embeds.map((embed, i) => (
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
                                        {Object.keys(episodesData).sort().map(s => (
                                            <option key={s} value={s}>Season {s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {episodesData[activeSeason]?.map((ep) => (
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
                                                <img src={ep.stillUrl} alt={ep.title} className="w-full h-full object-cover" />
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

                                {(!episodesData[activeSeason] || episodesData[activeSeason].length === 0) && (
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
                                        <img src={series.posterUrl} alt={series.title} className="w-20 rounded-lg object-cover" />
                                    )}
                                    <div>
                                        <h3 className="font-bold mb-1 line-clamp-2">{series.titleSomali || series.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                                            <Star size={12} className="text-accent-gold" /> {series.rating?.toFixed(1) || "N/A"}
                                            <span>• {series.firstAirDate?.slice(0, 4)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {series.genres.slice(0, 3).map(g => (
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
                                    {series.cast.slice(0, 5).map((c, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            {c.profileUrl ? (
                                                <img src={c.profileUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
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
                    </div>
                </div>
            </div>
        </div>
    );
}
