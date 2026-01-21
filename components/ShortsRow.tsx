"use client";

import React, { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Play, TrendingUp, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export function ShortsRow() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const shorts = useQuery(api.shorts.list, { limit: 15 });
    const seed = useMutation(api.shorts.seedDefaults);
    const [selectedShort, setSelectedShort] = useState<any>(null);

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
        <>
            <section className="mb-8 pl-4">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-accent-red" size={20} />
                    <h2 className="text-lg font-black text-white">CiyaarSnaps</h2>
                    {shorts.some(s => s.isLive) && (
                        <span className="text-xs font-bold px-2 py-0.5 bg-accent-red/20 text-accent-red rounded ml-2 animate-pulse">LIVE</span>
                    )}
                </div>

                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 pr-4"
                >
                    {shorts.map((item) => (
                        <div
                            key={item._id}
                            onClick={() => setSelectedShort(item)}
                            className={cn(
                                "snap-start flex-shrink-0 w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-xl relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-200 border-2",
                                item.isLive ? "border-accent-red" : "border-transparent hover:border-white/50"
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
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>

                            {/* Live Badge */}
                            {item.isLive && (
                                <div className="absolute top-2 left-2 bg-accent-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                                    LIVE
                                </div>
                            )}

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-2 md:p-3">
                                <div className={cn(
                                    "backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center mb-auto border transition-colors",
                                    item.isLive ? "bg-accent-red text-white border-accent-red" : "bg-white/20 text-white border-white/20 group-hover:bg-accent-green group-hover:border-accent-green"
                                )}>
                                    <Play size={12} fill="currentColor" className="ml-0.5" />
                                </div>

                                <h3 className="text-xs md:text-sm font-bold text-white leading-tight mb-1 line-clamp-2 drop-shadow-md">
                                    {item.title}
                                </h3>
                                <p className="text-[10px] text-white/70 font-medium flex items-center gap-1">
                                    <Eye size={10} />
                                    {(item.views || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div className="w-2 flex-shrink-0" />
                </div>
            </section>

            {/* Full Screen Player Modal */}
            {selectedShort && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedShort(null)}
                        className="absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-full text-white hover:bg-white/30 transition-all hover:rotate-90"
                    >
                        <X size={28} />
                    </button>

                    {/* Player Container */}
                    <div className="w-full max-w-md h-[80vh] md:h-[600px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative flex flex-col animate-in zoom-in-95 duration-300">
                        <iframe
                            src={selectedShort.embedUrl}
                            className="flex-1 w-full h-full bg-black"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                        />

                        {/* Info Overlay (Bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none">
                            <div className="flex items-center gap-2 mb-2">
                                {selectedShort.isLive && (
                                    <span className="bg-accent-red px-2 py-0.5 rounded textxs font-bold text-white animate-pulse">
                                        LIVE
                                    </span>
                                )}
                                <span className="text-accent-green text-sm font-bold">
                                    {selectedShort.channelName || "CiyaarSnaps"}
                                </span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-2 drop-shadow-lg">
                                {selectedShort.title}
                            </h3>
                            <div className="flex items-center gap-4 text-text-muted text-sm">
                                <div className="flex items-center gap-1">
                                    <Eye size={16} />
                                    {(selectedShort.views || 0).toLocaleString()} Views
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
