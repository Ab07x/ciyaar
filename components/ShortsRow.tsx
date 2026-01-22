"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Play, TrendingUp, Eye, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";

export function ShortsRow() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const shorts = useQuery(api.shorts.list, { limit: 15 });
    const seed = useMutation(api.shorts.seedDefaults);

    // Auto-seed for demo purposes if empty
    useEffect(() => {
        if (shorts && shorts.length === 0) {
            seed();
        }
    }, [shorts, seed]);

    // Loading Skeleton
    if (shorts === undefined) {
        return (
            <section className="mb-8 pl-4">
                <div className="flex items-center justify-between mb-4 pr-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="w-32 h-6 rounded" />
                    </div>
                </div>
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-xl flex-shrink-0" />
                    ))}
                </div>
            </section>
        );
    }

    if (shorts.length === 0) return null;

    return (
        <section className="mb-8 pl-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pr-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="text-accent-red" size={20} />
                    <h2 className="text-lg font-black text-white">CiyaarSnaps</h2>
                    {shorts.some(s => s.isLive) && (
                        <span className="text-xs font-bold px-2 py-0.5 bg-accent-red/20 text-accent-red rounded ml-2 animate-pulse">LIVE</span>
                    )}
                </div>
                <Link
                    href="/shorts"
                    className="flex items-center gap-1 text-accent-green text-sm font-bold hover:underline transition-all group"
                >
                    View All
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Scrollable Row */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 pr-4"
            >
                {shorts.map((item, index) => (
                    <Link
                        key={item._id}
                        href={`/shorts?start=${index}`}
                        className="snap-start flex-shrink-0"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "w-[105px] h-[170px] md:w-[130px] md:h-[210px] rounded-xl relative overflow-hidden cursor-pointer group",
                                item.isLive ? "ring-2 ring-accent-red" : "border border-white/5"
                            )}
                        >
                            {/* Background Image */}
                            <img
                                src={item.thumbnailUrl}
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />

                            {/* Live Badge */}
                            {item.isLive && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 left-2 bg-accent-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1"
                                >
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    LIVE
                                </motion.div>
                            )}

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-2 md:p-3">
                                {/* Play Button */}
                                <div className={cn(
                                    "backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center mb-auto border transition-all shadow-lg",
                                    item.isLive
                                        ? "bg-accent-red text-white border-accent-red"
                                        : "bg-white/20 text-white border-white/20 group-hover:bg-accent-green group-hover:border-accent-green group-hover:scale-110"
                                )}>
                                    <Play size={12} fill="currentColor" className="ml-0.5" />
                                </div>

                                {/* Title */}
                                <h3 className="text-xs md:text-sm font-bold text-white leading-tight mb-1 line-clamp-2 drop-shadow-md">
                                    {item.title}
                                </h3>

                                {/* Views */}
                                <p className="text-[10px] text-white/70 font-medium flex items-center gap-1">
                                    <Eye size={10} />
                                    {(item.views || 0).toLocaleString()}
                                </p>
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-accent-green/0 group-hover:bg-accent-green/10 transition-colors pointer-events-none" />
                        </motion.div>
                    </Link>
                ))}
                <div className="w-2 flex-shrink-0" />
            </div>
        </section>
    );
}
