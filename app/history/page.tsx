"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { Clock3, History, PlayCircle } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

type HistoryItem = {
    _id?: string;
    contentType?: "movie" | "episode" | "match";
    contentId?: string;
    seriesId?: string;
    progressSeconds?: number;
    durationSeconds?: number;
    progressPercent?: number;
    updatedAt?: number;
    details?: {
        slug?: string;
        titleSomali?: string;
        title?: string;
        name?: string;
        league?: string;
        leagueName?: string;
        teamA?: string;
        teamB?: string;
        posterUrl?: string;
        thumbnailUrl?: string;
        backdropUrl?: string;
        [key: string]: unknown;
    } | null;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getItemTitle(item: HistoryItem) {
    const details = item.details || {};
    if (item.contentType === "match") {
        const teamA = String(details.teamA || "").trim();
        const teamB = String(details.teamB || "").trim();
        if (teamA && teamB) return `${teamA} vs ${teamB}`;
    }
    return details.titleSomali || details.title || details.name || item.contentId || "Content";
}

function getItemSubtitle(item: HistoryItem) {
    const details = item.details || {};
    if (item.contentType === "episode") {
        return details.titleSomali || details.title || "Series episode";
    }
    if (item.contentType === "match") {
        return details.league || details.leagueName || "Live Match";
    }
    return details.title || details.titleSomali || "Movie";
}

function getItemHref(item: HistoryItem) {
    const details = item.details || {};
    if (item.contentType === "movie") {
        return `/movies/${details.slug || item.contentId || ""}`;
    }
    if (item.contentType === "episode") {
        return `/series/${details.slug || item.seriesId || item.contentId || ""}`;
    }
    if (item.contentType === "match") {
        return `/match/${details.slug || item.contentId || ""}`;
    }
    return "/";
}

function getItemImage(item: HistoryItem) {
    const details = item.details || {};
    return details.posterUrl || details.thumbnailUrl || details.backdropUrl || null;
}

function formatProgress(item: HistoryItem) {
    const percent = Math.max(0, Math.min(100, Number(item.progressPercent || 0)));
    return `${percent}%`;
}

export default function WatchHistoryPage() {
    const { userId, isLoading: isUserLoading } = useUser();
    const { data: history, isLoading: isHistoryLoading } = useSWR<HistoryItem[]>(
        userId ? `/api/watch/history?userId=${encodeURIComponent(userId)}&limit=80` : null,
        fetcher
    );

    const isLoading = isUserLoading || (userId && isHistoryLoading);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="h-8 w-56 bg-white/10 rounded mb-8 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-52 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <History className="w-12 h-12 text-text-muted" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Watch History</h1>
                <p className="text-text-secondary max-w-md mb-8">
                    Fadlan soo gal (login) si aad u aragto taariikhda daawashadaada.
                </p>
                <Link
                    href="/pay?auth=login"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-green text-black font-bold px-5 py-3 hover:brightness-110 transition-all"
                >
                    <PlayCircle size={18} />
                    Login / Sign Up
                </Link>
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <History className="w-12 h-12 text-text-muted" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Watch History</h1>
                <p className="text-text-secondary max-w-md mb-8">
                    Marka aad daawato filim, musalsal ama ciyaar, halkan ayuu kasoo muuqan doonaa.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-green text-black font-bold px-5 py-3 hover:brightness-110 transition-all"
                >
                    <PlayCircle size={18} />
                    Bilow Daawashada
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between gap-3 mb-8">
                <h1 className="text-3xl font-black flex items-center gap-3">
                    <History className="text-accent-gold" />
                    Watch History
                </h1>
                <Link
                    href="/mylist?tab=mylist"
                    className="text-sm font-bold text-text-secondary hover:text-white transition-colors"
                >
                    My List →
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item) => {
                    const href = getItemHref(item);
                    const image = getItemImage(item);
                    const title = getItemTitle(item);
                    const subtitle = getItemSubtitle(item);
                    const updatedAt = Number(item.updatedAt || 0);
                    const progressText = formatProgress(item);
                    const progressPercent = Math.max(0, Math.min(100, Number(item.progressPercent || 0)));

                    return (
                        <Link
                            key={String(item._id || `${item.contentType}:${item.contentId}`)}
                            href={href}
                            className="group rounded-2xl border border-white/10 bg-stadium-elevated overflow-hidden hover:border-accent-green/40 transition-all"
                        >
                            <div className="relative h-40 bg-stadium-dark">
                                {image ? (
                                    <Image
                                        src={image}
                                        alt={title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                                        <PlayCircle size={34} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <span className="absolute top-2 right-2 text-xs font-black uppercase bg-black/70 text-white px-2 py-1 rounded-md">
                                    {item.contentType === "episode" ? "Series" : item.contentType}
                                </span>
                            </div>

                            <div className="p-4">
                                <p className="font-bold line-clamp-1">{title}</p>
                                <p className="text-sm text-text-secondary line-clamp-1">{subtitle}</p>

                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                                        <span>Progress</span>
                                        <span>{progressText}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-accent-green"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-text-muted flex items-center gap-1">
                                    <Clock3 size={12} />
                                    {updatedAt > 0 ? new Date(updatedAt).toLocaleString() : "Waqti lama hayo"}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
