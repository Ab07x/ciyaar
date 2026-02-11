"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import {
    Heart,
    MessageCircle,
    Share2,
    Volume2,
    VolumeX,
    Play,
    Pause,
    ChevronUp,
    ChevronDown,
    Eye,
    X,
    Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Short {
    _id: string;
    title: string;
    embedUrl: string;
    thumbnailUrl: string;
    views: number;
    isLive: boolean;
    channelName?: string;
    createdAt: number;
    description?: string;
    likes?: number;
    comments?: number;
}

interface ShortsPlayerProps {
    shorts: Short[];
    initialIndex?: number;
    onClose?: () => void;
}

export function ShortsPlayer({ shorts, initialIndex = 0, onClose }: ShortsPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [likes, setLikes] = useState<Record<string, boolean>>({});
    const [showShareMenu, setShowShareMenu] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const SWIPE_THRESHOLD = 100;

    const currentShort = shorts[currentIndex];

    // Navigation handlers
    const goToNext = useCallback(() => {
        if (currentIndex < shorts.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    }, [currentIndex, shorts.length]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowUp":
                case "k":
                    e.preventDefault();
                    goToPrev();
                    break;
                case "ArrowDown":
                case "j":
                    e.preventDefault();
                    goToNext();
                    break;
                case "m":
                    setIsMuted((prev) => !prev);
                    break;
                case " ":
                    e.preventDefault();
                    setIsPlaying((prev) => !prev);
                    break;
                case "Escape":
                    onClose?.();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNext, goToPrev, onClose]);

    // Swipe gesture handler
    const bind = useDrag(
        ({ movement: [, my], velocity: [, vy], direction: [, dy], cancel, active }) => {
            // Update motion value for visual feedback
            if (active) {
                y.set(my);
            }

            // On release
            if (!active) {
                const shouldNavigate = Math.abs(my) > SWIPE_THRESHOLD || Math.abs(vy) > 0.5;

                if (shouldNavigate) {
                    if (dy > 0 && currentIndex > 0) {
                        goToPrev();
                    } else if (dy < 0 && currentIndex < shorts.length - 1) {
                        goToNext();
                    }
                }
                // Reset position
                y.set(0);
            }
        },
        {
            axis: "y",
            filterTaps: true,
            bounds: { top: -200, bottom: 200 },
            rubberband: true,
        }
    );

    // Toggle like
    const toggleLike = (id: string) => {
        setLikes((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Share function
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentShort.title,
                    text: `Watch: ${currentShort.title}`,
                    url: window.location.href,
                });
            } catch (err) {
                setShowShareMenu(true);
            }
        } else {
            setShowShareMenu(true);
        }
    };

    // Copy link
    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowShareMenu(false);
    };

    // Transform for navigation hint
    const hintOpacity = useTransform(y, [-100, -50, 0, 50, 100], [1, 0.5, 0, 0.5, 1]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            style={{ touchAction: "none" }}
        >
            {/* Close button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute top-4 left-4 z-50 p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-white/20 transition-all"
                aria-label="Close"
            >
                <X size={24} />
            </motion.button>

            {/* Navigation hints */}
            <AnimatePresence>
                {currentIndex > 0 && (
                    <motion.div
                        style={{ opacity: hintOpacity }}
                        className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center text-white/70"
                    >
                        <ChevronUp size={24} className="animate-bounce" />
                        <span className="text-xs font-medium">Swipe up</span>
                    </motion.div>
                )}
                {currentIndex < shorts.length - 1 && (
                    <motion.div
                        style={{ opacity: hintOpacity }}
                        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center text-white/70"
                    >
                        <span className="text-xs font-medium">Swipe down</span>
                        <ChevronDown size={24} className="animate-bounce" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content area */}
            {/* @ts-ignore */}
            <motion.div
                {...bind()}
                style={{ y, touchAction: "none" }}
                className="relative w-full h-full md:w-[400px] md:h-[90vh] md:max-h-[800px] md:rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentShort._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                        {/* Video/Embed */}
                        <div className="absolute inset-0 bg-stadium-dark">
                            {currentShort.embedUrl ? (
                                <iframe
                                    src={`${currentShort.embedUrl}${currentShort.embedUrl.includes("?") ? "&" : "?"}autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&controls=0&playsinline=1`}
                                    className="w-full h-full object-cover"
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <img
                                    src={currentShort.thumbnailUrl}
                                    alt={currentShort.title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        {/* Gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                        {/* Live badge */}
                        {currentShort.isLive && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-accent-red px-3 py-1.5 rounded-full"
                            >
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-white">LIVE</span>
                            </motion.div>
                        )}

                        {/* Right sidebar actions */}
                        <div className="absolute right-3 bottom-32 md:bottom-24 z-20 flex flex-col items-center gap-5">
                            {/* Like button */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleLike(currentShort._id)}
                                className="flex flex-col items-center gap-1"
                            >
                                <div
                                    className={cn(
                                        "p-3 rounded-full transition-colors",
                                        likes[currentShort._id]
                                            ? "bg-accent-red text-white"
                                            : "bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
                                    )}
                                >
                                    <Heart
                                        size={26}
                                        fill={likes[currentShort._id] ? "currentColor" : "none"}
                                    />
                                </div>
                                <span className="text-xs font-bold text-white">
                                    {((currentShort.likes || 0) + (likes[currentShort._id] ? 1 : 0)).toLocaleString()}
                                </span>
                            </motion.button>

                            {/* Comment button */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center gap-1"
                            >
                                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors">
                                    <MessageCircle size={26} />
                                </div>
                                <span className="text-xs font-bold text-white">
                                    {(currentShort.comments || 0).toLocaleString()}
                                </span>
                            </motion.button>

                            {/* Share button */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleShare}
                                className="flex flex-col items-center gap-1"
                            >
                                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors">
                                    <Share2 size={26} />
                                </div>
                                <span className="text-xs font-bold text-white">Share</span>
                            </motion.button>

                            {/* Sound toggle */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsMuted(!isMuted)}
                                className="flex flex-col items-center gap-1"
                            >
                                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors">
                                    {isMuted ? <VolumeX size={26} /> : <Volume2 size={26} />}
                                </div>
                                <span className="text-xs font-bold text-white">
                                    {isMuted ? "Unmute" : "Mute"}
                                </span>
                            </motion.button>
                        </div>

                        {/* Bottom info overlay */}
                        <div className="absolute bottom-0 left-0 right-16 p-4 pb-8 md:pb-4 z-20">
                            {/* Channel info */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3 mb-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-green to-accent-blue flex items-center justify-center text-white font-bold text-sm">
                                    {(currentShort.channelName || "C")[0].toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">
                                        {currentShort.channelName || "CiyaarSnaps"}
                                    </h4>
                                    <div className="flex items-center gap-2 text-white/70 text-xs">
                                        <Eye size={12} />
                                        <span>{(currentShort.views || 0).toLocaleString()} views</span>
                                    </div>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="ml-auto px-4 py-1.5 bg-accent-green text-black text-xs font-bold rounded-full hover:brightness-110 transition-all"
                                >
                                    Follow
                                </motion.button>
                            </motion.div>

                            {/* Title */}
                            <motion.h3
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-white font-bold text-lg leading-tight mb-2"
                            >
                                {currentShort.title}
                            </motion.h3>

                            {/* Description */}
                            {currentShort.description && (
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white/80 text-sm line-clamp-2"
                                >
                                    {currentShort.description}
                                </motion.p>
                            )}

                            {/* Sound indicator */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center gap-2 mt-3 text-white/60 text-xs"
                            >
                                <Music2 size={14} />
                                <span className="truncate">Original Sound - {currentShort.channelName || "CiyaarSnaps"}</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Progress indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full">
                {shorts.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                            "h-1 rounded-full transition-all duration-300",
                            idx === currentIndex
                                ? "w-6 bg-accent-green"
                                : "w-1.5 bg-white/30 hover:bg-white/50"
                        )}
                        aria-label={`Go to short ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Desktop navigation buttons */}
            <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-40">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                    className={cn(
                        "p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all",
                        currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
                    )}
                >
                    <ChevronUp size={24} />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={goToNext}
                    disabled={currentIndex === shorts.length - 1}
                    className={cn(
                        "p-3 rounded-full bg-white/10 backdrop-blur-md text-white transition-all",
                        currentIndex === shorts.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
                    )}
                >
                    <ChevronDown size={24} />
                </motion.button>
            </div>

            {/* Share menu modal */}
            <AnimatePresence>
                {showShareMenu && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowShareMenu(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full md:w-96 bg-stadium-elevated rounded-t-3xl md:rounded-3xl p-6 pb-safe"
                        >
                            <h3 className="text-white font-bold text-lg mb-4">Share</h3>
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                {[
                                    { name: "Copy Link", icon: "🔗", action: copyLink },
                                    { name: "Twitter", icon: "𝕏", action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(currentShort.title)}&url=${encodeURIComponent(window.location.href)}`) },
                                    { name: "WhatsApp", icon: "📱", action: () => window.open(`https://wa.me/?text=${encodeURIComponent(currentShort.title + " " + window.location.href)}`) },
                                    { name: "Telegram", icon: "✈️", action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(currentShort.title)}`) },
                                ].map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={item.action}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="text-xs text-white/70">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowShareMenu(false)}
                                className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
