"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
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
    Play,
    Upload,
    PenLine,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import EpisodeEditor from "@/components/admin/EpisodeEditor";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
    params?: Promise<{ id: string }>;
}

export default function SeriesFormPage({ params }: Props) {
    const router = useRouter();
    const idParams = params ? use(params) : null;
    const id = idParams?.id;

    const { data: existingSeries, mutate: mutateSeries } = useSWR(
        id ? `/api/series?id=${id}` : null,
        fetcher
    );

    // Fetch episodes grouped by season
    const { data: episodesRaw, mutate: mutateEpisodes } = useSWR(
        id ? `/api/series?slug=${existingSeries?.slug || ""}&includeEpisodes=true` : null,
        async (url) => {
            if (!existingSeries?.slug) return null;
            const res = await fetch(`/api/series?slug=${existingSeries.slug}`);
            const data = await res.json();
            return data?.episodes || [];
        }
    );

    // Group episodes by season
    const episodesData: Record<number, any[]> = {};
    if (episodesRaw) {
        for (const ep of episodesRaw) {
            const sn = ep.seasonNumber || 1;
            if (!episodesData[sn]) episodesData[sn] = [];
            episodesData[sn].push(ep);
        }
    }

    const [activeTab, setActiveTab] = useState<"details" | "episodes">("details");
    const [sourceMode, setSourceMode] = useState<"tmdb" | "manual">("tmdb");
    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [uploadingBackdrop, setUploadingBackdrop] = useState(false);

    const [tmdbInput, setTmdbInput] = useState("");
    const [searching, setSearching] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [syncing, setSyncing] = useState(0);
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
        isPublished: false,
        tags: [] as string[],
    });

    useEffect(() => {
        if (existingSeries && existingSeries.title) {
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
                genres: existingSeries.genres || [],
                cast: existingSeries.cast || [],
                numberOfSeasons: existingSeries.numberOfSeasons || existingSeries.totalSeasons || 0,
                numberOfEpisodes: existingSeries.numberOfEpisodes || existingSeries.totalEpisodes || 0,
                titleSomali: existingSeries.titleSomali || "",
                overviewSomali: existingSeries.overviewSomali || "",
                isDubbed: existingSeries.isDubbed || false,
                isPremium: existingSeries.isPremium || false,
                isPublished: existingSeries.isPublished || false,
                tags: existingSeries.tags || [],
            });
        }
    }, [existingSeries]);

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    };

    const handleImageUpload = async (file: File, type: "poster" | "backdrop") => {
        if (type === "poster") setUploadingPoster(true);
        else setUploadingBackdrop(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.url) {
                setFormData((prev) => ({
                    ...prev,
                    [type === "poster" ? "posterUrl" : "backdropUrl"]: data.url,
                }));
            } else {
                alert("Upload failed");
            }
        } catch {
            alert("Upload failed");
        } finally {
            if (type === "poster") setUploadingPoster(false);
            else setUploadingBackdrop(false);
        }
    };

    const handleSearch = async () => {
        if (!tmdbInput.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(tmdbInput)}&type=tv`);
            const data = await res.json();
            setSearchResults(data.results || []);
            setShowSearch(true);
        } catch (err) {
            console.error(err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleFetchTMDB = async (tmdbId: number) => {
        setFetching(true);
        setShowSearch(false);
        try {
            const res = await fetch(`/api/tmdb/fetch?tmdbId=${tmdbId}&type=tv`);
            const data = await res.json();
            setFormData({
                ...formData,
                slug: data.slug,
                tmdbId: data.tmdbId,
                title: data.title,
                overview: data.overview,
                posterUrl: data.posterUrl,
                backdropUrl: data.backdropUrl || "",
                firstAirDate: data.firstAirDate || data.releaseDate || "",
                lastAirDate: data.lastAirDate || "",
                status: data.status || "",
                rating: data.rating || 0,
                genres: data.genres || [],
                cast: data.cast || [],
                numberOfSeasons: data.numberOfSeasons || data.totalSeasons || 0,
                numberOfEpisodes: data.numberOfEpisodes || data.totalEpisodes || 0,
            });
        } catch (err) {
            console.error(err);
            alert("Failed to fetch from TMDB");
        }
        setFetching(false);
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            alert("Title is required");
            return;
        }
        if (!formData.slug && formData.title) {
            formData.slug = generateSlug(formData.title);
        }

        try {
            if (id) {
                await fetch("/api/series", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id,
                        isDubbed: formData.isDubbed,
                        isPremium: formData.isPremium,
                        isPublished: formData.isPublished,
                        titleSomali: formData.titleSomali || undefined,
                        overviewSomali: formData.overviewSomali || undefined,
                        tags: formData.tags,
                    }),
                });
                mutateSeries();
            } else {
                const res = await fetch("/api/series", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...formData,
                        tmdbId: formData.tmdbId || undefined,
                        backdropUrl: formData.backdropUrl || undefined,
                        lastAirDate: formData.lastAirDate || undefined,
                        rating: formData.rating || undefined,
                        titleSomali: formData.titleSomali || undefined,
                        overviewSomali: formData.overviewSomali || undefined,
                        tags: formData.tags,
                    }),
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    alert(errData.error || "Failed to create series");
                    return;
                }
                const newSeries = await res.json();
                router.push(`/kism/series/${newSeries._id}`);
                return;
            }
            if (!id) router.push("/kism/series");
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
            const res = await fetch(
                `/api/admin/import-movie?tmdbId=${existingSeries.tmdbId}&type=tv&season=${seasonNum}`
            );
            if (!res.ok) {
                alert(`TMDB fetch failed (status ${res.status})`);
                setSyncing(0);
                return;
            }
            const data = await res.json();

            const existingEps = episodesData?.[seasonNum] || [];
            const newEpisodes = (data.episodes || []).filter((ep: any) =>
                !existingEps.some((existing: any) => existing.episodeNumber === ep.episodeNumber)
            );

            if (newEpisodes.length === 0) {
                alert("All episodes already imported.");
            } else {
                // Create episodes via API
                for (const ep of newEpisodes) {
                    await fetch("/api/episodes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            seriesId: id,
                            seasonNumber: seasonNum,
                            ...ep,
                        }),
                    });
                }
                mutateEpisodes();
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
                    <Link href="/kism/series" className="p-2 bg-stadium-elevated rounded-lg">
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
                    {/* Source Mode Toggle + Search/Manual */}
                    {!id && (
                        <>
                            <div className="flex bg-stadium-elevated rounded-xl p-1 border border-border-strong w-fit">
                                <button
                                    onClick={() => setSourceMode("tmdb")}
                                    className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${sourceMode === "tmdb" ? "bg-purple-500 text-white" : "text-text-secondary hover:text-white"}`}
                                >
                                    <Search size={16} /> Search TMDB
                                </button>
                                <button
                                    onClick={() => setSourceMode("manual")}
                                    className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${sourceMode === "manual" ? "bg-orange-500 text-white" : "text-text-secondary hover:text-white"}`}
                                >
                                    <PenLine size={16} /> Add Manually
                                </button>
                            </div>

                            {/* TMDB Search */}
                            {sourceMode === "tmdb" && (
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

                            {/* Manual Entry Form */}
                            {sourceMode === "manual" && !formData.title && (
                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 space-y-6">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <PenLine className="text-orange-400" />
                                        Add Series Manually
                                    </h3>
                                    <p className="text-sm text-text-muted">Fill in the series details below. Upload a poster and backdrop image.</p>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Title *</label>
                                            <input
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
                                                placeholder="Series title..."
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-secondary uppercase font-bold block mb-2">First Air Date</label>
                                            <input
                                                type="date"
                                                value={formData.firstAirDate}
                                                onChange={(e) => setFormData({ ...formData, firstAirDate: e.target.value })}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Overview</label>
                                        <textarea
                                            value={formData.overview}
                                            onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                                            placeholder="Series description..."
                                            rows={4}
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Seasons</label>
                                            <input
                                                type="number"
                                                value={formData.numberOfSeasons || ""}
                                                onChange={(e) => setFormData({ ...formData, numberOfSeasons: parseInt(e.target.value) || 0 })}
                                                placeholder="1"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Episodes</label>
                                            <input
                                                type="number"
                                                value={formData.numberOfEpisodes || ""}
                                                onChange={(e) => setFormData({ ...formData, numberOfEpisodes: parseInt(e.target.value) || 0 })}
                                                placeholder="12"
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            >
                                                <option value="">Select...</option>
                                                <option value="Returning Series">Returning Series</option>
                                                <option value="Ended">Ended</option>
                                                <option value="Canceled">Canceled</option>
                                                <option value="In Production">In Production</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Genres */}
                                    <div>
                                        <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Genres (comma separated)</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.genres.map((g, i) => (
                                                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded text-purple-400 text-xs font-bold">
                                                    {g}
                                                    <button type="button" onClick={() => setFormData({ ...formData, genres: formData.genres.filter((_, idx) => idx !== i) })} className="hover:text-white">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Drama, Action, Comedy"
                                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const input = e.target as HTMLInputElement;
                                                    const val = input.value.trim();
                                                    if (val) {
                                                        const newGenres = val.split(",").map(g => g.trim()).filter(g => g && !formData.genres.includes(g));
                                                        if (newGenres.length > 0) setFormData({ ...formData, genres: [...formData.genres, ...newGenres] });
                                                        input.value = "";
                                                    }
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Image Uploads */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Poster Image</label>
                                            <div className="bg-stadium-dark border border-border-subtle rounded-xl p-4">
                                                {formData.posterUrl ? (
                                                    <div className="relative">
                                                        <img src={formData.posterUrl} alt="Poster" className="w-full max-w-[200px] rounded-lg mx-auto" />
                                                        <button type="button" onClick={() => setFormData({ ...formData, posterUrl: "" })} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-stadium-hover rounded-lg transition-colors">
                                                        {uploadingPoster ? <Loader2 size={32} className="animate-spin text-orange-400 mb-2" /> : <Upload size={32} className="text-text-muted mb-2" />}
                                                        <span className="text-sm text-text-muted">{uploadingPoster ? "Uploading..." : "Click to upload poster"}</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "poster"); }} />
                                                    </label>
                                                )}
                                                <input
                                                    value={formData.posterUrl}
                                                    onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                                                    placeholder="Or paste image URL..."
                                                    className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm mt-3"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Backdrop Image</label>
                                            <div className="bg-stadium-dark border border-border-subtle rounded-xl p-4">
                                                {formData.backdropUrl ? (
                                                    <div className="relative">
                                                        <img src={formData.backdropUrl} alt="Backdrop" className="w-full rounded-lg" />
                                                        <button type="button" onClick={() => setFormData({ ...formData, backdropUrl: "" })} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-stadium-hover rounded-lg transition-colors">
                                                        {uploadingBackdrop ? <Loader2 size={32} className="animate-spin text-orange-400 mb-2" /> : <Upload size={32} className="text-text-muted mb-2" />}
                                                        <span className="text-sm text-text-muted">{uploadingBackdrop ? "Uploading..." : "Click to upload backdrop"}</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "backdrop"); }} />
                                                    </label>
                                                )}
                                                <input
                                                    value={formData.backdropUrl}
                                                    onChange={(e) => setFormData({ ...formData, backdropUrl: e.target.value })}
                                                    placeholder="Or paste image URL..."
                                                    className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm mt-3"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!formData.title) { alert("Title is required"); return; }
                                            if (!formData.slug) setFormData({ ...formData, slug: generateSlug(formData.title) });
                                        }}
                                        disabled={!formData.title}
                                        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Plus size={18} /> Continue to Settings
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Data Preview & Edit */}
                    {(formData.tmdbId > 0 || formData.title) && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                {formData.posterUrl ? (
                                    <img src={formData.posterUrl} alt={formData.title} className="w-full rounded-2xl shadow-2xl" />
                                ) : (
                                    <div className="w-full aspect-[2/3] bg-stadium-elevated rounded-2xl flex items-center justify-center">
                                        <Tv size={48} className="text-text-muted/30" />
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 px-4 py-2.5 bg-stadium-elevated border border-border-subtle rounded-lg cursor-pointer hover:bg-stadium-hover transition-colors text-sm">
                                        {uploadingPoster ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                        {uploadingPoster ? "Uploading..." : "Upload Poster"}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "poster"); }} />
                                    </label>
                                    <label className="flex items-center gap-2 px-4 py-2.5 bg-stadium-elevated border border-border-subtle rounded-lg cursor-pointer hover:bg-stadium-hover transition-colors text-sm">
                                        {uploadingBackdrop ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                        {uploadingBackdrop ? "Uploading..." : "Upload Backdrop"}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "backdrop"); }} />
                                    </label>
                                </div>
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
                                                value={formData.titleSomali || ""}
                                                onChange={(e) => setFormData({ ...formData, titleSomali: e.target.value })}
                                                placeholder="Ciwaan Somali"
                                                className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                            />
                                            <textarea
                                                value={formData.overviewSomali || ""}
                                                onChange={(e) => setFormData({ ...formData, overviewSomali: e.target.value })}
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
                                            type="text"
                                            placeholder="Add tag and press Enter..."
                                            className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                    if (val && !formData.tags.includes(val)) {
                                                        setFormData({ ...formData, tags: [...formData.tags, val] });
                                                        (e.target as HTMLInputElement).value = "";
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!id && !formData.title && sourceMode === "tmdb" && (
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
                    {/* Add Season Button */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={async () => {
                                const newCount = (existingSeries?.numberOfSeasons || existingSeries?.totalSeasons || 1) + 1;
                                await fetch("/api/series", {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id, numberOfSeasons: newCount }),
                                });
                                mutateSeries();
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> Add Season
                        </button>
                    </div>
                    {Array.from({ length: existingSeries?.numberOfSeasons || existingSeries?.totalSeasons || 1 }).map((_, i) => {
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
                                            onClick={() => {
                                                const nextEpNum = (episodes.length > 0
                                                    ? Math.max(...episodes.map((e: any) => e.episodeNumber || 0)) + 1
                                                    : 1);
                                                setEditingEpisode({
                                                    _id: null,
                                                    seriesId: id,
                                                    seasonNumber: seasonNum,
                                                    episodeNumber: nextEpNum,
                                                    title: "",
                                                    overview: "",
                                                    embeds: [],
                                                    isPublished: true,
                                                });
                                            }}
                                            className="px-3 py-1.5 bg-accent-green hover:bg-accent-green/80 text-black rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={12} /> Add Episode
                                        </button>
                                        {existingSeries?.tmdbId && (
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
                                        )}
                                    </div>
                                </div>

                                <div className="p-4">
                                    {episodes.length === 0 ? (
                                        <div className="text-center py-8 text-text-muted">
                                            {existingSeries?.tmdbId
                                                ? "No episodes loaded. Click sync to fetch from TMDB or add manually."
                                                : "No episodes yet. Click \"Add Episode\" to create one."}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {episodes.map((ep: any) => (
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
                                                            {ep.embeds?.length || 0} embed links • {ep.runtime || 0} min
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingEpisode(ep)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm(`Delete S${ep.seasonNumber}E${ep.episodeNumber} - ${ep.title}?`)) return;
                                                            await fetch(`/api/episodes?id=${ep._id}`, { method: "DELETE" });
                                                            mutateEpisodes();
                                                        }}
                                                        className="p-2 hover:bg-accent-red/20 rounded-lg text-text-secondary hover:text-accent-red"
                                                    >
                                                        <Trash2 size={16} />
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
                    onSave={() => { setEditingEpisode(null); mutateEpisodes(); }}
                />
            )}
        </div>
    );
}
