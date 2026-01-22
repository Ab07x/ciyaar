"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BufferIndicatorProps {
    isBuffering: boolean;
    className?: string;
}

export function BufferIndicator({ isBuffering, className }: BufferIndicatorProps) {
    if (!isBuffering) return null;

    return (
        <div
            className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/40 z-30",
                className
            )}
        >
            <div className="relative">
                {/* Outer ring */}
                <motion.div
                    className="w-16 h-16 rounded-full border-4 border-white/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner spinning arc */}
                <motion.div
                    className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-accent-green"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />

                {/* Center dot */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent-green"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            </div>
        </div>
    );
}

// Pulsing dot indicator for minimal loading
export function LoadingDots({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-accent-green"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                    }}
                />
            ))}
        </div>
    );
}
