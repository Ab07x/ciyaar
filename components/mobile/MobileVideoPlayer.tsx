"use client";

import { useEffect, useRef, useState } from "react";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface MobileVideoPlayerProps {
    src: string;
    poster?: string;
    className?: string;
    autoFullscreenLandscape?: boolean;
}

/**
 * Mobile-optimized video player wrapper with:
 * - Auto-fullscreen in landscape
 * - Inline playback (iOS)
 * - Better controls for mobile
 * - Orientation handling
 */
export function MobileVideoPlayer({
    src,
    poster,
    className,
    autoFullscreenLandscape = true
}: MobileVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { isMobile, isIOS, orientation } = useMobileDetection();
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Handle landscape auto-fullscreen
    useEffect(() => {
        if (!isMobile || !autoFullscreenLandscape) return;

        const container = containerRef.current;
        if (!container) return;

        const enterFullscreen = async () => {
            try {
                if (container.requestFullscreen) {
                    await container.requestFullscreen();
                } else if ((container as any).webkitRequestFullscreen) {
                    await (container as any).webkitRequestFullscreen();
                } else if ((container as any).webkitEnterFullscreen) {
                    await (container as any).webkitEnterFullscreen();
                }
            } catch (err) {
                console.log("Fullscreen not available:", err);
            }
        };

        const exitFullscreen = async () => {
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitFullscreenElement) {
                    await (document as any).webkitExitFullscreen();
                }
            } catch (err) {
                console.log("Exit fullscreen failed:", err);
            }
        };

        if (orientation === 'landscape' && !isFullscreen) {
            enterFullscreen();
        } else if (orientation === 'portrait' && isFullscreen) {
            exitFullscreen();
        }
    }, [orientation, isMobile, autoFullscreenLandscape, isFullscreen]);

    // Listen to fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div ref={containerRef} className={className}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                playsInline
                webkit-playsinline="true"
                x5-playsinline="true"
                x-webkit-airplay="allow"
                controls
                className="w-full h-full"
                style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                }}
            />
        </div>
    );
}
