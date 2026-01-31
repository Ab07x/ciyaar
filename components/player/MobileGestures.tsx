"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Sun, FastForward, Rewind } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileGesturesProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    currentTime: number;
    duration: number;
    volume: number;
}

export function MobileGestures({
    videoRef,
    onSeek,
    onVolumeChange,
    currentTime,
    duration,
    volume
}: MobileGesturesProps) {
    const [gestureType, setGestureType] = useState<'seek' | 'volume' | 'brightness' | null>(null);
    const [gestureValue, setGestureValue] = useState(0);
    const [showIndicator, setShowIndicator] = useState(false);

    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
    const initialValueRef = useRef(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let gestureTimeout: any;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };

            // Store initial values
            initialValueRef.current = volume;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;

            // Determine gesture type based on direction
            if (!gestureType && (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20)) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe - seek
                    setGestureType('seek');
                } else {
                    // Vertical swipe - volume (could add brightness for right side)
                    const screenWidth = window.innerWidth;
                    if (touch.clientX < screenWidth / 2) {
                        setGestureType('brightness');
                    } else {
                        setGestureType('volume');
                    }
                }
            }

            // Handle gesture
            if (gestureType === 'seek') {
                const seekAmount = (deltaX / window.innerWidth) * 30; // Max 30s per swipe
                const newTime = Math.max(0, Math.min(duration, currentTime + seekAmount));
                setGestureValue(seekAmount);
                setShowIndicator(true);
            } else if (gestureType === 'volume') {
                const volumeChange = -(deltaY / window.innerHeight) * 2; // Invert Y and scale
                const newVolume = Math.max(0, Math.min(1, initialValueRef.current + volumeChange));
                setGestureValue(newVolume * 100);
                onVolumeChange(newVolume);
                setShowIndicator(true);
            }
        };

        const handleTouchEnd = () => {
            if (gestureType === 'seek' && gestureValue !== 0) {
                const newTime = Math.max(0, Math.min(duration, currentTime + gestureValue));
                onSeek(newTime);
            }

            // Clear gesture state
            gestureTimeout = setTimeout(() => {
                setGestureType(null);
                setGestureValue(0);
                setShowIndicator(false);
            }, 500);
        };

        video.addEventListener('touchstart', handleTouchStart, { passive: true });
        video.addEventListener('touchmove', handleTouchMove, { passive: true });
        video.addEventListener('touchend', handleTouchEnd);

        return () => {
            video.removeEventListener('touchstart', handleTouchStart);
            video.removeEventListener('touchmove', handleTouchMove);
            video.removeEventListener('touchend', handleTouchEnd);
            clearTimeout(gestureTimeout);
        };
    }, [videoRef, gestureType, gestureValue, currentTime, duration, volume, onSeek, onVolumeChange]);

    return (
        <AnimatePresence>
            {showIndicator && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                >
                    <div className="bg-black/80 backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center gap-3 min-w-[120px]">
                        {gestureType === 'seek' && (
                            <>
                                {gestureValue > 0 ? (
                                    <FastForward size={40} className="text-white" />
                                ) : (
                                    <Rewind size={40} className="text-white" />
                                )}
                                <span className="text-white text-lg font-bold">
                                    {gestureValue > 0 ? '+' : ''}{Math.round(gestureValue)}s
                                </span>
                            </>
                        )}
                        {gestureType === 'volume' && (
                            <>
                                <Volume2 size={40} className="text-white" />
                                <span className="text-white text-lg font-bold">
                                    {Math.round(gestureValue)}%
                                </span>
                                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-green rounded-full transition-all"
                                        style={{ width: `${gestureValue}%` }}
                                    />
                                </div>
                            </>
                        )}
                        {gestureType === 'brightness' && (
                            <>
                                <Sun size={40} className="text-white" />
                                <span className="text-white text-sm">Brightness</span>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
