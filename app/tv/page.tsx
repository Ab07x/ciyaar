"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { TVMovie, TVMovieCard } from "@/components/tv/TVMovieCard";
import { Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type MovieListResponse = TVMovie[] | {
    movies?: TVMovie[];
    total?: number;
    page?: number;
    pageSize?: number;
};
type PairSessionStatus = "pending" | "paired" | "expired" | "cancelled";
type PairSessionState = {
    code: string;
    pairUrl: string;
    expiresAt: number;
    pollIntervalMs: number;
};
type PageChip = number | "ellipsis-left" | "ellipsis-right";

function formatCountdown(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function buildPageChips(currentPage: number, totalPages: number): PageChip[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const chips: PageChip[] = [1];

    if (currentPage <= 3) {
        chips.push(2, 3, 4, "ellipsis-right", totalPages);
        return chips;
    }

    if (currentPage >= totalPages - 2) {
        chips.push("ellipsis-left", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        return chips;
    }

    chips.push("ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages);
    return chips;
}

function TVPageContent() {
    const searchParams = useSearchParams();
    const isGuest = searchParams.get("guest") === "true";
    const { deviceId, isPremium, isLoading } = useUser();

    const [pairSession, setPairSession] = useState<PairSessionState | null>(null);
    const [pairError, setPairError] = useState<string | null>(null);
    const [isPairLoading, setIsPairLoading] = useState(false);
    const [clockNow, setClockNow] = useState(() => Date.now());
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: moviesResponse } = useSWR<MovieListResponse>(
        `/api/movies?isPublished=true&page=${currentPage}&pageSize=${pageSize}`,
        fetcher
    );

    const movies = Array.isArray(moviesResponse) ? moviesResponse : (moviesResponse?.movies || []);
    const totalMovies = Array.isArray(moviesResponse) ? movies.length : Number(moviesResponse?.total || movies.length);
    const totalPages = Math.max(1, Math.ceil(totalMovies / pageSize));
    const pageChips = useMemo(() => buildPageChips(currentPage, totalPages), [currentPage, totalPages]);
    const featuredMovie = movies[0];
    const shouldShowPairOverlay = !isGuest && !isPremium && !isLoading;

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const createPairSession = useCallback(async () => {
        if (!deviceId) return;

        setIsPairLoading(true);
        setPairError(null);

        try {
            const res = await fetch("/api/tv/pair", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tvDeviceId: deviceId }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Pairing code lama helin.");
            }

            if (!data?.code || !data?.pairUrl || !data?.expiresAt) {
                throw new Error("Pairing response is incomplete");
            }

            setPairSession({
                code: data.code,
                pairUrl: data.pairUrl,
                expiresAt: Number(data.expiresAt),
                pollIntervalMs: Number(data.pollIntervalMs || 3000),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Pairing code lama helin.";
            setPairError(message);
            setPairSession(null);
        } finally {
            setIsPairLoading(false);
        }
    }, [deviceId]);

    useEffect(() => {
        if (!shouldShowPairOverlay || !deviceId) {
            setPairSession(null);
            setPairError(null);
            return;
        }

        if (pairSession) return;

        void createPairSession();
    }, [shouldShowPairOverlay, deviceId, pairSession, createPairSession]);

    useEffect(() => {
        if (!shouldShowPairOverlay || !pairSession?.code) return;

        let active = true;
        let polling = false;

        const pollPairingStatus = async () => {
            if (!active || polling) return;
            polling = true;

            try {
                const res = await fetch(`/api/tv/pair?code=${encodeURIComponent(pairSession.code)}`, {
                    cache: "no-store",
                });
                const data = await res.json();

                if (!active) return;

                if (!res.ok) {
                    if (res.status === 404 || res.status === 410) {
                        await createPairSession();
                        return;
                    }
                    setPairError(data?.error || "Pairing check failed.");
                    return;
                }

                const status = data?.status as PairSessionStatus;

                if (status === "paired") {
                    window.location.reload();
                    return;
                }

                if (status === "expired" || status === "cancelled") {
                    await createPairSession();
                    return;
                }

                setPairSession((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        expiresAt: Number(data?.expiresAt || prev.expiresAt),
                    };
                });
            } catch {
                if (active) {
                    setPairError("Network error while waiting for pairing.");
                }
            } finally {
                polling = false;
            }
        };

        const interval = window.setInterval(pollPairingStatus, pairSession.pollIntervalMs);
        void pollPairingStatus();

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [shouldShowPairOverlay, pairSession?.code, pairSession?.pollIntervalMs, createPairSession]);

    useEffect(() => {
        if (!shouldShowPairOverlay || !pairSession?.code) return;

        const interval = window.setInterval(() => {
            setClockNow(Date.now());
        }, 1000);

        return () => window.clearInterval(interval);
    }, [shouldShowPairOverlay, pairSession?.code]);

    const qrImageUrl = useMemo(() => {
        if (!pairSession?.pairUrl) return "";
        return `https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=2&data=${encodeURIComponent(pairSession.pairUrl)}`;
    }, [pairSession?.pairUrl]);

    const secondsRemaining = pairSession
        ? Math.max(0, Math.ceil((pairSession.expiresAt - clockNow) / 1000))
        : 0;

    if (!moviesResponse) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="relative h-screen overflow-hidden bg-black text-white">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/bgcdn.webp"
                    alt="Background"
                    fill
                    className="object-cover opacity-30"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            {/* Main Content Area */}
            <main className="relative z-10 h-full overflow-y-auto overflow-x-hidden p-8 scroll-smooth">

                {/* Hero Section */}
                {featuredMovie && (
                    <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden mb-12 group focus-within:ring-4 focus-within:ring-white transition-all">
                        <Image
                            src={(featuredMovie as any).backdropUrl || featuredMovie.posterUrl || "/bgcdn.webp"}
                            alt={featuredMovie.title}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

                        <div className="absolute bottom-0 left-0 p-12 max-w-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                {featuredMovie.isPremium && (
                                    <span className="bg-yellow-500 text-black font-bold px-3 py-1 rounded text-sm">PREMIUM</span>
                                )}
                                {featuredMovie.releaseDate && (
                                    <span className="text-white/80 font-medium">
                                        {new Date(featuredMovie.releaseDate).getFullYear()}
                                    </span>
                                )}
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">HD</span>
                            </div>
                            <h1 className="text-5xl font-black mb-4 leading-tight">
                                {featuredMovie.titleSomali || featuredMovie.title}
                            </h1>
                            <p className="text-lg text-white/70 line-clamp-2 mb-8">
                                {(featuredMovie as any).overview}
                            </p>
                            <div className="flex gap-4">
                                <Link
                                    href={`/tv/movies/${featuredMovie.slug}/play`}
                                    className="bg-white text-black px-8 py-3 rounded-xl font-bold text-xl flex items-center gap-2 hover:bg-gray-200 focus:bg-red-600 focus:text-white focus:outline-none transition-colors"
                                >
                                    <Play fill="currentColor" /> Play Now
                                </Link>
                                <button className="bg-white/10 backdrop-blur px-8 py-3 rounded-xl font-bold text-xl hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors">
                                    More Info
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories / Rows */}
                <section className="space-y-10 pb-20">
                    {movies.length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-white/70">
                            Weli filim lama gelin TV section-ka.
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-white/90">Latest Movies</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {movies.slice(0, 10).map((movie) => (
                                <TVMovieCard key={movie._id} movie={movie} isPremium={isPremium || false} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-white/90">Trending Now</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {movies.slice(10, 20).map((movie) => (
                                <TVMovieCard key={movie._id} movie={movie} isPremium={isPremium || false} />
                            ))}
                        </div>
                    </div>

                    {totalMovies > 0 && (
                        <div className="mt-2 flex flex-col items-center gap-4">
                            <p className="text-sm text-white/65">
                                Page {currentPage} / {totalPages} • {totalMovies} movies
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage <= 1}
                                    className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                            {totalPages > 1 && (
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {pageChips.map((chip, index) => {
                                        if (chip === "ellipsis-left" || chip === "ellipsis-right") {
                                            return (
                                                <span
                                                    key={`${chip}-${index}`}
                                                    className="px-2 text-sm text-white/45"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }

                                        const isActiveChip = chip === currentPage;
                                        return (
                                            <button
                                                key={`page-${chip}`}
                                                type="button"
                                                onClick={() => setCurrentPage(chip)}
                                                className={`min-w-9 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${isActiveChip
                                                    ? "border-red-500 bg-red-600 text-white"
                                                    : "border-white/20 bg-white/10 text-white/85 hover:bg-white/20"
                                                    }`}
                                            >
                                                {chip}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </section>

            </main>

            {/* TV Pairing Overlay */}
            {shouldShowPairOverlay && (
                <div className="absolute inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 md:p-12">
                    <div className="w-full max-w-6xl rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl p-6 md:p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div className="space-y-5">
                                <p className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-semibold text-yellow-300">
                                    Premium TV Login
                                </p>
                                <h1 className="text-4xl md:text-5xl font-black text-white">Fanbroj TV</h1>
                                <p className="text-xl text-white/80">
                                    Scan QR-kan si TV-ga ugu xirmo account-kaaga isla markiiba.
                                </p>
                                <ol className="space-y-2 text-white/70 text-base md:text-lg list-decimal list-inside">
                                    <li>Fur camera-ga telefoonkaaga.</li>
                                    <li>Scan QR code-ka ama geli code-ka hoose.</li>
                                    <li>Riix <span className="font-semibold text-white">Link this TV</span> oo daawasho bilaaw.</li>
                                </ol>
                                {pairSession?.code && (
                                    <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                                        <p className="text-sm text-white/60 mb-1">Pairing Code</p>
                                        <p className="text-3xl md:text-4xl font-black tracking-[0.18em] text-green-300">{pairSession.code}</p>
                                        <p className="mt-2 text-sm text-white/70">
                                            Code expires in <span className="font-bold text-yellow-300">{formatCountdown(secondsRemaining)}</span>
                                        </p>
                                    </div>
                                )}

                                {pairError && (
                                    <p className="text-red-300 text-sm md:text-base">{pairError}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => void createPairSession()}
                                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-semibold"
                                    >
                                        Refresh Code
                                    </button>
                                    <Link
                                        href="/tv?guest=true"
                                        className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        Continue as Guest
                                    </Link>
                                </div>
                            </div>

                            <div className="justify-self-center">
                                <div className="rounded-3xl bg-white p-4 shadow-2xl">
                                    {pairSession?.pairUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={qrImageUrl}
                                            alt="TV pairing QR"
                                            className="h-72 w-72 md:h-80 md:w-80 rounded-2xl"
                                        />
                                    ) : (
                                        <div className="h-72 w-72 md:h-80 md:w-80 rounded-2xl bg-gray-900 flex items-center justify-center text-gray-500 text-sm text-center px-4">
                                            {isPairLoading ? "Generating QR..." : "QR code not available"}
                                        </div>
                                    )}
                                </div>
                                {pairSession?.pairUrl && (
                                    <p className="mt-3 text-center text-xs md:text-sm text-white/60 break-all">
                                        {pairSession.pairUrl}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TVPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        }>
            <TVPageContent />
        </Suspense>
    );
}
