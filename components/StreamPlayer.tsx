"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
    Play, Pause, Maximize, Volume2, VolumeX,
    Settings, RefreshCw, AlertCircle, Loader2,
    ChevronUp
} from "lucide-react";

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
    className?: string;
    onError?: (error: string) => void;
    onReady?: () => void;
}

interface QualityLevel {
    height: number;
    width: number;
    bitrate: number;
    index: number;
}

// Helper: Detect stream type from URL
function detectStreamType(url: string): "m3u8" | "mpd" | "iframe" | "video" {
    const urlLower = url.toLowerCase();
    if (urlLower.includes(".m3u8") || urlLower.includes("m3u8")) return "m3u8";
    if (urlLower.includes(".mpd")) return "mpd";
    if (urlLower.includes(".mp4") || urlLower.includes(".webm") || urlLower.includes(".ogg")) return "video";
    // Default to iframe for external embeds
    return "iframe";
}

// Helper: Decode protected URL (Base64)
function decodeProtectedUrl(url: string): string {
    try {
        // Check if it looks like Base64
        if (/^[A-Za-z0-9+/=]+$/.test(url) && url.length > 20) {
            return atob(url);
        }
    } catch {
        // Not valid Base64, return as-is
    }
    return url;
}

// Helper: Encode URL for protection
export function encodeStreamUrl(url: string): string {
    return btoa(url);
}

export function StreamPlayer({ source, poster, className, onError, onReady }: StreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [qualities, setQualities] = useState<QualityLevel[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [streamType, setStreamType] = useState<"m3u8" | "mpd" | "iframe" | "video">("iframe");
    const [resolvedUrl, setResolvedUrl] = useState("");

    // Hide controls after inactivity
    const controlsTimeoutRef = useRef<any>(null);

    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    }, [isPlaying]);

    // Resolve source
    useEffect(() => {
        let url = typeof source === "string" ? source : source.url;
        const isProtected = typeof source === "object" && source.isProtected;
        const type = typeof source === "object" && source.type !== "auto" ? source.type : undefined;

        if (isProtected) {
            url = decodeProtectedUrl(url);
        }

        setResolvedUrl(url);
        setStreamType(type || detectStreamType(url));
    }, [source]);

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
                // Load HLS.js from CDN if not already loaded
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
                        lowLatencyMode: true,
                        backBufferLength: 90,
                    });

                    hlsRef.current = hls;

                    hls.loadSource(resolvedUrl);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, (_: any, data: any) => {
                        setIsLoading(false);
                        onReady?.();

                        // Extract quality levels
                        const levels: QualityLevel[] = hls.levels.map((level: any, index: number) => ({
                            height: level.height,
                            width: level.width,
                            bitrate: level.bitrate,
                            index,
                        }));
                        setQualities(levels);

                        // Auto-play
                        video.play().catch(() => {
                            // Autoplay blocked, user needs to interact
                        });
                    });

                    hls.on(Hls.Events.ERROR, (_: any, data: any) => {
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    setError("Network error - trying to recover...");
                                    hls.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    setError("Media error - trying to recover...");
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    setError("Stream unavailable");
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
                    // Safari native HLS
                    video.src = resolvedUrl;
                    video.addEventListener("loadedmetadata", () => {
                        setIsLoading(false);
                        onReady?.();
                        video.play().catch(() => { });
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
    }, [resolvedUrl, streamType, onError, onReady]);

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
            video.play().catch(() => { });
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
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleWaiting = () => setIsLoading(true);
        const handlePlaying = () => setIsLoading(false);

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("playing", handlePlaying);

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("playing", handlePlaying);
        };
    }, [streamType]);

    // Controls
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) video.play();
        else video.pause();
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
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

    // Render iframe for external embeds
    if (streamType === "iframe") {
        if (!resolvedUrl) return <div className={cn("stream-player relative bg-black aspect-video rounded-xl overflow-hidden animate-pulse", className)} />;

        return (
            <div className={cn("stream-player relative bg-black aspect-video rounded-xl overflow-hidden", className)}>
                <iframe
                    src={resolvedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                    scrolling="no"
                    allow="autoplay; encrypted-media; picture-in-picture"
                />
            </div>
        );
    }

    // Native video/HLS player
    return (
        <div
            ref={containerRef}
            className={cn("stream-player relative bg-black aspect-video rounded-xl overflow-hidden group", className)}
            onMouseMove={resetControlsTimeout}
            onMouseEnter={() => setShowControls(true)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                poster={poster}
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
                onClick={togglePlay}
            />

            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="w-12 h-12 text-accent-green animate-spin" />
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

            {/* Controls Overlay */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300 z-10 pointer-events-none",
                    showControls ? "opacity-100" : "opacity-0"
                )}
            >
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

                            {showQualityMenu && (
                                <div className="absolute right-0 top-full mt-2 bg-stadium-dark border border-border-strong rounded-lg overflow-hidden shadow-xl min-w-[120px]">
                                    <button
                                        onClick={() => changeQuality(-1)}
                                        className={cn(
                                            "w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors",
                                            currentQuality === -1 ? "text-accent-green" : "text-white"
                                        )}
                                    >
                                        Auto
                                    </button>
                                    {qualities.map((q) => (
                                        <button
                                            key={q.index}
                                            onClick={() => changeQuality(q.index)}
                                            className={cn(
                                                "w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors",
                                                currentQuality === q.index ? "text-accent-green" : "text-white"
                                            )}
                                        >
                                            {q.height}p
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Center play button */}
                {!isPlaying && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center transition-all hover:scale-110 pointer-events-auto"
                        >
                            {isPlaying ? <Pause size={28} className="text-white" /> : <Play size={28} className="text-white ml-1" />}
                        </button>
                    </div>
                )}

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-4 pointer-events-auto">
                    <button onClick={togglePlay} className="text-white hover:text-accent-green transition-colors">
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>

                    <button onClick={toggleMute} className="text-white hover:text-accent-green transition-colors">
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>

                    <div className="flex-1" />

                    <button onClick={toggleFullscreen} className="text-white hover:text-accent-green transition-colors">
                        <Maximize size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
