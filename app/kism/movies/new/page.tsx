"use client";

import useSWR from "swr";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    Save,
    ChevronLeft,
    Search,
    Loader2,
    Plus,
    X,
    Film,
    Star,
    Clock,
    Calendar,
    Bell,
    Upload,
    PenLine,
} from "lucide-react";
import Link from "next/link";

interface Props {
    params?: Promise<{ id: string }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MovieFormPage({ params }: Props) {
    const router = useRouter();
    const idParams = params ? use(params) : null;
    const id = idParams?.id;

    const { data: existingMovie } = useSWR(id ? `/api/movies?id=${id}&full=true` : null, fetcher);

    const [sourceMode, setSourceMode] = useState<"tmdb" | "manual">("tmdb");
    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [uploadingBackdrop, setUploadingBackdrop] = useState(false);

    const [tmdbInput, setTmdbInput] = useState("");
    const [searching, setSearching] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [tmdbPage, setTmdbPage] = useState(1);
    const [tmdbTotalPages, setTmdbTotalPages] = useState(1);
    const [tmdbTotalResults, setTmdbTotalResults] = useState(0);
    const [lastQuery, setLastQuery] = useState("");

    const [formData, setFormData] = useState({
        slug: "",
        tmdbId: 0,
        imdbId: "",
        title: "",
        titleSomali: "",
        overview: "",
        overviewSomali: "",
        posterUrl: "",
        backdropUrl: "",
        releaseDate: "",
        runtime: 0,
        rating: 0,
        voteCount: 0,
        genres: [] as string[],
        cast: [] as { name: string; character: string; profileUrl?: string }[],
        director: "",
        embeds: [{ label: "Server 1", url: "", quality: "720p", type: "iframe" }] as { label: string; url: string; quality?: string; type?: string }[],
        isDubbed: false,
        isPremium: false,
        isPublished: false,
        isFeatured: false,
        isTop10: false,
        top10Order: 0,
        trailerUrl: "",
        downloadUrl: "",
        tags: [] as string[],
        category: "",
    });
    const [saving, setSaving] = useState(false);
    const [sendPush, setSendPush] = useState(false);

    useEffect(() => {
        if (existingMovie && "title" in existingMovie) {
            setFormData({
                slug: existingMovie.slug,
                tmdbId: existingMovie.tmdbId,
                imdbId: existingMovie.imdbId || "",
                title: existingMovie.title,
                titleSomali: existingMovie.titleSomali || "",
                overview: existingMovie.overview,
                overviewSomali: existingMovie.overviewSomali || "",
                posterUrl: existingMovie.posterUrl,
                backdropUrl: existingMovie.backdropUrl || "",
                releaseDate: existingMovie.releaseDate,
                runtime: existingMovie.runtime || 0,
                rating: existingMovie.rating || 0,
                voteCount: existingMovie.voteCount || 0,
                genres: existingMovie.genres,
                cast: existingMovie.cast,
                director: existingMovie.director || "",
                embeds: existingMovie.embeds?.length > 0 ? existingMovie.embeds : [{ label: "Server 1", url: "", quality: "720p", type: "iframe" }],
                isDubbed: existingMovie.isDubbed,
                isPremium: existingMovie.isPremium,
                isPublished: existingMovie.isPublished,
                isFeatured: existingMovie.isFeatured || false,
                isTop10: existingMovie.isTop10 || false,
                top10Order: existingMovie.top10Order || 0,
                trailerUrl: existingMovie.trailerUrl || "",
                downloadUrl: existingMovie.downloadUrl || "",
                tags: existingMovie.tags || [],
                category: existingMovie.category || "",
            });
        }
    }, [existingMovie]);

    // Handle Edit Mode Loading
    if (id && existingMovie === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin w-10 h-10 text-accent-green" />
            </div>
        );
    }

    // Generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    };

    // Upload image handler
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

