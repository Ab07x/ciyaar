"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Play, TrendingUp, Eye, ChevronRight, Radio } from "lucide-react";
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
            <section className="mb-8 px-4">
                <div className="flex items-center justify-between mb-4">
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

    const hasLive = shorts.some(s => s.isLive);
    const liveShorts = shorts.filter(s => s.isLive);
    const regularShorts = shorts.filter(s => !s.isLive);

    return (
        <section className="mb-8 px-4">
            {/* Netflix-style Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {hasLive ? (
                            <div className="relative">
                                <Radio className="text-accent-red" size={22} />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-red rounded-full animate-ping" />
                            </div>
                        ) : (
                            <TrendingUp className="text-accent-green" size={22} />
                        )}
                        <h2 className="text-xl font-black text-white tracking-tight">
                            CiyaarSnaps
                        </h2>
                    </div>
                    {hasLive && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1.5 px-3 py-1 bg-accent-red rounded-full"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            <span className="text-xs font-black text-white uppercase tracking-wider">
                                {liveShorts.length} LIVE
                            </span>
                        </motion.div>
                    )}
                </div>
                <Link
                    href="/shorts"
                    className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-semibold transition-all group"
                >
                    View All
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Scrollable Row - Live items first */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
            >
                {/* Live shorts first */}
                {liveShorts.map((item, index) => (
                    <ShortCard key={item._id} item={item} index={index} isLive />
                ))}

                {/* Regular shorts */}
                {regularShorts.map((item, index) => (
                    <ShortCard key={item._id} item={item} index={liveShorts.length + index} />
                ))}
                <div className="w-2 flex-shrink-0" />
            </div>
        </section>
    );
}

// Separate card component for better organization
function ShortCard({ item, index, isLive }: { item: any; index: number; isLive?: boolean }) {
    return (
        <Link
            href={`/shorts?start=${index}`}
            className="snap-start flex-shrink-0"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "w-[105px] h-[170px] md:w-[130px] md:h-[210px] rounded-xl relative overflow-hidden cursor-pointer group",
                    isLive
                        ? "ring-2 ring-accent-red shadow-lg shadow-accent-red/30"
                        : "border border-white/10 hover:border-white/30"
                )}
            >
                {/* Background Image */}
                <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />

                {/* Live Badge - Netflix Style */}
                {isLive && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-2 left-2 flex items-center gap-1 bg-accent-red text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-wider"
                    >
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                        LIVE
                    </motion.div>
                )}

                {/* Channel name badge */}
                {item.channelName && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                        {item.channelName}
                    </div>
                )}

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-2.5 md:p-3">
                    {/* Center Play Button - appears on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xl",
                            isLive
                                ? "bg-accent-red text-white"
                                : "bg-white/90 text-black"
                        )}>
                            <Play size={20} fill="currentColor" className="ml-1" />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs md:text-sm font-bold text-white leading-tight mb-1 line-clamp-2 drop-shadow-lg">
                        {item.title}
                    </h3>

                    {/* Views */}
                    <p className="text-[10px] text-white/70 font-medium flex items-center gap-1">
                        <Eye size={10} />
                        {(item.views || 0).toLocaleString()} views
                    </p>
                </div>

                {/* Bottom gradient line for live */}
                {isLive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-red via-orange-500 to-accent-red animate-pulse" />
                )}
            </motion.div>
        </Link>
    );
}
