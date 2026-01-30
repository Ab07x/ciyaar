"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    Save,
    ChevronLeft,
    Search,
    Loader2,
    Plus,
    X,
    Tv,
    Star,
    Calendar,
    Download,
    Edit,
    Play
} from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import EpisodeEditor from "@/components/admin/EpisodeEditor";

interface Props {
    params?: Promise<{ id: string }>;
}

export default function SeriesFormPage({ params }: Props) {
    const router = useRouter();
    const idParams = params ? use(params) : null;
    const id = idParams?.id;

    const existingSeries = useQuery(
        api.series.getSeriesById,
        id ? { id: id as Id<"series"> } : "skip"
    );
    const episodesData = useQuery(
        api.series.getEpisodesBySeries,
        id ? { seriesId: id as Id<"series"> } : "skip"
    );

    const createSeries = useMutation(api.series.createSeries);
    const updateSeries = useMutation(api.series.updateSeries);
    const fetchFromTMDB = useAction(api.tmdb.fetchSeriesFromTMDB);
    const fetchSeasonFromTMDB = useAction(api.tmdb.fetchSeasonFromTMDB);
    const bulkCreateEpisodes = useMutation(api.series.bulkCreateEpisodes);
    const searchTMDB = useAction(api.tmdb.searchTMDB);


    const [activeTab, setActiveTab] = useState<"details" | "episodes">("details");
    const [tmdbInput, setTmdbInput] = useState("");
    const [searching, setSearching] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [syncing, setSyncing] = useState(0); // Season number currently syncing
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [editingEpisode, setEditingEpisode] = useState<any>(null);

    const [formData, setFormData] = useState({
        slug: "",
        tmdbId: 0,
        title: "",
        overview: "",
        posterUrl: "",
        backdropUrl: "",
        firstAirDate: "",
        lastAirDate: "",
        status: "",
        rating: 0,
        genres: [] as string[],
        cast: [] as { name: string; character: string; profileUrl?: string }[],
        numberOfSeasons: 0,
        numberOfEpisodes: 0,
        titleSomali: "",
        overviewSomali: "",
        isDubbed: false,
        isPremium: false,
        isPublished: true,
        tags: [] as string[],
    });

    useEffect(() => {
        if (existingSeries && "title" in existingSeries) {
            setFormData({
                slug: existingSeries.slug,
                tmdbId: existingSeries.tmdbId,
                title: existingSeries.title,
                overview: existingSeries.overview,
                posterUrl: existingSeries.posterUrl,
                backdropUrl: existingSeries.backdropUrl || "",
                firstAirDate: existingSeries.firstAirDate,
                lastAirDate: existingSeries.lastAirDate || "",
                status: existingSeries.status,
                rating: existingSeries.rating || 0,
                genres: existingSeries.genres,
                cast: existingSeries.cast,
                numberOfSeasons: existingSeries.numberOfSeasons,
                numberOfEpisodes: existingSeries.numberOfEpisodes,
                titleSomali: existingSeries.titleSomali || "",
                overviewSomali: existingSeries.overviewSomali || "",
                isDubbed: existingSeries.isDubbed,
                isPremium: existingSeries.isPremium,
                isPublished: existingSeries.isPublished,
                tags: existingSeries.tags || [],
            });
        }
    }, [existingSeries]);

    const handleSearch = async () => {
        if (!tmdbInput.trim()) return;
        setSearching(true);
        try {
            const results = await searchTMDB({ query: tmdbInput, type: "tv" });
            setSearchResults(results);
            setShowSearch(true);
        } catch (err) {
            console.error(err);
        }
        setSearching(false);
    };

    const handleFetchTMDB = async (tmdbId: number) => {
        setFetching(true);
        setShowSearch(false);
        try {
            const data = await fetchFromTMDB({ tmdbId });
            setFormData({
                ...formData,
                slug: data.slug,
                tmdbId: data.tmdbId,
                title: data.title,
                overview: data.overview,
                posterUrl: data.posterUrl,
                backdropUrl: data.backdropUrl || "",
                firstAirDate: data.firstAirDate,
                lastAirDate: data.lastAirDate || "",
                status: data.status,
                rating: data.rating || 0,
                genres: data.genres,
                cast: data.cast,
                numberOfSeasons: data.numberOfSeasons,
                numberOfEpisodes: data.numberOfEpisodes,
            });
        } catch (err) {
            console.error(err);
            alert("Failed to fetch from TMDB");
        }
        setFetching(false);
    };

    const handleSubmit = async () => {
        if (!formData.tmdbId || !formData.title) {
            alert("First fetch series data from TMDB");
            return;
        }

        try {
            if (id) {
                await updateSeries({
                    id: id as Id<"series">,
                    isDubbed: formData.isDubbed,
                    isPremium: formData.isPremium,
                    isPublished: formData.isPublished,
                    titleSomali: formData.titleSomali || undefined,
                    overviewSomali: formData.overviewSomali || undefined,
                    tags: formData.tags,
                });
            } else {
                const newId = await createSeries({
                    ...formData,
                    backdropUrl: formData.backdropUrl || undefined,
                    lastAirDate: formData.lastAirDate || undefined,
                    rating: formData.rating || undefined,
                    titleSomali: formData.titleSomali || undefined,
                    overviewSomali: formData.overviewSomali || undefined,
                    tags: formData.tags,
                });
                router.push(`/admin/series/${newId}`); // Redirect to edit mode to add episodes
            }
            if (!id) router.push("/admin/series");
        } catch (err) {
            console.error(err);
            alert("Failed to save series");
        }
    };

    const handleSyncSeason = async (seasonNum: number) => {
        if (!id || !existingSeries?.tmdbId) {
            alert("Cannot sync: Missing series ID or TMDB ID.");
            return;
        }

        setSyncing(seasonNum);
        try {
            const data = await fetchSeasonFromTMDB({
                tmdbId: existingSeries.tmdbId,
                seasonNumber: seasonNum
            });

            const existingEps = episodesData?.[seasonNum] || [];
            const newEpisodes = data.episodes.filter((ep: any) =>
                !existingEps.some(existing => existing.episodeNumber === ep.episodeNumber)
            );

            if (newEpisodes.length === 0) {
                alert("All episodes already imported.");
            } else {
                await bulkCreateEpisodes({
                    seriesId: id as Id<"series">,
                    seasonNumber: seasonNum,
                    episodes: newEpisodes
                });
                alert(`Imported ${newEpisodes.length} episodes!`);
            }
        } catch (err: any) {
            alert(`Sync failed: ${err.message || "Unknown error"}`);
        }
        setSyncing(0);
    };

    return (
        <div className="max-w-6xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/series" className="p-2 bg-stadium-elevated rounded-lg">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-black">{id ? "EDIT SERIES" : "NEW SERIES"}</h1>
                </div>
                <div className="flex items-center gap-3">
                    {id && (
                        <div className="flex bg-stadium-elevated rounded-lg p-1 border border-border-strong">
                            <button
                                onClick={() => setActiveTab("details")}
                                className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === "details" ? "bg-accent-green text-black" : "text-text-secondary hover:text-white"
                                    }`}
                            >
                                Details
                            </button>
                            <button
                                onClick={() => setActiveTab("episodes")}
                                className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === "episodes" ? "bg-accent-green text-black" : "text-text-secondary hover:text-white"
                                    }`}
                            >
                                Episodes
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                    >
                        <Save size={20} />
                        {id ? "Update" : "Create"}
                    </button>
                </div>
            </div>

            {/* TAB: DETAILS */}
            {activeTab === "details" && (
                <>
                    {/* TMDB Search */}
                    {!id && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Tv className="text-purple-400" />
                                Step 1: Search TMDB
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={tmdbInput}
                                    onChange={(e) => setTmdbInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search series name..."
                                    className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className="px-6 py-3 bg-purple-500 text-white rounded-lg font-bold flex items-center gap-2"
                                >
                                    {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                    Search
                                </button>
                            </div>

                            {showSearch && searchResults.length > 0 && (
                                <div className="mt-4 grid grid-cols-5 gap-3">
                                    {searchResults.map((r) => (
                                        <button
                                            key={r.id}
                                            onClick={() => handleFetchTMDB(r.id)}
                                            className="bg-stadium-elevated rounded-lg overflow-hidden text-left hover:ring-2 ring-purple-500"
                                        >
                                            {r.posterUrl ? (
                                                <img src={r.posterUrl} alt={r.title} className="w-full aspect-[2/3] object-cover" />
                                            ) : (
                                                <div className="w-full aspect-[2/3] bg-stadium-dark flex items-center justify-center">
                                                    <Tv size={24} className="text-text-muted" />
                                                </div>
                                            )}
                                            <div className="p-2">
                                                <p className="text-xs font-bold truncate">{r.title}</p>
                                                <p className="text-xs text-text-muted">{r.year}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fetched Data */}
                    {formData.tmdbId > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div>
                                {formData.posterUrl && (
                                    <img src={formData.posterUrl} alt={formData.title} className="w-full rounded-2xl shadow-2xl" />
                                )}
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                                    <h2 className="text-2xl font-black mb-2">{formData.title}</h2>
                                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} /> {formData.firstAirDate}
                                        </span>
                                        {formData.rating > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Star size={14} className="text-accent-gold" /> {formData.rating.toFixed(1)}
                                            </span>
                                        )}
                                        <span>{formData.numberOfSeasons} Seasons</span>
                                        <span>{formData.numberOfEpisodes} Episodes</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {formData.genres.map((g) => (
                                            <span key={g} className="px-2 py-1 bg-stadium-hover rounded text-xs">{g}</span>
                                        ))}
                                    </div>
                                    <p className="text-text-secondary text-sm mb-4">{formData.overview}</p>

                                    {/* Translations */}
                                    <div className="bg-stadium-dark p-4 rounded-xl border border-border-subtle mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-sm">Somali Translation</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <input
                                                value={(formData as any).titleSomali || ""}
                                                onChange={(e) => setFormData({ ...formData, titleSomali: e.target.value } as any)}
                                                placeholder="Ciwaan Somali"
                                                className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                            />
                                            <textarea
                                                value={(formData as any).overviewSomali || ""}
                                                onChange={(e) => setFormData({ ...formData, overviewSomali: e.target.value } as any)}
                                                placeholder="Faahfaahin Somali..."
                                                rows={4}
                                                className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                                    <h3 className="font-bold border-b border-border-strong pb-3">Settings</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { key: "isDubbed", label: "Af-Somali", color: "accent-green" },
                                            { key: "isPremium", label: "Premium", color: "accent-gold" },
                                            { key: "isPublished", label: "Published", color: "blue-500" },
                                        ].map(({ key, label, color }) => (
                                            <div key={key} className="p-4 bg-stadium-dark rounded-xl">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{label}</span>
                                                    <button
                                                        onClick={() => setFormData({ ...formData, [key]: !(formData as any)[key] })}
                                                        className={`w-12 h-6 rounded-full relative ${(formData as any)[key] ? `bg-${color}` : "bg-border-strong"}`}
                                                    >
                                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(formData as any)[key] ? "right-1" : "left-1"}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                                    <h3 className="font-bold border-b border-border-strong pb-3 mb-4">Genre Tags (for Recommendations)</h3>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {formData.tags.map((tag, i) => (
                                            <span key={i} className="flex items-center gap-1 px-3 py-1 bg-accent-green/20 rounded-full text-accent-green text-xs font-bold">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, idx) => idx !== i) })}
                                                    className="hover:text-white"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                        {formData.tags.length === 0 && <p className="text-xs text-text-muted italic">No tags added yet</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            id="seriesTagsInput"
                                            type="text"
                                            placeholder="fanproj, hindi af somali, 2025"
                                            className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const input = e.target as HTMLInputElement;
                                                    const val = input.value.trim();
                                                    if (val) {
                                                        const newTags = val.split(",").map(t => t.trim().toLowerCase()).filter(t => t && !formData.tags.includes(t));
                                                        if (newTags.length > 0) {
                                                            setFormData({ ...formData, tags: [...formData.tags, ...newTags] });
                                                        }
                                                        input.value = "";
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const input = document.getElementById("seriesTagsInput") as HTMLInputElement;
                                                const val = input?.value.trim();
                                                if (val) {
                                                    const newTags = val.split(",").map(t => t.trim().toLowerCase()).filter(t => t && !formData.tags.includes(t));
                                                    if (newTags.length > 0) {
                                                        setFormData({ ...formData, tags: [...formData.tags, ...newTags] });
                                                    }
                                                    input.value = "";
                                                }
                                            }}
                                            className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold text-sm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const commonTags = "anproj, fanproj nxt, hindi af somali, fanproj afsomali, streamnxt fanproj, fanproj afsomali 2025, fanproj hindi af somali, hindi af somali fanproj, fanprojnxt, fanproj.com, streamnxt, saafi films, fanproj play, mysomali, astaan films hindi af somali, filim hindi afsomali 2025, fanprojnet, fanbroj, fanproj net, film hindi af somali, fanproj aflaam, hindi afsomali, filim hindi afsomali, fanbaroj, fanproj films, zee films tv, zee films, astaan films, saafi films hindi af somali, www.fanproj.com hindi af somali, hindi af somali cusub 2025, fanproj nxt af somali, hindi af somali cusub, dhurandhar af somali, www.fanproj.com, fanproj af somali, mysomali fanproj, fanproj 2025, fanproj tv, fanproj stream nxt, fanproj.net, stream nxt fanproj, fanprojplay, fanproj next, faanproj, saafi films fanproj, fanbaroj af somali, fanproj.nxt, zee films tv af somali, streamnxt hindi af somali, hindi af somali fanproj 2025, somfilms, fanparoj, fanproj .com, fanproj production, fanproj com, film hindi af somali 2025, streamnxt af somali, filim hindi afsomali fanproj 2025, hindi af somali mysomali, fanproj musalsal, fanproj hindi af somali telegram link, fanproj telegram, fanproj.com 2025, famproj, aflaam fanproj, www fanproj.com, zee films af somali, fanproj aflaam.com, saafifilms, musalsal af somali, streamnxt fanproj 2025, film hindi af somali fanproj, dhurandhar afsomali, zee films afsomali, fanproj somali, asal24 hindi af somali, fanproj nxt 2025, baaghi 4 afsomali, filim hindi afsomali 2025 telegram, rashka vip hindi af somali, saafi films musalsal, faanproj.com, war 2 afsomali, fanproj streamnxt, filin hindi af somali, hindi af somali.com, hindi afsomali 2025, tere ishq mein afsomali, streamnxt #hindi af somali, fanoroj, fanproj. com, hindi fanproj, fanproj hindi af somali 2025, salaar afsomali, fanproj american, hindi af somali mysomali, fanproj musalsal turkish, fanproj.com hindi afsomali";
                                            const newTags = commonTags.split(",").map(t => t.trim().toLowerCase()).filter(t => t && !formData.tags.includes(t));
                                            if (newTags.length > 0) {
                                                setFormData({ ...formData, tags: [...formData.tags, ...newTags] });
                                            }
                                        }}
                                        className="w-full mt-3 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-bold hover:bg-blue-500/20 transition-all"
                                    >
                                        + Add Common SEO Tags
                                    </button>
                                    {formData.tags.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, tags: [] })}
                                            className="text-xs text-red-400 mt-3 hover:underline"
                                        >
                                            Clear all tags
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!id && formData.tmdbId === 0 && (
                        <div className="text-center py-20">
                            <Tv size={64} className="mx-auto mb-4 text-text-muted/30" />
                            <p className="text-text-muted">Search TMDB above to auto-fill series data</p>
                        </div>
                    )}
                </>
            )}

            {/* TAB: EPISODES */}
            {activeTab === "episodes" && id && (
                <div className="space-y-6">
                    {/* Season Loop */}
                    {Array.from({ length: existingSeries?.numberOfSeasons || 1 }).map((_, i) => {
                        const seasonNum = i + 1;
                        const episodes = episodesData?.[seasonNum] || [];
                        const isSyncing = syncing === seasonNum;

                        return (
                            <div key={seasonNum} className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                                <div className="p-4 bg-stadium-dark flex items-center justify-between border-b border-border-strong">
                                    <h3 className="font-bold text-lg">Season {seasonNum}</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleSyncSeason(seasonNum);
                                            }}
                                            disabled={isSyncing}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                        >
                                            {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                            Sync from TMDB
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    {episodes.length === 0 ? (
                                        <div className="text-center py-8 text-text-muted">
                                            No episodes loaded. Click sync to fetch from TMDB.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {episodes.map((ep) => (
                                                <div
                                                    key={ep._id}
                                                    className="flex items-center gap-4 p-3 bg-stadium-hover rounded-lg hover:ring-1 hover:ring-border-subtle transition-all"
                                                >
                                                    <div className="relative w-16 aspect-video bg-black rounded overflow-hidden flex-shrink-0">
                                                        {ep.stillUrl ? (
                                                            <img src={ep.stillUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-text-muted">
                                                                <Play size={12} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-accent-green px-2 py-0.5 bg-accent-green/10 rounded">
                                                                E{ep.episodeNumber}
                                                            </span>
                                                            <h4 className="font-bold text-sm truncate">{ep.title}</h4>
                                                        </div>
                                                        <p className="text-xs text-text-muted truncate mt-1">
                                                            {ep.embeds.length} embed links • {ep.runtime} min
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingEpisode(ep)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Episode Editor Modal */}
            {editingEpisode && (
                <EpisodeEditor
                    episode={editingEpisode}
                    onClose={() => setEditingEpisode(null)}
                    onSave={() => setEditingEpisode(null)}
                />
            )}
        </div>
    );
}
