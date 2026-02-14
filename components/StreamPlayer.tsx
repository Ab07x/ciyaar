"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Pause, Maximize, Minimize, Volume2, VolumeX, Volume1,
    Settings, RefreshCw, AlertCircle, Loader2, SkipForward, SkipBack,
    ChevronUp, PictureInPicture2, X, Lock, Zap, Clock3, MessageCircle
} from "lucide-react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { BufferIndicator } from "./player/BufferIndicator";
import { MobileGestures } from "./player/MobileGestures";

// Types
export interface StreamSource {
    url: string;
    label?: string;
    type?: "m3u8" | "mpd" | "iframe" | "video" | "auto";
    isProtected?: boolean;
}

interface StreamPlayerProps {
    source: StreamSource | string;
    poster?: string;
    loadingPoster?: string; // Background image while loading
    className?: string;
    onError?: (error: string) => void;
    onReady?: () => void;
    showSkipIntro?: boolean;
    skipIntroTime?: number;
    showNextEpisode?: boolean;
    nextEpisodeTitle?: string;
    onNextEpisode?: () => void;
    showRefreshMessage?: boolean; // Show bilingual refresh message
    trackParams?: {
        contentType: "movie" | "episode" | "match";
        contentId: string;
        seriesId?: string;
        duration?: number;
    };
    conversionGate?: {
        enabled: boolean;
        previewSeconds?: number;
        reachedDailyLimit?: boolean;
        dailyLimit?: number;
        usedToday?: number;
        qualityCap?: number;
        timerSpeedMultiplier?: number;
        ctaHref?: string;
        contentLabel?: string;
        paywallTitle?: string;
        paywallMessage?: string;
        primaryCtaLabel?: string;
        whatsappMessage?: string;
        forceRedirectOnLock?: boolean;
        redirectDelayMs?: number;
    };
    onPreviewStart?: () => void;
    onGateLocked?: () => void;
}

interface QualityLevel {
    height: number;
    width: number;
    bitrate: number;
    index: number;
}

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const PREVIEW_TIMER_DRAIN_MULTIPLIER_DEFAULT = 12;

// Helper: Detect stream type from URL
function detectStreamType(url: string): "m3u8" | "mpd" | "iframe" | "video" {
    const urlLower = url.toLowerCase();
    // AWS IVS URLs
    if (urlLower.includes("live-video.net")) return "m3u8";
    // Standard HLS
    if (urlLower.includes(".m3u8") || urlLower.includes("m3u8")) return "m3u8";
    if (urlLower.includes(".mpd")) return "mpd";
    if (urlLower.includes(".mp4") || urlLower.includes(".webm") || urlLower.includes(".ogg")) return "video";
    return "iframe";
}

// Helper: Decode protected URL (Base64)
function decodeProtectedUrl(url: string): string {
    try {
        if (/^[A-Za-z0-9+/=]+$/.test(url) && url.length > 20) {
            return atob(url);
        }
    } catch { }
    return url;
}

// Helper: Encode URL for protection
export function encodeStreamUrl(url: string): string {
    return btoa(url);
}

