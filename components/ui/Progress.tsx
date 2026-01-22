"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps {
    value: number;
    max?: number;
    variant?: "default" | "gradient" | "striped";
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    label?: string;
    buffer?: number;
    className?: string;
}

export function Progress({
    value,
    max = 100,
    variant = "default",
    size = "md",
    showLabel = false,
    label,
    buffer,
    className,
}: ProgressProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const bufferPercentage = buffer ? Math.min(100, Math.max(0, (buffer / max) * 100)) : 0;

    const sizeClasses = {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
    };

    const variantClasses = {
        default: "bg-accent-green",
        gradient: "bg-gradient-to-r from-accent-green via-accent-blue to-accent-green",
        striped: "bg-accent-green bg-stripes",
    };

    return (
        <div className={cn("w-full", className)}>
            {(showLabel || label) && (
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">
                        {label || "Progress"}
                    </span>
                    <span className="text-sm font-semibold text-accent-green">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
            <div
                className={cn(
                    "relative w-full bg-stadium-elevated rounded-full overflow-hidden",
                    sizeClasses[size]
                )}
            >
                {/* Buffer indicator */}
                {buffer !== undefined && (
                    <div
                        className="absolute inset-y-0 left-0 bg-white/10 rounded-full transition-all"
                        style={{ width: `${bufferPercentage}%` }}
                    />
                )}
                {/* Progress bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn(
                        "h-full rounded-full",
                        variantClasses[variant],
                        variant === "striped" && "animate-stripes"
                    )}
                />
            </div>
        </div>
    );
}

// Video Progress Bar with seek functionality
interface VideoProgressProps {
    currentTime: number;
    duration: number;
    buffered?: number;
    onSeek: (time: number) => void;
    chapters?: { time: number; label: string }[];
    className?: string;
}

export function VideoProgress({
    currentTime,
    duration,
    buffered = 0,
    onSeek,
    chapters,
    className,
}: VideoProgressProps) {
    const progressRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [hoverTime, setHoverTime] = React.useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = React.useState(0);

    const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const handleSeek = (e: React.MouseEvent | React.TouchEvent) => {
        if (!progressRef.current) return;

        const rect = progressRef.current.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newTime = position * duration;

        onSeek(newTime);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!progressRef.current) return;

        const rect = progressRef.current.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setHoverTime(position * duration);
        setHoverPosition(e.clientX - rect.left);
    };

    return (
        <div
            ref={progressRef}
            className={cn("group relative w-full cursor-pointer", className)}
            onClick={handleSeek}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverTime(null)}
        >
            {/* Hover preview */}
            {hoverTime !== null && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-10 px-2 py-1 bg-stadium-dark border border-border-subtle rounded text-xs font-semibold text-white pointer-events-none"
                    style={{ left: hoverPosition, transform: "translateX(-50%)" }}
                >
                    {formatTime(hoverTime)}
                </motion.div>
            )}

            {/* Track */}
            <div className="relative h-1 group-hover:h-2 transition-all bg-white/20 rounded-full overflow-hidden">
                {/* Buffer */}
                <div
                    className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
                    style={{ width: `${bufferedPercentage}%` }}
                />

                {/* Progress */}
                <motion.div
                    className="absolute inset-y-0 left-0 bg-accent-green rounded-full"
                    style={{ width: `${percentage}%` }}
                />

                {/* Chapter markers */}
                {chapters?.map((chapter) => (
                    <div
                        key={chapter.time}
                        className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                        style={{ left: `${(chapter.time / duration) * 100}%` }}
                        title={chapter.label}
                    />
                ))}
            </div>

            {/* Seek handle */}
            <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent-green rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${percentage}%`, transform: "translate(-50%, -50%)" }}
            />
        </div>
    );
}
