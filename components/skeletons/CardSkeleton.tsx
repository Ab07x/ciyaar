"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardSkeletonProps {
    variant?: "poster" | "landscape" | "short";
    className?: string;
}

export function CardSkeleton({ variant = "poster", className }: CardSkeletonProps) {
    const sizeClasses = {
        poster: "w-[140px] h-[200px] md:w-[180px] md:h-[260px]",
        landscape: "w-[280px] h-[160px] md:w-[320px] md:h-[180px]",
        short: "w-[105px] h-[170px] md:w-[130px] md:h-[210px]",
    };

    return (
        <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={cn(
                "rounded-xl bg-stadium-elevated overflow-hidden flex-shrink-0",
                sizeClasses[variant],
                className
            )}
        >
            <div className="w-full h-full skeleton-shimmer" />
        </motion.div>
    );
}

// Multiple cards skeleton for rows
interface RowSkeletonProps {
    count?: number;
    variant?: "poster" | "landscape" | "short";
    className?: string;
}

export function RowSkeleton({ count = 6, variant = "poster", className }: RowSkeletonProps) {
    return (
        <section className={cn("mb-8", className)}>
            {/* Title skeleton */}
            <div className="flex items-center justify-between mb-4 px-4 md:px-12">
                <motion.div
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-40 h-7 bg-white/10 rounded-lg"
                />
            </div>

            {/* Cards */}
            <div className="flex gap-2 md:gap-3 overflow-hidden px-4 md:px-12">
                {[...Array(count)].map((_, i) => (
                    <CardSkeleton key={i} variant={variant} />
                ))}
            </div>
        </section>
    );
}
