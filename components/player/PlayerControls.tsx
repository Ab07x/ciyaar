"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Volume1,
    Maximize,
    Minimize,
    Settings,
    SkipForward,
    SkipBack,
    PictureInPicture2,
    Loader2,
    ChevronUp,
    X,
} from "lucide-react";
import { VideoProgress } from "@/components/ui/Progress";

interface PlayerControlsProps {
    isPlaying: boolean;
    isMuted: boolean;
    isFullscreen: boolean;
    isLoading: boolean;
    isPiPActive: boolean;
    currentTime: number;
    duration: number;
    buffered: number;
    volume: number;
    playbackRate: number;
    showControls: boolean;
    showSkipIntro?: boolean;
    showNextEpisode?: boolean;
    nextEpisodeTitle?: string;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onToggleFullscreen: () => void;
    onTogglePiP: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onPlaybackRateChange: (rate: number) => void;
    onSkipIntro?: () => void;
    onNextEpisode?: () => void;
    onSeekForward: () => void;
    onSeekBackward: () => void;
}

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function PlayerControls({
    isPlaying,
    isMuted,
    isFullscreen,
    isLoading,
    isPiPActive,
    currentTime,
    duration,
    buffered,
    volume,
    playbackRate,
    showControls,
    showSkipIntro,
    showNextEpisode,
    nextEpisodeTitle,
    onTogglePlay,
    onToggleMute,
    onToggleFullscreen,
    onTogglePiP,
    onSeek,
    onVolumeChange,
    onPlaybackRateChange,
    onSkipIntro,
    onNextEpisode,
    onSeekForward,
    onSeekBackward,
}: PlayerControlsProps) {
    const [showVolumeSlider, setShowVolumeSlider] = React.useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = React.useState(false);

    const formatTime = (time: number) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    return (
        <AnimatePresence>
            {showControls && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-20"
                >
                    {/* Skip Intro Button */}
                    <AnimatePresence>
                        {showSkipIntro && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={onSkipIntro}
                                className="absolute right-4 bottom-24 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors shadow-xl"
                            >
                                Skip Intro
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Next Episode Overlay */}
                    <AnimatePresence>
                        {showNextEpisode && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-4 bottom-24 p-4 bg-stadium-elevated/95 backdrop-blur-md rounded-xl border border-border-subtle shadow-xl max-w-xs"
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
                                    <button
                                        onClick={() => { }}
                                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Center Play/Pause Button */}
                    {!isLoading && (
                        <button
                            onClick={onTogglePlay}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 group"
                        >
                            {isPlaying ? (
                                <Pause size={36} className="text-white" />
                            ) : (
                                <Play size={36} className="text-white ml-1" />
                            )}
                        </button>
                    )}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <Loader2 size={48} className="text-accent-green animate-spin" />
                        </div>
                    )}

                    {/* Double-tap seek indicators */}
                    <button
                        onClick={onSeekBackward}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity md:hidden"
                    >
                        <SkipBack size={24} className="text-white" />
                        <span className="absolute -bottom-6 text-xs text-white font-bold">-10s</span>
                    </button>

                    <button
                        onClick={onSeekForward}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity md:hidden"
                    >
                        <SkipForward size={24} className="text-white" />
                        <span className="absolute -bottom-6 text-xs text-white font-bold">+10s</span>
                    </button>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                        {/* Progress Bar */}
                        <VideoProgress
                            currentTime={currentTime}
                            duration={duration}
                            buffered={buffered}
                            onSeek={onSeek}
                        />

                        {/* Control Buttons */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Play/Pause */}
                            <button
                                onClick={onTogglePlay}
                                className="p-2 text-white hover:text-accent-green transition-colors"
                                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>

                            {/* Skip backward */}
                            <button
                                onClick={onSeekBackward}
                                className="p-2 text-white hover:text-accent-green transition-colors hidden md:block"
                                title="Rewind 10s (Left Arrow)"
                            >
                                <SkipBack size={20} />
                            </button>

                            {/* Skip forward */}
                            <button
                                onClick={onSeekForward}
                                className="p-2 text-white hover:text-accent-green transition-colors hidden md:block"
                                title="Forward 10s (Right Arrow)"
                            >
                                <SkipForward size={20} />
                            </button>

                            {/* Volume Control */}
                            <div
                                className="relative flex items-center"
                                onMouseEnter={() => setShowVolumeSlider(true)}
                                onMouseLeave={() => setShowVolumeSlider(false)}
                            >
                                <button
                                    onClick={onToggleMute}
                                    className="p-2 text-white hover:text-accent-green transition-colors"
                                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                                >
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
                                                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-accent-green"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Time Display */}
                            <div className="text-white text-sm font-medium tabular-nums">
                                <span>{formatTime(currentTime)}</span>
                                <span className="text-white/50 mx-1">/</span>
                                <span className="text-white/70">{formatTime(duration)}</span>
                            </div>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Playback Speed */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                    className="px-3 py-1 text-white text-sm font-semibold hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
                                    title="Playback Speed"
                                >
                                    {playbackRate}x
                                    <ChevronUp
                                        size={14}
                                        className={cn(
                                            "transition-transform",
                                            showSpeedMenu && "rotate-180"
                                        )}
                                    />
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
                                                        onPlaybackRateChange(rate);
                                                        setShowSpeedMenu(false);
                                                    }}
                                                    className={cn(
                                                        "w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors",
                                                        playbackRate === rate
                                                            ? "text-accent-green"
                                                            : "text-white"
                                                    )}
                                                >
                                                    {rate === 1 ? "Normal" : `${rate}x`}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Picture-in-Picture */}
                            <button
                                onClick={onTogglePiP}
                                className={cn(
                                    "p-2 transition-colors hidden md:block",
                                    isPiPActive
                                        ? "text-accent-green"
                                        : "text-white hover:text-accent-green"
                                )}
                                title="Picture-in-Picture"
                            >
                                <PictureInPicture2 size={20} />
                            </button>

                            {/* Fullscreen */}
                            <button
                                onClick={onToggleFullscreen}
                                className="p-2 text-white hover:text-accent-green transition-colors"
                                title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                            >
                                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