// Format time helper
function formatTime(time: number): string {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function StreamPlayer({
    source,
    poster,
    loadingPoster,
    className,
    onError,
    onReady,
    showSkipIntro = false,
    skipIntroTime = 90,
    showNextEpisode = false,
    nextEpisodeTitle,
    onNextEpisode,
    showRefreshMessage = false,
    trackParams,
    conversionGate,
    onPreviewStart,
    onGateLocked,
}: StreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { userId } = useUser();

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPiPActive, setIsPiPActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [qualities, setQualities] = useState<QualityLevel[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [streamType, setStreamType] = useState<"m3u8" | "mpd" | "iframe" | "video">("iframe");
    const [resolvedUrl, setResolvedUrl] = useState("");
    const [canShowSkipIntro, setCanShowSkipIntro] = useState(false);
    const [canShowNextEpisode, setCanShowNextEpisode] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
    const [isReadyToPlay, setIsReadyToPlay] = useState(false); // Stream loaded and ready

    // Double-tap state
    const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
    const tapTimeoutRef = useRef<any>(null);
    const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

    // Detect mobile on mount
    useEffect(() => {
        const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(checkMobile);
        if (checkMobile) {
            setShowControls(true); // Always show controls on mobile initially
        }
    }, []);

    // Landscape auto-fullscreen for mobile
    useEffect(() => {
        if (!isMobile || streamType === "iframe" || conversionGate?.enabled) return;

        const handleOrientationChange = () => {
            const container = containerRef.current;
            if (!container) return;

            const isLandscape = window.innerWidth > window.innerHeight;

            // Auto-enter fullscreen in landscape
            if (isLandscape && isPlaying && !document.fullscreenElement) {
                // Try to enter fullscreen
                if (container.requestFullscreen) {
                    container.requestFullscreen().catch(() => { });
                } else if ((container as any).webkitRequestFullscreen) {
                    (container as any).webkitRequestFullscreen().catch(() => { });
                }
            }
            // Auto-exit fullscreen in portrait
            else if (!isLandscape && document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', handleOrientationChange);
        };
    }, [isMobile, isPlaying, streamType, conversionGate?.enabled]);

    // API-based data fetching
    const { data: resumePoint } = useSWR(
        (trackParams && userId) ? `/api/watch/resume?userId=${userId}&contentType=${trackParams.contentType}&contentId=${trackParams.contentId}` : null,
        (url: string) => fetch(url).then(r => r.json()).then(d => d.position || 0)
    );
    const { data: settings } = useSWR("/api/settings", (url: string) => fetch(url).then(r => r.json()));
    const { isPremium } = useUser();

    const [showPaywall, setShowPaywall] = useState(false);
    const [isGateHardLocked, setIsGateHardLocked] = useState(false);
    const hasTriggeredPreviewStartRef = useRef(false);
    const hasNotifiedGateLockRef = useRef(false);
    const hasRedirectedOnGateRef = useRef(false);
    const previewSessionStartedRef = useRef(false);
    const previewAccumulatedSecondsRef = useRef(0);
    const previewTickAtMsRef = useRef<number | null>(null);
    const [previewRemainingSeconds, setPreviewRemainingSeconds] = useState<number | null>(null);

    // Explicitly cast settings to any to avoid TS errors with new schema fields not yet picked up
    const freePreviewLimit = ((settings as any)?.freeMatchPreviewMinutes || 15) * 60; // default 15 mins
    const moviePreviewLimit = conversionGate?.previewSeconds || (((settings as any)?.freeMoviePreviewMinutes || 26) * 60);
    const conversionGateEnabled = !!conversionGate?.enabled && !isPremium;
    const qualityCap = conversionGate?.qualityCap || 0;
    const moviePreviewPersistenceKey = conversionGateEnabled
        && (trackParams?.contentType === "movie" || trackParams?.contentType === "episode" || trackParams?.contentType === "match")
        && trackParams?.contentId
        ? `fanbroj:preview-elapsed:${trackParams.contentType}:${trackParams.contentId}`
        : null;
    const previewTimerMultiplierRaw = Number(
        conversionGate?.timerSpeedMultiplier
        || (settings as any)?.freeMovieTimerSpeedMultiplier
        || PREVIEW_TIMER_DRAIN_MULTIPLIER_DEFAULT
    );
    const previewTimerMultiplier = Number.isFinite(previewTimerMultiplierRaw) && previewTimerMultiplierRaw > 0
        ? previewTimerMultiplierRaw
        : PREVIEW_TIMER_DRAIN_MULTIPLIER_DEFAULT;

    const readPersistedPreviewElapsed = useCallback(() => {
        if (!moviePreviewPersistenceKey || typeof window === "undefined") return 0;
        try {
            const storedValue = window.localStorage.getItem(moviePreviewPersistenceKey);
            const parsedValue = Number(storedValue || 0);
            return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
        } catch {
            return 0;
        }
    }, [moviePreviewPersistenceKey]);

    const writePersistedPreviewElapsed = useCallback((elapsedSeconds: number) => {
        if (!moviePreviewPersistenceKey || typeof window === "undefined") return;
        try {
            const currentStored = readPersistedPreviewElapsed();
            const nextValue = Math.max(currentStored, elapsedSeconds);
            window.localStorage.setItem(moviePreviewPersistenceKey, String(nextValue));
        } catch {
            // Ignore storage failures (private mode / quota limits).
        }
    }, [moviePreviewPersistenceKey, readPersistedPreviewElapsed]);

    const activatePaywallLock = useCallback(() => {
        const video = videoRef.current;
        if (video && !video.paused) {
            video.pause();
        }
        if (video) {
            video.controls = false;
            video.disablePictureInPicture = true;
        }
        setShowPaywall(true);
        setIsGateHardLocked(true);
        setIsPlaying(false);

        const hls = hlsRef.current as any;
        if (hls && typeof hls.stopLoad === "function") {
            try {
                hls.stopLoad();
            } catch {
                // Ignore HLS stop errors.
            }
        }

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }

        const nativeVideo = videoRef.current as any;
        if (nativeVideo?.webkitDisplayingFullscreen && typeof nativeVideo.webkitExitFullscreen === "function") {
            try {
                nativeVideo.webkitExitFullscreen();
            } catch {
                // Ignore iOS native fullscreen exit failures.
            }
        }
    }, []);

    const startPreviewSession = useCallback(() => {
        if (!conversionGateEnabled) return;
        previewSessionStartedRef.current = true;
        previewTickAtMsRef.current = Date.now();
        setPreviewRemainingSeconds((prev) => {
            if (prev !== null) return prev;
            return Math.max(0, Math.ceil(moviePreviewLimit - previewAccumulatedSecondsRef.current));
        });

        if (!hasTriggeredPreviewStartRef.current) {
            hasTriggeredPreviewStartRef.current = true;
            onPreviewStart?.();
        }
    }, [conversionGateEnabled, moviePreviewLimit, onPreviewStart]);

    useEffect(() => {
        if (!conversionGateEnabled) return;
        if (!moviePreviewPersistenceKey) return;

        const persistedElapsed = readPersistedPreviewElapsed();
        if (persistedElapsed <= 0) return;

        previewAccumulatedSecondsRef.current = Math.max(previewAccumulatedSecondsRef.current, persistedElapsed);
        const remainingSeconds = Math.max(0, Math.ceil(moviePreviewLimit - previewAccumulatedSecondsRef.current));
        setPreviewRemainingSeconds(remainingSeconds);

        if (previewAccumulatedSecondsRef.current < moviePreviewLimit) return;
        activatePaywallLock();
    }, [
        conversionGateEnabled,
        moviePreviewPersistenceKey,
        moviePreviewLimit,
        readPersistedPreviewElapsed,
        activatePaywallLock,
    ]);

    // Conversion gate: immediate lock when daily limit is reached.
    useEffect(() => {
        if (!conversionGateEnabled) return;
        if (!conversionGate?.reachedDailyLimit) return;
        activatePaywallLock();
    }, [conversionGateEnabled, conversionGate?.reachedDailyLimit, activatePaywallLock]);

    // Free tier enforcement for live matches.
    useEffect(() => {
        if (trackParams?.contentType !== "match") return;
        if (conversionGateEnabled) return;
        if (isPremium) {
            setShowPaywall(false);
            return;
        }

        if (currentTime < freePreviewLimit) return;
        activatePaywallLock();
    }, [currentTime, isPremium, freePreviewLimit, trackParams?.contentType, conversionGateEnabled, activatePaywallLock]);

    // For iframe sources we cannot read media time reliably, so start preview session on mount.
    useEffect(() => {
        if (!conversionGateEnabled) return;
        if (conversionGate?.reachedDailyLimit) return;
        if (streamType !== "iframe") return;
        startPreviewSession();
    }, [conversionGateEnabled, conversionGate?.reachedDailyLimit, streamType, startPreviewSession]);

    // Unified movie preview enforcement:
    // - media time lock (for direct video/HLS)
    // - accumulated playback time lock (prevents server-switch reset bypass)
    useEffect(() => {
        if (!conversionGateEnabled) return;
        if (conversionGate?.reachedDailyLimit) return;
        if (!previewSessionStartedRef.current) return;
        if (showPaywall) return;

        const interval = window.setInterval(() => {
            const now = Date.now();
            const video = videoRef.current;
            const canAccumulate = streamType === "iframe"
                ? true
                : !!video && !video.paused && !video.ended;

            if (canAccumulate) {
                const lastTick = previewTickAtMsRef.current ?? now;
                const deltaSeconds = Math.max(0, (now - lastTick) / 1000);
                if (deltaSeconds < 15) {
                    previewAccumulatedSecondsRef.current += deltaSeconds * previewTimerMultiplier;
                }
            }
            previewTickAtMsRef.current = now;

            const mediaSeconds = streamType === "iframe" ? 0 : (video?.currentTime || 0);
            const elapsedSeconds = Math.max(previewAccumulatedSecondsRef.current, mediaSeconds);
            writePersistedPreviewElapsed(elapsedSeconds);
            setPreviewRemainingSeconds(Math.max(0, Math.ceil(moviePreviewLimit - elapsedSeconds)));
            if (elapsedSeconds < moviePreviewLimit) return;
            activatePaywallLock();
        }, 500);

        return () => window.clearInterval(interval);
    }, [
        conversionGateEnabled,
        conversionGate?.reachedDailyLimit,
        moviePreviewLimit,
        previewTimerMultiplier,
        writePersistedPreviewElapsed,
        showPaywall,
        streamType,
        activatePaywallLock,
    ]);

    // Aggressive conversion mode: send free users to pricing as soon as lock triggers.
    useEffect(() => {
        if (!showPaywall || !conversionGateEnabled) return;

        if (!hasNotifiedGateLockRef.current) {
            hasNotifiedGateLockRef.current = true;
            onGateLocked?.();
        }

        if (!conversionGate?.forceRedirectOnLock) return;
        if (hasRedirectedOnGateRef.current) return;

        hasRedirectedOnGateRef.current = true;
        const paywallTarget = conversionGate?.ctaHref || "/pricing";
        const delayMs = Math.max(0, Number(conversionGate?.redirectDelayMs ?? 350));

        const redirectTimer = window.setTimeout(() => {
            window.location.assign(paywallTarget);
        }, delayMs);

        return () => window.clearTimeout(redirectTimer);
    }, [
        showPaywall,
        conversionGateEnabled,
        conversionGate?.forceRedirectOnLock,
        conversionGate?.redirectDelayMs,
        conversionGate?.ctaHref,
        onGateLocked,
    ]);

    // Controls timeout
    const controlsTimeoutRef = useRef<any>(null);

    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        // On mobile, keep controls visible longer or always visible
        if (!isMobile) {
            controlsTimeoutRef.current = setTimeout(() => {
                if (isPlaying) setShowControls(false);
            }, 3000);
        }
    }, [isPlaying, isMobile]);

    // Skip intro/next episode logic
    useEffect(() => {
        if (showSkipIntro && currentTime > 5 && currentTime < skipIntroTime) {
            setCanShowSkipIntro(true);
        } else {
            setCanShowSkipIntro(false);
        }

        if (showNextEpisode && duration > 0 && currentTime > duration - 30) {
            setCanShowNextEpisode(true);
        } else {
            setCanShowNextEpisode(false);
        }
    }, [currentTime, duration, showSkipIntro, skipIntroTime, showNextEpisode]);

    // Resume point
    useEffect(() => {
        const video = videoRef.current;
        if (video && resumePoint && resumePoint > 0 && !isPlaying && video.currentTime === 0) {
            video.currentTime = resumePoint;
        }
    }, [resumePoint, resolvedUrl]);

    // Progress saving
    useEffect(() => {
        if (!isPlaying || !trackParams || !userId) return;

        const interval = setInterval(() => {
            const video = videoRef.current;
            if (!video) return;

            const current = video.currentTime;
            const dur = video.duration || trackParams.duration || 0;

            if (current > 5 && dur > 0) {
                fetch("/api/watch/progress", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId,
                        contentType: trackParams.contentType,
                        contentId: trackParams.contentId,
                        seriesId: trackParams.seriesId,
                        progressSeconds: Math.floor(current),
                        durationSeconds: Math.floor(dur),
                    }),
                }).catch(err => console.error("Failed to save progress", err));
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [isPlaying, trackParams, userId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (streamType === "iframe") return;

            const video = videoRef.current;
            if (!video) return;

            switch (e.key.toLowerCase()) {
                case " ":
                case "k":
                    e.preventDefault();
                    togglePlay();
                    break;
                case "f":
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case "m":
                    e.preventDefault();
                    toggleMute();
                    break;
                case "arrowleft":
                    e.preventDefault();
                    seekBackward();
                    break;
                case "arrowright":
                    e.preventDefault();
                    seekForward();
                    break;
                case "arrowup":
                    e.preventDefault();
                    handleVolumeChange(Math.min(1, volume + 0.1));
                    break;
                case "arrowdown":
                    e.preventDefault();
                    handleVolumeChange(Math.max(0, volume - 0.1));
                    break;
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    e.preventDefault();
                    const percent = parseInt(e.key) / 10;
                    video.currentTime = duration * percent;
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [streamType, volume, duration]);

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // PiP change listener
    useEffect(() => {
        const handlePiPChange = () => {
            setIsPiPActive(document.pictureInPictureElement === videoRef.current);
        };

        const video = videoRef.current;
        if (video) {
            video.addEventListener("enterpictureinpicture", handlePiPChange);
            video.addEventListener("leavepictureinpicture", handlePiPChange);
        }

        return () => {
            if (video) {
                video.removeEventListener("enterpictureinpicture", handlePiPChange);
                video.removeEventListener("leavepictureinpicture", handlePiPChange);
            }
        };
    }, []);

    // Resolve source
    useEffect(() => {
        let url = typeof source === "string" ? source : source.url;
        const isProtected = typeof source === "object" && source.isProtected;
        const type = typeof source === "object" && source.type !== "auto" ? source.type : undefined;

        if (isProtected) {
            url = decodeProtectedUrl(url);
        }

        // AUTO-FIX: Upgrade to HTTPS if site is HTTPS to prevent "Network Error" (Mixed Content)
        if (typeof window !== "undefined" && window.location.protocol === "https:" && url.startsWith("http://")) {
            url = url.replace("http://", "https://");
            console.log("Upgraded stream URL to HTTPS to prevent Mixed Content block:", url);
        }

        setResolvedUrl(url);
        setStreamType(type || detectStreamType(url));
    }, [source]);

    useEffect(() => {
        if (!conversionGateEnabled) {
            hasTriggeredPreviewStartRef.current = false;
            hasNotifiedGateLockRef.current = false;
            hasRedirectedOnGateRef.current = false;
            previewSessionStartedRef.current = false;
            previewAccumulatedSecondsRef.current = 0;
            previewTickAtMsRef.current = null;
            setPreviewRemainingSeconds(null);
            setShowPaywall(false);
            setIsGateHardLocked(false);
            return;
        }

        // Keep consumed preview time across server switches; only refresh the tick anchor.
        previewTickAtMsRef.current = Date.now();
    }, [resolvedUrl, conversionGateEnabled]);

    // Prevent iOS native fullscreen for free preview users (fullscreen can bypass overlays).
    useEffect(() => {
        if (!conversionGateEnabled || streamType === "iframe") return;
        const video = videoRef.current as any;
        if (!video) return;

        const handleNativeFullscreenStart = () => {
            if (typeof video.webkitExitFullscreen === "function") {
                try {
                    video.webkitExitFullscreen();
                } catch {
                    // Ignore iOS native fullscreen exit failures.
                }
            }
        };

        video.addEventListener("webkitbeginfullscreen", handleNativeFullscreenStart);
        return () => {
            video.removeEventListener("webkitbeginfullscreen", handleNativeFullscreenStart);
        };
    }, [conversionGateEnabled, streamType]);

    // Initialize HLS.js
    useEffect(() => {
        if (!resolvedUrl || streamType !== "m3u8") return;

        const video = videoRef.current;
        if (!video) return;

        let hls: any = null;

        const initHls = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!(window as any).Hls) {
                    await new Promise<void>((resolve, reject) => {
                        const script = document.createElement("script");
                        script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error("Failed to load HLS.js"));
                        document.head.appendChild(script);
                    });
                }

                const Hls = (window as any).Hls;

                if (Hls.isSupported()) {
                    hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: false,        // Disabled for smooth playback (user accepts 2-5 min delay)
                        backBufferLength: 90,         // Keep 90s of played video
                        maxBufferLength: 120,         // Buffer up to 2 minutes ahead
                        maxMaxBufferLength: 300,      // Allow up to 5 minutes buffer if needed
                        maxBufferSize: 60 * 1000 * 1000, // 60MB buffer
                        maxBufferHole: 0.5,           // Max gap allowed in buffer
                        liveSyncDurationCount: 5,     // Stay 5 segments behind live (30s delay)
                        liveMaxLatencyDurationCount: 15, // Max 15 segments behind (90s)
                        liveDurationInfinity: true,   // Treat as infinite live stream
                        levelLoadingTimeOut: 20000,   // 20s timeout for level loading
                        manifestLoadingTimeOut: 20000,// 20s timeout for manifest
                        fragLoadingTimeOut: 30000,    // 30s timeout for segments
                        levelLoadingMaxRetry: 6,      // Retry level loading 6 times
                        manifestLoadingMaxRetry: 6,   // Retry manifest 6 times
                        fragLoadingMaxRetry: 6,       // Retry segment loading 6 times
                        startFragPrefetch: true,      // Prefetch next segment
                    });

                    hlsRef.current = hls;

                    console.log("[HLS] Loading source:", resolvedUrl);
                    hls.loadSource(resolvedUrl);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, (_: any, data: any) => {
                        setIsLoading(false);
                        setIsReadyToPlay(true); // Mark as ready
                        onReady?.();

                        const levels: QualityLevel[] = hls.levels.map((level: any, index: number) => ({
                            height: level.height,
                            width: level.width,
                            bitrate: level.bitrate,
                            index,
                        }));
                        setQualities(levels);

                        if (conversionGateEnabled && qualityCap > 0 && levels.length > 0) {
                            const allowedLevels = levels.filter((level) => level.height <= qualityCap);
                            if (allowedLevels.length > 0) {
                                const maxAllowedIndex = Math.max(...allowedLevels.map((level) => level.index));
                                hls.autoLevelCapping = maxAllowedIndex;
                                if (hls.currentLevel > maxAllowedIndex) {
                                    hls.currentLevel = maxAllowedIndex;
                                }
                            } else {
                                // If no 720p-or-lower tier exists, force the lowest quality level.
                                hls.autoLevelCapping = 0;
                                hls.currentLevel = 0;
                            }
                        }

                        // Always require user interaction to play (show play button)
                        setNeedsUserInteraction(true);
                        setShowControls(true);
                    });

                    hls.on(Hls.Events.ERROR, (_: any, data: any) => {
                        console.log("[HLS Error]", data.type, data.details, data);
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    console.log("[HLS] Network error, attempting recovery...");
                                    setError("Network error - trying to recover...");
                                    hls.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    console.log("[HLS] Media error, attempting recovery...");
                                    setError("Media error - trying to recover...");
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    console.log("[HLS] Fatal error:", data.details);
                                    setError(`Stream error: ${data.details || "unavailable"}`);
                                    setIsLoading(false);
                                    onError?.("Fatal streaming error");
                                    hls.destroy();
                                    break;
                            }
                        }
                    });

                    hls.on(Hls.Events.LEVEL_SWITCHED, (_: any, data: any) => {
                        setCurrentQuality(data.level);
                    });

                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = resolvedUrl;
                    video.addEventListener("loadedmetadata", () => {
                        setIsLoading(false);
                        setIsReadyToPlay(true); // Mark as ready
                        onReady?.();
                        // Always require user interaction to play (show play button)
                        setNeedsUserInteraction(true);
                        setShowControls(true);
                    });
                } else {
                    setError("HLS not supported in this browser");
                    setIsLoading(false);
                }
            } catch (err) {
                setError("Failed to load stream");
                setIsLoading(false);
                onError?.("Failed to initialize player");
            }
        };

        initHls();

        return () => {
            if (hls) {
                hls.destroy();
                hlsRef.current = null;
            }
        };
    }, [resolvedUrl, streamType, onError, onReady, conversionGateEnabled, qualityCap]);

    // Handle native video
    useEffect(() => {
        if (!resolvedUrl || streamType !== "video") return;

        const video = videoRef.current;
        if (!video) return;

        video.src = resolvedUrl;
        video.load();

        const handleLoaded = () => {
            setIsLoading(false);
            onReady?.();
            // On mobile, require user interaction to play
            if (isMobile) {
                setNeedsUserInteraction(true);
                setShowControls(true);
            } else {
                video.play().catch(() => {
                    setNeedsUserInteraction(true);
                    setShowControls(true);
                });
            }
        };

        const handleError = () => {
            setError("Failed to load video");
            setIsLoading(false);
        };

        video.addEventListener("loadeddata", handleLoaded);
        video.addEventListener("error", handleError);

        return () => {
            video.removeEventListener("loadeddata", handleLoaded);
            video.removeEventListener("error", handleError);
        };
    }, [resolvedUrl, streamType, onError, onReady]);

    // Video event handlers
    useEffect(() => {
        const video = videoRef.current;
        if (!video || streamType === "iframe") return;

        const handlePlay = () => {
            if (showPaywall || isGateHardLocked) {
                video.pause();
                return;
            }
            setIsPlaying(true);
            startPreviewSession();
        };
        const handlePause = () => setIsPlaying(false);
        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => {
            setIsBuffering(false);
            setIsLoading(false);
        };
        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            // Update buffered
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }

            // Hard lock from media clock (important for mobile/native fullscreen paths).
            if (!conversionGateEnabled || conversionGate?.reachedDailyLimit || showPaywall) return;
            if (!previewSessionStartedRef.current) return;

            const now = Date.now();
            const lastTick = previewTickAtMsRef.current ?? now;
            const deltaSeconds = Math.max(0, (now - lastTick) / 1000);
            if (deltaSeconds < 15 && !video.paused && !video.ended) {
                previewAccumulatedSecondsRef.current += deltaSeconds * previewTimerMultiplier;
            }
            previewTickAtMsRef.current = now;

            const elapsedSeconds = Math.max(previewAccumulatedSecondsRef.current, video.currentTime || 0);
            writePersistedPreviewElapsed(elapsedSeconds);
            setPreviewRemainingSeconds(Math.max(0, Math.ceil(moviePreviewLimit - elapsedSeconds)));
            if (elapsedSeconds >= moviePreviewLimit) {
                activatePaywallLock();
            }
        };
        const handleDurationChange = () => setDuration(video.duration);
        const handleVolumeChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted);
        };

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("playing", handlePlaying);
        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("durationchange", handleDurationChange);
        video.addEventListener("volumechange", handleVolumeChange);

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("playing", handlePlaying);
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("durationchange", handleDurationChange);
            video.removeEventListener("volumechange", handleVolumeChange);
        };
    }, [
        startPreviewSession,
        streamType,
        isGateHardLocked,
        conversionGateEnabled,
        conversionGate?.reachedDailyLimit,
        showPaywall,
        previewTimerMultiplier,
        moviePreviewLimit,
        writePersistedPreviewElapsed,
        activatePaywallLock,
    ]);

    // While locked, aggressively pause any resumed playback (iOS fullscreen/native controls bypass guard).
    useEffect(() => {
        if (!showPaywall || !conversionGateEnabled) return;

        const interval = window.setInterval(() => {
            const video = videoRef.current as any;
            if (!video) return;

            if (!video.paused) {
                video.pause();
            }

            if (video.webkitDisplayingFullscreen && typeof video.webkitExitFullscreen === "function") {
                try {
                    video.webkitExitFullscreen();
                } catch {
                    // Ignore iOS native fullscreen exit failures.
                }
            }
        }, 250);

        return () => window.clearInterval(interval);
    }, [showPaywall, conversionGateEnabled]);

    // Controls
    const togglePlay = () => {
        if (showPaywall || isGateHardLocked) return;
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play().then(() => {
                setNeedsUserInteraction(false);
            }).catch((err) => {
                console.error("Play failed:", err);
            });
        } else {
            video.pause();
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
    };

    const handleVolumeChange = (newVolume: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.volume = newVolume;
        if (newVolume > 0 && video.muted) {
            video.muted = false;
        }
    };

    const toggleFullscreen = async () => {
        if (conversionGateEnabled) return;
        const container = containerRef.current;
        if (!container) return;

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                // Try different fullscreen APIs for mobile compatibility
                if (container.requestFullscreen) {
                    await container.requestFullscreen();
                } else if ((container as any).webkitRequestFullscreen) {
                    await (container as any).webkitRequestFullscreen();
                } else if ((container as any).mozRequestFullScreen) {
                    await (container as any).mozRequestFullScreen();
                } else if ((container as any).msRequestFullscreen) {
                    await (container as any).msRequestFullscreen();
                }
            }
        } catch (err) {
            console.error("Fullscreen error:", err);
        }
    };

    const togglePiP = async () => {
        if (conversionGateEnabled) return;
        const video = videoRef.current;
        if (!video) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await video.requestPictureInPicture();
            }
        } catch (err) {
            console.error("PiP error:", err);
        }
    };

    const seekForward = () => {
        if (showPaywall || isGateHardLocked) return;
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.min(duration, video.currentTime + 10);
        showSeekIndicator("right");
    };

    const seekBackward = () => {
        if (showPaywall || isGateHardLocked) return;
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, video.currentTime - 10);
        showSeekIndicator("left");
    };

    const showSeekIndicator = (side: "left" | "right") => {
        setDoubleTapSide(side);
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = setTimeout(() => setDoubleTapSide(null), 500);
    };

    const handleSeek = (time: number) => {
        if (showPaywall || isGateHardLocked) return;
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = time;
    };

    const handlePlaybackRateChange = (rate: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = rate;
        setPlaybackRate(rate);
    };

    const changeQuality = (levelIndex: number) => {
        const hls = hlsRef.current;
        if (hls) {
            hls.currentLevel = levelIndex;
            setCurrentQuality(levelIndex);
        }
        setShowQualityMenu(false);
    };

    const retry = () => {
        setError(null);
        setIsLoading(true);
        const hls = hlsRef.current;
        if (hls) {
            hls.loadSource(resolvedUrl);
        } else if (videoRef.current) {
            videoRef.current.load();
        }
    };

    const handleSkipIntro = () => {
        const video = videoRef.current;
        if (video) {
            video.currentTime = skipIntroTime;
        }
    };

    // Double-tap handler for mobile seek
    const handleVideoAreaClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (streamType === "iframe") return;
        if (showPaywall || isGateHardLocked) return;

        const now = Date.now();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        // Handle both mouse and touch events
        const clientX = 'touches' in e ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX;
        const x = clientX - rect.left;
        const isLeftSide = x < rect.width / 2;

        if (now - lastTapRef.current.time < 300 && Math.abs(x - lastTapRef.current.x) < 50) {
            // Double tap in same area
            if (isLeftSide) {
                seekBackward();
            } else {
                seekForward();
            }
        } else {
            // Single tap - toggle controls and ensure they stay visible on mobile
            setShowControls(true);
            if (!isMobile) {
                resetControlsTimeout();
            }
        }

        lastTapRef.current = { time: now, x };
    };

    const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
    const paywallHref = conversionGate?.ctaHref || "/pricing";
    const isDailyCapPaywall = conversionGateEnabled && !!conversionGate?.reachedDailyLimit;
    const isMoviePreviewPaywall = conversionGateEnabled && !isDailyCapPaywall;
    const paywallTitle = conversionGate?.paywallTitle || (isDailyCapPaywall
        ? "Xadka FREE-ga maanta waa dhammaaday 🚫"
        : isMoviePreviewPaywall
            ? "Preview-ga bilaashka ah waa dhammaaday"
            : "Free Preview Ended");
    const paywallMessage = conversionGate?.paywallMessage || (isDailyCapPaywall
        ? `Waxaad isticmaashay ${conversionGate?.usedToday || 0}/${conversionGate?.dailyLimit || 3} free views maanta. VIP hadda fur si aad u daawato si aan xad lahayn.`
        : isMoviePreviewPaywall
            ? `Si aad u sii wadato daawashada "${conversionGate?.contentLabel || "filimkan"}": Upgrade to VIP 💎`
            : `You've watched the free ${Math.floor(freePreviewLimit / 60)} minutes of this match. Upgrade to Premium to continue watching live!`);
    const primaryPaywallCta = conversionGate?.primaryCtaLabel || ((isMoviePreviewPaywall || isDailyCapPaywall) ? "IIBSO VIP HADDA" : "Unlock for $0.25");
    const previewQualityLabel = conversionGate?.qualityCap ? `${conversionGate.qualityCap}p` : "Free";
    const previewCountdownSeconds = Math.max(0, previewRemainingSeconds ?? Math.ceil(moviePreviewLimit));
    const whatsappSupportNumber = String((settings as any)?.whatsappNumber || "+252618274188").replace(/\D/g, "");
    const whatsappSupportMessage = conversionGate?.whatsappMessage
        || `Salaan Fanbroj, waxaan rabaa caawimaad sida aan u iibsado VIP. Content: ${conversionGate?.contentLabel || trackParams?.contentId || "movie"}`;
    const whatsappSupportHref = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
        whatsappSupportMessage
    )}`;
    const paywallOverlayClass = "absolute inset-0 bg-black/92 z-50 p-2 sm:p-6 overflow-y-auto";
    const paywallCardWrapClass = "min-h-full flex items-start sm:items-center justify-center";
    const paywallCardClass = "w-full max-w-[22rem] sm:max-w-md rounded-xl sm:rounded-2xl border border-white/15 bg-black/65 backdrop-blur-md p-3 sm:p-5 animate-in fade-in zoom-in duration-300 text-center";
    const paywallTitleClass = "text-lg sm:text-2xl leading-tight font-black text-white mb-2";
    const paywallMessageClass = "text-gray-300 text-sm sm:text-base leading-snug mb-3 sm:mb-5";
    const paywallButtonsClass = "flex flex-col gap-2.5 sm:gap-3";
    const paywallPrimaryButtonClass = "w-full py-2.5 sm:py-3 bg-accent-gold text-black font-bold rounded-xl hover:bg-accent-gold/90 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base";
    const paywallWhatsappButtonClass = "w-full py-2.5 sm:py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1fb855] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base";

    // Render iframe for external embeds
    if (streamType === "iframe") {
        if (!resolvedUrl) return <div className={cn("stream-player relative bg-black aspect-video rounded-xl overflow-hidden animate-pulse", className)} />;
        const iframeBlockedByPaywall = conversionGateEnabled && showPaywall;

        return (
            <div className={cn("stream-player relative bg-black aspect-video rounded-xl overflow-hidden", className)}>
                {!iframeBlockedByPaywall ? (
                    <iframe
                        src={resolvedUrl}
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen={!conversionGateEnabled}
                        scrolling="no"
                        allow="autoplay; encrypted-media; picture-in-picture"
                    />
                ) : (
                    <div className="absolute inset-0 bg-black" />
                )}
                {conversionGateEnabled && !showPaywall && (
                    <div className="absolute top-3 left-3 z-40 pointer-events-none">
                        <div className="flex items-center gap-1.5 bg-black/70 border border-yellow-400/40 text-yellow-200 px-3 py-1.5 rounded-full text-xs font-black">
                            <Clock3 size={13} />
                            <span>{previewQualityLabel} Timer x{previewTimerMultiplier}: {formatTime(previewCountdownSeconds)}</span>
                        </div>
                    </div>
                )}
                {showPaywall && (
                    <div className={paywallOverlayClass}>
                        <div className={paywallCardWrapClass}>
                            <div className={paywallCardClass}>
                                <Lock className="w-10 h-10 sm:w-16 sm:h-16 text-accent-gold mx-auto mb-2 sm:mb-4" />
                                <h3 className={paywallTitleClass}>{paywallTitle}</h3>
                                <p className={paywallMessageClass}>{paywallMessage}</p>
                                <div className={paywallButtonsClass}>
                                    <a
                                        href={paywallHref}
                                        className={paywallPrimaryButtonClass}
                                    >
                                        <Zap size={20} />
                                        {primaryPaywallCta}
                                    </a>
                                    <a
                                        href={whatsappSupportHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={paywallWhatsappButtonClass}
                                    >
                                        <MessageCircle size={20} />
                                        WhatsApp Support
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Native video/HLS player
    return (
        <div
            ref={containerRef}
            className={cn("stream-player relative bg-black aspect-video rounded-xl overflow-hidden group touch-none", className)}
            onMouseMove={resetControlsTimeout}
            onMouseEnter={() => setShowControls(true)}
            onClick={handleVideoAreaClick}
            onTouchStart={handleVideoAreaClick}
        >
            {/* Video Element - No native controls, custom controls only */}
            <video
                ref={videoRef}
                poster={poster}
                playsInline
                controls={false}
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture={conversionGateEnabled}
                webkit-playsinline="true"
                x5-playsinline="true"
                x-webkit-airplay={conversionGateEnabled ? "deny" : "allow"}
                preload="metadata"
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    // Force hide native controls
                    // @ts-ignore
                    '--webkit-media-controls': 'none',
                }}
                onContextMenu={(e) => e.preventDefault()}
            />

            {conversionGateEnabled && !showPaywall && (
                <div className="absolute top-3 left-3 z-40 pointer-events-none">
                    <div className="flex items-center gap-1.5 bg-black/70 border border-yellow-400/40 text-yellow-200 px-3 py-1.5 rounded-full text-xs font-black">
                        <Clock3 size={13} />
                        <span>{previewQualityLabel} Timer x{previewTimerMultiplier}: {formatTime(previewCountdownSeconds)}</span>
                    </div>
                </div>
            )}

            {/* Buffer Indicator */}
            <BufferIndicator isBuffering={isBuffering && !isLoading} />

            {/* Mobile Gestures - Swipe for seek/volume */}
            {isMobile && !showPaywall && (
                <MobileGestures
                    videoRef={videoRef}
                    onSeek={handleSeek}
                    onVolumeChange={handleVolumeChange}
                    currentTime={currentTime}
                    duration={duration}
                    volume={volume}
                />
            )}

            {/* Double-tap seek indicators */}
            <AnimatePresence>
                {doubleTapSide && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm z-30",
                            doubleTapSide === "left" ? "left-8" : "right-8"
                        )}
                    >
                        {doubleTapSide === "left" ? <SkipBack size={28} /> : <SkipForward size={28} />}
                        <span className="text-xs font-bold mt-1">{doubleTapSide === "left" ? "-10s" : "+10s"}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bilingual Refresh Message */}
            {showRefreshMessage && !error && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-700 via-green-600 to-green-700 z-30 overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap py-2 flex items-center gap-8">
                        <span className="inline-flex items-center gap-2 text-white text-sm font-medium">
                            <span className="text-lg">ℹ️</span>
                            <span className="italic">Hadii Muqaalka Kaa Cuslaado Ama Cilad Ku Timaado, Fadlan Refresh</span>
                            <span className="text-lg">🔄</span>
                        </span>
                        <span className="inline-flex items-center gap-2 text-white/90 text-sm font-medium">
                            <span className="text-lg">ℹ️</span>
                            <span>If the video freezes or has issues, please refresh the page</span>
                            <span className="text-lg">🔄</span>
                        </span>
                        <span className="inline-flex items-center gap-2 text-white text-sm font-medium">
                            <span className="text-lg">ℹ️</span>
                            <span className="italic">Hadii Muqaalka Kaa Cuslaado Ama Cilad Ku Timaado, Fadlan Refresh</span>
                            <span className="text-lg">🔄</span>
                        </span>
                        <span className="inline-flex items-center gap-2 text-white/90 text-sm font-medium">
                            <span className="text-lg">ℹ️</span>
                            <span>If the video freezes or has issues, please refresh the page</span>
                            <span className="text-lg">🔄</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Ready to Play Overlay with Background - Always shows when not playing */}
            {!isPlaying && !error && (
                <div className="absolute inset-0" style={{ zIndex: 50 }}>
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: loadingPoster
                                ? `url(${loadingPoster})`
                                : poster
                                    ? `url(${poster})`
                                    : 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
                    </div>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {isLoading ? (
                            /* Loading State - Spinning ring with play button */
                            <>
                                <div className="relative mb-6">
                                    {/* Outer spinning ring */}
                                    <div className="w-28 h-28 rounded-full border-4 border-white/20 border-t-green-500 animate-spin" />
                                    {/* Inner play button - clickable */}
                                    <button
                                        onClick={togglePlay}
                                        className="absolute inset-0 m-auto w-20 h-20 bg-green-500/90 hover:bg-green-500 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl"
                                    >
                                        <Play size={36} className="text-white ml-1" fill="white" />
                                    </button>
                                </div>

                                {/* Loading Text - Bilingual */}
                                <div className="text-center px-4">
                                    <p className="text-white text-xl font-bold mb-2">Soo Dejinayaa Muuqaalka...</p>
                                    <p className="text-white/70 text-sm">Loading Stream • Please Wait</p>
                                </div>
                            </>
                        ) : (
                            /* Ready to Play State - Big play button */
                            <>
                                <button
                                    onClick={togglePlay}
                                    className="w-24 h-24 md:w-28 md:h-28 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-green-500/30"
                                >
                                    <Play size={48} className="text-white ml-2" fill="white" />
                                </button>

                                {/* Tap to Play Text */}
                                <div className="mt-6 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-xl text-center">
                                    <p className="text-white font-bold text-lg">▶️ Riix si aad u Daawato</p>
                                    <p className="text-white/70 text-sm mt-1">Tap to Play</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-4">
                    <AlertCircle className="w-12 h-12 text-accent-red mb-4" />
                    <p className="text-white text-center mb-4">{error}</p>
                    <button
                        onClick={retry}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-green text-black rounded-lg font-semibold hover:bg-accent-green/80 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </button>
                </div>
            )}

            {/* Paywall Overlay */}
            {showPaywall && (
                <div className={paywallOverlayClass}>
                    <div className={paywallCardWrapClass}>
                        <div className={paywallCardClass}>
                            <Lock className="w-10 h-10 sm:w-16 sm:h-16 text-accent-gold mx-auto mb-2 sm:mb-4" />
                            <h3 className={paywallTitleClass}>{paywallTitle}</h3>
                            <p className={paywallMessageClass}>{paywallMessage}</p>

                            <div className={paywallButtonsClass}>
                                <a
                                    href={paywallHref}
                                    className={paywallPrimaryButtonClass}
                                >
                                    <Zap size={20} />
                                    {primaryPaywallCta}
                                </a>
                                <a
                                    href={whatsappSupportHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={paywallWhatsappButtonClass}
                                >
                                    <MessageCircle size={20} />
                                    WhatsApp Support
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            <AnimatePresence>
                {showControls && !showPaywall && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none"
                    >
                        {/* Skip Intro Button */}
                        <AnimatePresence>
                            {canShowSkipIntro && (
                                <motion.button
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onClick={handleSkipIntro}
                                    className="absolute right-4 bottom-28 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors shadow-xl pointer-events-auto"
                                >
                                    Skip Intro
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Next Episode Overlay */}
                        <AnimatePresence>
                            {canShowNextEpisode && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute right-4 bottom-28 p-4 bg-stadium-elevated/95 backdrop-blur-md rounded-xl border border-border-subtle shadow-xl max-w-xs pointer-events-auto"
                                >
                                    <p className="text-text-secondary text-xs mb-1">Up Next</p>
                                    <p className="text-white font-semibold mb-3 line-clamp-2">
                                        {nextEpisodeTitle || "Next Episode"}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onNextEpisode}
                                            className="flex-1 px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors text-sm"
                                        >
                                            Play Now
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Top bar */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 bg-accent-red px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-white">LIVE</span>
                                </span>
                            </div>

                            {/* Quality Selector */}
                            {qualities.length > 0 && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                                    >
                                        <Settings size={14} />
                                        <span>{currentQuality === -1 ? "Auto" : `${qualities[currentQuality]?.height}p`}</span>
                                        <ChevronUp size={14} className={cn("transition-transform", showQualityMenu && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {showQualityMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute right-0 top-full mt-2 bg-stadium-dark border border-border-strong rounded-lg overflow-hidden shadow-xl min-w-[120px]"
                                            >
                                                <button
                                                    onClick={() => changeQuality(-1)}
                                                    className={cn(
                                                        "w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors",
                                                        currentQuality === -1 ? "text-accent-green" : "text-white"
                                                    )}
                                                >
                                                    Auto
                                                </button>
                                                {qualities.map((q) => {
                                                    const isLockedQuality = conversionGateEnabled && qualityCap > 0 && q.height > qualityCap;
                                                    return (
                                                        <button
                                                            key={q.index}
                                                            onClick={() => {
                                                                if (isLockedQuality) {
                                                                    if (conversionGate?.ctaHref) {
                                                                        window.location.href = conversionGate.ctaHref;
                                                                    }
                                                                    return;
                                                                }
                                                                changeQuality(q.index);
                                                            }}
                                                            className={cn(
                                                                "w-full px-4 py-2 text-left text-sm transition-colors",
                                                                isLockedQuality
                                                                    ? "text-yellow-300/70 hover:bg-yellow-500/10"
                                                                    : "hover:bg-white/10",
                                                                currentQuality === q.index ? "text-accent-green" : "text-white"
                                                            )}
                                                        >
                                                            {isLockedQuality ? `🔒 ${q.height}p (VIP)` : `${q.height}p`}
                                                        </button>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Center play button - Enhanced for ready state */}
                        {(!isPlaying || needsUserInteraction) && !isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20">
                                <div className="flex flex-col items-center">
                                    <button
                                        onClick={togglePlay}
                                        className="w-24 h-24 bg-white/30 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 touch-manipulation shadow-2xl border-4 border-white/50 group"
                                    >
                                        <Play size={44} className="text-white ml-2 group-hover:scale-110 transition-transform" fill="white" />
                                    </button>
                                    {needsUserInteraction && (
                                        <div className="mt-6 bg-black/80 backdrop-blur px-6 py-3 rounded-xl text-center">
                                            <p className="text-white font-bold text-lg">▶️ Riix si aad u Daawato</p>
                                            <p className="text-white/80 text-sm mt-1">Tap to Play</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Mobile Fullscreen FAB (Floating Action Button) */}
                        {isMobile && isPlaying && !conversionGateEnabled && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={toggleFullscreen}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFullscreen();
                                }}
                                className="absolute top-4 right-4 z-30 p-3 bg-black/60 backdrop-blur rounded-full text-white active:scale-95 transition-transform touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center pointer-events-auto"
                                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            >
                                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                            </motion.button>
                        )}

                        {/* Bottom controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 pointer-events-auto">
                            {/* Progress bar */}
                            <div className="group/progress relative w-full cursor-pointer" onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = (e.clientX - rect.left) / rect.width;
                                handleSeek(pos * duration);
                            }}>
                                <div className="relative h-1 group-hover/progress:h-2 transition-all bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
                                        style={{ width: `${(buffered / duration) * 100}%` }}
                                    />
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-accent-green rounded-full"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Control buttons */}
                            <div className="flex items-center gap-2 md:gap-4">
                                <button
                                    onClick={togglePlay}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        togglePlay();
                                    }}
                                    className="p-3 md:p-2 text-white hover:text-accent-green transition-colors active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? <Pause size={28} className="md:w-6 md:h-6" /> : <Play size={28} className="md:w-6 md:h-6" />}
                                </button>

                                <button onClick={seekBackward} className="p-2 text-white hover:text-accent-green transition-colors hidden md:block">
                                    <SkipBack size={20} />
                                </button>

                                <button onClick={seekForward} className="p-2 text-white hover:text-accent-green transition-colors hidden md:block">
                                    <SkipForward size={20} />
                                </button>

                                {/* Volume */}
                                <div
                                    className="relative flex items-center"
                                    onMouseEnter={() => setShowVolumeSlider(true)}
                                    onMouseLeave={() => setShowVolumeSlider(false)}
                                >
                                    <button onClick={toggleMute} className="p-2 text-white hover:text-accent-green transition-colors">
                                        <VolumeIcon size={24} />
                                    </button>
                                    <AnimatePresence>
                                        {showVolumeSlider && (
                                            <motion.div
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: "auto" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="hidden md:flex items-center overflow-hidden"
                                            >
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={isMuted ? 0 : volume}
                                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-accent-green"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Time display */}
                                <div className="text-white text-sm font-medium tabular-nums">
                                    <span>{formatTime(currentTime)}</span>
                                    <span className="text-white/50 mx-1">/</span>
                                    <span className="text-white/70">{formatTime(duration)}</span>
                                </div>

                                <div className="flex-1" />

                                {/* Playback speed */}
                                <div className="relative hidden md:block">
                                    <button
                                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                        className="px-3 py-1 text-white text-sm font-semibold hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        {playbackRate}x
                                        <ChevronUp size={14} className={cn("transition-transform", showSpeedMenu && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {showSpeedMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute bottom-full mb-2 right-0 bg-stadium-dark border border-border-subtle rounded-lg overflow-hidden shadow-xl"
                                            >
                                                {playbackRates.map((rate) => (
                                                    <button
                                                        key={rate}
                                                        onClick={() => {
                                                            handlePlaybackRateChange(rate);
                                                            setShowSpeedMenu(false);
                                                        }}
                                                        className={cn(
                                                            "w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors",
                                                            playbackRate === rate ? "text-accent-green" : "text-white"
                                                        )}
                                                    >
                                                        {rate === 1 ? "Normal" : `${rate}x`}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* PiP */}
                                <button
                                    onClick={togglePiP}
                                    className={cn(
                                        "p-2 transition-colors hidden md:block",
                                        isPiPActive ? "text-accent-green" : "text-white hover:text-accent-green"
                                    )}
                                >
                                    <PictureInPicture2 size={20} />
                                </button>

                                {!conversionGateEnabled && (
                                    <button
                                        onClick={toggleFullscreen}
                                        onTouchEnd={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleFullscreen();
                                        }}
                                        className="p-3 md:p-2 text-white hover:text-accent-green transition-colors active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                                    >
                                        {isFullscreen ? <Minimize size={28} className="md:w-6 md:h-6" /> : <Maximize size={28} className="md:w-6 md:h-6" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