    // Search TMDB
    const handleSearch = async (page = 1) => {
        const query = page > 1 ? lastQuery : tmdbInput.trim();
        if (!query) return;
        setSearching(true);
        try {
            const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=movie&page=${page}`);
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : data?.results || []);
            setTmdbPage(data?.page || 1);
            setTmdbTotalPages(data?.totalPages || 1);
            setTmdbTotalResults(data?.totalResults || 0);
            setLastQuery(query);
            setShowSearch(true);
        } catch (err) {
            console.error(err);
        }
        setSearching(false);
    };

    // Fetch from TMDB by ID
    const handleFetchTMDB = async (tmdbId: number) => {
        setFetching(true);
        setShowSearch(false);
        try {
            const res = await fetch(`/api/tmdb/fetch?tmdbId=${tmdbId}`);
            const data = await res.json();
            setFormData({
                ...formData,
                slug: data.slug,
                tmdbId: data.tmdbId,
                imdbId: data.imdbId || "",
                title: data.title,
                overview: data.overview,
                posterUrl: data.posterUrl,
                backdropUrl: data.backdropUrl || "",
                releaseDate: data.releaseDate,
                runtime: data.runtime || 0,
                rating: data.rating || 0,
                voteCount: data.voteCount || 0,
                genres: data.genres,
                cast: data.cast,
                director: data.director || "",
                trailerUrl: data.trailerUrl || "",
            });
            setTmdbInput("");
        } catch (err) {
            console.error(err);
            alert("Failed to fetch from TMDB");
        }
        setFetching(false);
    };

    // Submit
    const handleSubmit = async () => {
        if (saving) return;

        if (!formData.title) {
            alert("Title is required");
            return;
        }
        // Auto-generate slug for manual entries
        if (!formData.slug && formData.title) {
            formData.slug = generateSlug(formData.title);
        }
        if (!formData.embeds[0]?.url) {
            alert("Add at least one embed link");
            return;
        }

        setSaving(true);
        try {
            const typedEmbeds = formData.embeds.map(e => ({
                label: e.label,
                url: e.url,
                quality: e.quality || undefined,
                type: (e.type as "m3u8" | "iframe" | "video") || "iframe",
            }));

            const payload = {
                ...(id ? { id } : {}),
                slug: formData.slug,
                tmdbId: formData.tmdbId || undefined,
                imdbId: formData.imdbId || undefined,
                title: formData.title,
                titleSomali: formData.titleSomali || undefined,
                overview: formData.overview,
                overviewSomali: formData.overviewSomali || undefined,
                posterUrl: formData.posterUrl,
                backdropUrl: formData.backdropUrl || undefined,
                releaseDate: formData.releaseDate,
                runtime: formData.runtime || undefined,
                rating: formData.rating || undefined,
                voteCount: formData.voteCount || undefined,
                genres: formData.genres,
                cast: formData.cast,
                director: formData.director || undefined,
                embeds: typedEmbeds,
                isDubbed: formData.isDubbed,
                isPremium: formData.isPremium,
                isPublished: formData.isPublished,
                isFeatured: formData.isFeatured,
                isTop10: formData.isTop10 || undefined,
                top10Order: formData.top10Order || undefined,
                trailerUrl: formData.trailerUrl || undefined,
                downloadUrl: formData.downloadUrl || undefined,
                tags: formData.tags,
                category: formData.category || undefined,
            };

            const res = await fetch("/api/movies", {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Failed to ${id ? "update" : "create"} movie`);
            }
            // Send push notification if enabled
            if (sendPush && formData.isPublished) {
                try {
                    const movieName = formData.titleSomali || formData.title;
                    const year = formData.releaseDate?.split("-")[0] || "";
                    const genreText = formData.genres.slice(0, 2).join(" & ");
                    const pushRes = await fetch("/api/push", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: formData.isDubbed
                                ? `🔥 CUSUB: ${movieName} (${year}) AF SOMALI`
                                : `🎬 NEW: ${movieName} (${year})`,
                            body: formData.isDubbed
                                ? `${genreText} — Hadda ku daawo Fanbroj! Bilaash 🍿`
                                : `${genreText} — Now streaming on Fanbroj! 🍿`,
                            broadcast: true,
                            url: `https://fanbroj.net/movies/${formData.slug}-af-somali`,
                            image: formData.posterUrl || "https://fanbroj.net/img/lm-bg.jpg",
                        }),
                    });
                    const pushData = await pushRes.json();
                    if (pushRes.ok) {
                        alert(`Movie saved! Push sent to ${pushData.sent || 0} users.`);
                    } else {
                        alert(`Movie saved but push failed: ${pushData.error || "Unknown error"}`);
                    }
                } catch (pushErr) {
                    console.error("Push notification error:", pushErr);
                    alert("Movie saved but push notification failed to send.");
                }
            }

            router.push("/kism/movies");
        } catch (err) {
            console.error("Movie save error:", err);
            alert("Khalad Farsamo: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setSaving(false);
        }
    };

    // Embed management
    const addEmbed = () => {
        if (formData.embeds.length < 10) {
            setFormData({
                ...formData,
                embeds: [...formData.embeds, { label: `Server ${formData.embeds.length + 1}`, url: "", quality: "720p", type: "iframe" }],
            });
        }
    };

    const removeEmbed = (i: number) => {
        setFormData({
            ...formData,
            embeds: formData.embeds.filter((_, idx) => idx !== i),
        });
    };

    const updateEmbed = (i: number, field: string, value: string) => {
        const embeds = [...formData.embeds];
        (embeds[i] as any)[field] = value;
        setFormData({ ...formData, embeds });
    };

    return (
        <div className="max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/kism/movies" className="p-2 bg-stadium-elevated rounded-lg">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-black">{id ? "EDIT MOVIE" : "NEW MOVIE"}</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {saving ? "Saving..." : (id ? "Update" : "Publish")}
                </button>
            </div>

            {/* Source Mode Toggle - Only show on new */}
            {!id && (
                <>
                    <div className="flex bg-stadium-elevated rounded-xl p-1 border border-border-strong w-fit">
                        <button
                            onClick={() => setSourceMode("tmdb")}
                            className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${sourceMode === "tmdb" ? "bg-blue-500 text-white" : "text-text-secondary hover:text-white"}`}
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
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Film className="text-blue-400" />
                                Step 1: Search TMDB
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={tmdbInput}
                                    onChange={(e) => setTmdbInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search movie name or enter TMDB ID..."
                                    className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                                <button
                                    onClick={() => handleSearch()}
                                    disabled={searching}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2"
                                >
                                    {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                    Search
                                </button>
                                <button
                                    onClick={() => {
                                        const num = parseInt(tmdbInput);
                                        if (num) handleFetchTMDB(num);
                                    }}
                                    disabled={fetching}
                                    className="px-6 py-3 bg-accent-green text-black rounded-lg font-bold"
                                >
                                    {fetching ? <Loader2 size={18} className="animate-spin" /> : "Fetch by ID"}
                                </button>
                            </div>

                            {/* Search Results */}
                            {showSearch && searchResults.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm text-text-muted">{tmdbTotalResults} results found</p>
                                        {tmdbTotalPages > 1 && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleSearch(tmdbPage - 1)}
                                                    disabled={tmdbPage <= 1 || searching}
                                                    className="px-3 py-1 bg-stadium-dark rounded text-sm disabled:opacity-30"
                                                >
                                                    Prev
                                                </button>
                                                <span className="text-sm text-text-muted">
                                                    {tmdbPage} / {tmdbTotalPages}
                                                </span>
                                                <button
                                                    onClick={() => handleSearch(tmdbPage + 1)}
                                                    disabled={tmdbPage >= tmdbTotalPages || searching}
                                                    className="px-3 py-1 bg-stadium-dark rounded text-sm disabled:opacity-30"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                        {searchResults.map((r) => (
                                            <button
                                                key={r.id}
                                                onClick={() => handleFetchTMDB(r.id)}
                                                className="bg-stadium-elevated rounded-lg overflow-hidden text-left hover:ring-2 ring-accent-green transition-all group"
                                            >
                                                {r.posterUrl ? (
                                                    <img src={r.posterUrl} alt={r.title} className="w-full aspect-[2/3] object-cover group-hover:brightness-110" />
                                                ) : (
                                                    <div className="w-full aspect-[2/3] bg-stadium-dark flex items-center justify-center">
                                                        <Film size={24} className="text-text-muted" />
                                                    </div>
                                                )}
                                                <div className="p-2">
                                                    <p className="text-xs font-bold truncate">{r.title}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-xs text-text-muted">{r.year}</span>
                                                        {r.rating && (
                                                            <span className="text-xs text-accent-gold flex items-center gap-0.5">
                                                                <Star size={10} className="fill-accent-gold" /> {r.rating}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manual Entry Form */}
                    {sourceMode === "manual" && !formData.title && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <PenLine className="text-orange-400" />
                                Add Movie Manually
                            </h3>
                            <p className="text-sm text-text-muted">Fill in the movie details below. Upload a poster and backdrop image.</p>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Title */}
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Title *</label>
                                    <input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
                                        placeholder="Movie title..."
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>
                                {/* Release Date */}
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Release Date</label>
                                    <input
                                        type="date"
                                        value={formData.releaseDate}
                                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>
                            </div>

                            {/* Overview */}
                            <div>
                                <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Overview</label>
                                <textarea
                                    value={formData.overview}
                                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                                    placeholder="Movie description..."
                                    rows={4}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Runtime */}
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Runtime (min)</label>
                                    <input
                                        type="number"
                                        value={formData.runtime || ""}
                                        onChange={(e) => setFormData({ ...formData, runtime: parseInt(e.target.value) || 0 })}
                                        placeholder="120"
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>
                                {/* Rating */}
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Rating (0-10)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={formData.rating || ""}
                                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                                        placeholder="7.5"
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>
                                {/* Director */}
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Director</label>
                                    <input
                                        value={formData.director}
                                        onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                                        placeholder="Director name..."
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                                    />
                                </div>
                            </div>

                            {/* Genres */}
                            <div>
                                <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Genres (comma separated)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.genres.map((g, i) => (
                                        <span key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded text-blue-400 text-xs font-bold">
                                            {g}
                                            <button type="button" onClick={() => setFormData({ ...formData, genres: formData.genres.filter((_, idx) => idx !== i) })} className="hover:text-white">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Action, Drama, Thriller"
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
                                {/* Poster Upload */}
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Poster Image</label>
                                    <div className="bg-stadium-dark border border-border-subtle rounded-xl p-4">
                                        {formData.posterUrl ? (
                                            <div className="relative">
                                                <img src={formData.posterUrl} alt="Poster" className="w-full max-w-[200px] rounded-lg mx-auto" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, posterUrl: "" })}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-stadium-hover rounded-lg transition-colors">
                                                {uploadingPoster ? (
                                                    <Loader2 size={32} className="animate-spin text-orange-400 mb-2" />
                                                ) : (
                                                    <Upload size={32} className="text-text-muted mb-2" />
                                                )}
                                                <span className="text-sm text-text-muted">{uploadingPoster ? "Uploading..." : "Click to upload poster"}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, "poster");
                                                    }}
                                                />
                                            </label>
                                        )}
                                        {/* Or paste URL */}
                                        <input
                                            value={formData.posterUrl}
                                            onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                                            placeholder="Or paste image URL..."
                                            className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm mt-3"
                                        />
                                    </div>
                                </div>
                                {/* Backdrop Upload */}
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Backdrop Image</label>
                                    <div className="bg-stadium-dark border border-border-subtle rounded-xl p-4">
                                        {formData.backdropUrl ? (
                                            <div className="relative">
                                                <img src={formData.backdropUrl} alt="Backdrop" className="w-full rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, backdropUrl: "" })}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-stadium-hover rounded-lg transition-colors">
                                                {uploadingBackdrop ? (
                                                    <Loader2 size={32} className="animate-spin text-orange-400 mb-2" />
                                                ) : (
                                                    <Upload size={32} className="text-text-muted mb-2" />
                                                )}
                                                <span className="text-sm text-text-muted">{uploadingBackdrop ? "Uploading..." : "Click to upload backdrop"}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, "backdrop");
                                                    }}
                                                />
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

                            {/* Confirm button to proceed to metadata/embeds */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!formData.title) {
                                        alert("Title is required");
                                        return;
                                    }
                                    if (!formData.slug) {
                                        setFormData({ ...formData, slug: generateSlug(formData.title) });
                                    }
                                }}
                                disabled={!formData.title}
                                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                                <Plus size={18} /> Continue to Settings & Embeds
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Data Preview & Edit */}
            {(formData.tmdbId > 0 || formData.title) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Poster */}
                    <div className="space-y-4">
                        {formData.posterUrl ? (
                            <img
                                src={formData.posterUrl}
                                alt={formData.title}
                                className="w-full rounded-2xl shadow-2xl"
                            />
                        ) : (
                            <div className="w-full aspect-[2/3] bg-stadium-elevated rounded-2xl flex items-center justify-center">
                                <Film size={48} className="text-text-muted/30" />
                            </div>
                        )}
                        {/* Poster/Backdrop upload for all modes */}
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

                    {/* Right: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title */}
                        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                            <h2 className="text-2xl font-black mb-2">{formData.title}</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-4">
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} /> {formData.releaseDate}
                                </span>
                                {formData.runtime > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} /> {formData.runtime} min
                                    </span>
                                )}
                                {formData.rating > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Star size={14} className="text-accent-gold" /> {formData.rating.toFixed(1)}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {formData.genres.map((g) => (
                                    <span key={g} className="px-2 py-1 bg-stadium-hover rounded text-xs">
                                        {g}
                                    </span>
                                ))}
                            </div>
                            <p className="text-text-secondary text-sm leading-relaxed mb-4">{formData.overview}</p>

                            {/* Translations */}
                            <div className="bg-stadium-dark p-4 rounded-xl border border-border-subtle mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-sm">Somali Translation</h4>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        value={formData.titleSomali}
                                        onChange={(e) => setFormData({ ...formData, titleSomali: e.target.value })}
                                        placeholder="Ciwaan Somali"
                                        className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                    />
                                    <textarea
                                        value={formData.overviewSomali}
                                        onChange={(e) => setFormData({ ...formData, overviewSomali: e.target.value })}
                                        placeholder="Faahfaahin Somali..."
                                        rows={4}
                                        className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Admin Settings */}
                        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                            <h3 className="font-bold border-b border-border-strong pb-3">Settings</h3>

                            {/* Toggles */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { key: "isDubbed", label: "Af-Somali", color: "accent-green" },
                                    { key: "isPremium", label: "Premium", color: "accent-gold" },
                                    { key: "isPublished", label: "Published", color: "blue-500" },
                                    { key: "isFeatured", label: "Fanproj Play", color: "purple-500" },
                                ].map(({ key, label, color }) => (
                                    <div key={key} className="p-4 bg-stadium-dark rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{label}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({ ...formData, [key]: !(formData as any)[key] })
                                                }
                                                className={`w-12 h-6 rounded-full relative ${(formData as any)[key] ? `bg-${color}` : "bg-border-strong"
                                                    }`}
                                            >
                                                <div
                                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(formData as any)[key] ? "right-1" : "left-1"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Push Notification Toggle */}
                            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell size={18} className="text-blue-400" />
                                        <span className="font-medium">Send Push Notification</span>
                                        <span className="text-xs text-text-muted">(broadcast to all users)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSendPush(!sendPush)}
                                        className={`w-12 h-6 rounded-full relative ${sendPush ? "bg-blue-500" : "bg-border-strong"}`}
                                    >
                                        <div
                                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${sendPush ? "right-1" : "left-1"}`}
                                        />
                                    </button>
                                </div>
                                {sendPush && !formData.isPublished && (
                                    <p className="text-xs text-yellow-400 mt-2">Note: Push will only send if movie is published</p>
                                )}
                                {sendPush && id && (
                                    <p className="text-xs text-blue-400 mt-2">Push notification will be sent when you click Update</p>
                                )}
                            </div>

                            {/* Category Dropdown */}
                            <div className="p-4 bg-stadium-dark rounded-xl">
                                <label className="font-medium block mb-2">Category</label>
                                <select
                                    value={formData.category || ""}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-stadium-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Select Category</option>
                                    <option value="hindi-af-somali">Hindi Af Somali</option>
                                    <option value="american-af-somali">American Af Somali</option>
                                    <option value="english-aflaam">English Aflaam</option>
                                    <option value="hindi-qaraami">Hindi Qaraami</option>
                                    <option value="old-is-gold">Old is Gold</option>
                                    <option value="fanproj">Fanproj</option>
                                    <option value="fanproj-play">Fanproj Play</option>
                                    <option value="2026">2026</option>
                                    <option value="2025">2025</option>
                                    <option value="2024">2024</option>
                                    <option value="musalsal">Musalsal</option>
                                </select>
                            </div>

                            {/* Top 10 Section */}
                            <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🏆</span>
                                        <span className="font-bold text-red-400">Top 10</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData({ ...formData, isTop10: !formData.isTop10 })
                                        }
                                        className={`w-12 h-6 rounded-full relative ${formData.isTop10 ? "bg-red-500" : "bg-border-strong"
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isTop10 ? "right-1" : "left-1"
                                                }`}
                                        />
                                    </button>
                                </div>
                                {formData.isTop10 && (
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm text-text-secondary">Position (1-10):</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={formData.top10Order || ""}
                                            onChange={(e) => setFormData({ ...formData, top10Order: parseInt(e.target.value) || 0 })}
                                            placeholder="1"
                                            className="w-20 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm text-center"
                                        />
                                        <span className="text-xs text-text-muted">Lower number = higher rank</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Extra Links (Trailer & Download) */}
                        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                            <h3 className="font-bold border-b border-border-strong pb-3">Extra Links</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Trailer URL (YouTube)</label>
                                    <input
                                        value={formData.trailerUrl}
                                        onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-secondary uppercase font-bold block mb-2">Download URL</label>
                                    <input
                                        value={formData.downloadUrl}
                                        onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                                        placeholder="https://mega.nz/..."
                                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tags - Bulk add with comma */}
                        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                            <h3 className="font-bold border-b border-border-strong pb-3 mb-4">SEO Tags/Keywords</h3>
                            <p className="text-xs text-text-muted mb-3">Add multiple tags separated by comma (e.g. fanproj, hindi af somali, 2025)</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {formData.tags.map((tag, i) => (
                                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-accent-green/20 rounded text-accent-green text-xs font-bold">
                                        #{tag}
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
                                    id="tagsInput"
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
                                        const input = document.getElementById("tagsInput") as HTMLInputElement;
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

                        {/* Embed Links */}
                        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Step 2: Add Embed Links</h3>
                                {formData.embeds.length < 10 && (
                                    <button onClick={addEmbed} className="text-accent-green text-sm flex items-center gap-1">
                                        <Plus size={14} /> Add Link
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {formData.embeds.map((embed, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            value={embed.label}
                                            onChange={(e) => updateEmbed(i, "label", e.target.value)}
                                            placeholder="Label"
                                            className="w-24 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                        />
                                        <input
                                            value={embed.url}
                                            onChange={(e) => updateEmbed(i, "url", e.target.value)}
                                            placeholder="Iframe URL"
                                            className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                                        />
                                        <select
                                            value={(embed as any).type || "iframe"}
                                            onChange={(e) => updateEmbed(i, "type", e.target.value)}
                                            className="w-24 bg-stadium-dark border border-border-subtle rounded-lg px-2 py-2 text-sm"
                                        >
                                            <option value="iframe">Iframe</option>
                                            <option value="m3u8">M3U8</option>
                                            <option value="video">Video</option>
                                        </select>
                                        <select
                                            value={embed.quality || "720p"}
                                            onChange={(e) => updateEmbed(i, "quality", e.target.value)}
                                            className="w-24 bg-stadium-dark border border-border-subtle rounded-lg px-2 py-2 text-sm"
                                        >
                                            <option value="360p">360p</option>
                                            <option value="480p">480p</option>
                                            <option value="720p">720p</option>
                                            <option value="1080p">1080p</option>
                                            <option value="4K">4K</option>
                                        </select>
                                        {formData.embeds.length > 1 && (
                                            <button onClick={() => removeEmbed(i)} className="text-text-muted hover:text-accent-red">
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!id && !formData.title && sourceMode === "tmdb" && (
                <div className="text-center py-20">
                    <Film size={64} className="mx-auto mb-4 text-text-muted/30" />
                    <p className="text-text-muted">Search TMDB above to auto-fill movie data</p>
                </div>
            )}
        </div>
    );
}
