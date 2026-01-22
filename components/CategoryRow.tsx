"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentItem {
    _id: string;
    slug: string;
    title: string;
    posterUrl: string;
    backdropUrl?: string;
    rating?: number;
    releaseDate?: string;
    overview?: string;
    isPremium?: boolean;
    genres?: string[];
    duration?: number;
    type: "movie" | "series";
}

interface CategoryRowProps {
    title: string;
    items: ContentItem[];
    href?: string;
    showRank?: boolean;
}

export function CategoryRow({ title, items, href, showRank = false }: CategoryRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [myList, setMyList] = useState<Set<string>>(new Set());

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = scrollRef.current.clientWidth * 0.8;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    const handleMouseEnter = (id: string, e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setHoveredItem(id);
        setHoveredPosition({ x: rect.left + rect.width / 2, y: rect.top });
    };

    const toggleMyList = (id: string) => {
        setMyList((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    if (items.length === 0) return null;

    return (
        <section className="relative mb-8 group/row">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4 md:px-12">
                <Link
                    href={href || "#"}
                    className="flex items-center gap-2 group/title"
                >
                    <h2 className="text-lg md:text-xl font-bold text-white group-hover/title:text-accent-green transition-colors">
                        {title}
                    </h2>
                    <ChevronRight
                        size={20}
                        className="text-accent-green opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all"
                    />
                </Link>
            </div>

            {/* Scroll Container */}
            <div className="relative">
                {/* Left Arrow */}
                <AnimatePresence>
                    {showLeftArrow && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => scroll("left")}
                            className="absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-gradient-to-r from-stadium-dark to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
                        >
                            <div className="p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors">
                                <ChevronLeft size={24} className="text-white" />
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Right Arrow */}
                <AnimatePresence>
                    {showRightArrow && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => scroll("right")}
                            className="absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-gradient-to-l from-stadium-dark to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
                        >
                            <div className="p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors">
                                <ChevronRight size={24} className="text-white" />
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Items */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar px-4 md:px-12 pb-4"
                >
                    {items.map((item, index) => (
                        <div
                            key={item._id}
                            className="flex-shrink-0 relative"
                            onMouseEnter={(e) => handleMouseEnter(item._id, e)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            {/* Rank Number (for Top 10) */}
                            {showRank && (
                                <div className="absolute -left-4 md:-left-6 bottom-0 z-10 font-black text-6xl md:text-8xl text-stroke-white select-none pointer-events-none">
                                    {index + 1}
                                </div>
                            )}

                            <Link href={`/${item.type === "movie" ? "movies" : "series"}/${item.slug}`}>
                                <motion.div
                                    whileHover={{ scale: 1.05, zIndex: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                        "relative overflow-hidden rounded-lg cursor-pointer",
                                        showRank
                                            ? "w-[100px] h-[150px] md:w-[120px] md:h-[180px] ml-4"
                                            : "w-[140px] h-[200px] md:w-[180px] md:h-[260px]"
                                    )}
                                >
                                    <Image
                                        src={item.posterUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 140px, 180px"
                                    />

                                    {/* Premium Badge */}
                                    {item.isPremium && (
                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-accent-gold text-black text-[8px] font-bold rounded">
                                            PREMIUM
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                        className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-3"
                                    >
                                        <h3 className="text-white text-sm font-bold line-clamp-2 mb-1">
                                            {item.title}
                                        </h3>
                                        {item.rating && (
                                            <div className="flex items-center gap-1 text-accent-gold text-xs">
                                                <Star size={12} fill="currentColor" />
                                                {item.rating.toFixed(1)}
                                            </div>
                                        )}
                                    </motion.div>
                                </motion.div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expanded Preview Popover */}
            <AnimatePresence>
                {hoveredItem && hoveredPosition && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-50 hidden md:block"
                        style={{
                            left: Math.max(200, Math.min(hoveredPosition.x - 160, window.innerWidth - 360)),
                            top: hoveredPosition.y - 20,
                        }}
                        onMouseEnter={() => setHoveredItem(hoveredItem)}
                        onMouseLeave={() => setHoveredItem(null)}
                    >
                        {(() => {
                            const item = items.find((i) => i._id === hoveredItem);
                            if (!item) return null;

                            return (
                                <div className="w-[320px] bg-stadium-elevated rounded-xl overflow-hidden shadow-2xl border border-border-subtle">
                                    {/* Preview Image */}
                                    <div className="relative h-[180px]">
                                        <Image
                                            src={item.backdropUrl || item.posterUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-stadium-elevated via-transparent to-transparent" />

                                        {/* Play button overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors"
                                            >
                                                <Play size={24} fill="black" className="text-black ml-1" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <Link
                                                href={`/${item.type === "movie" ? "movies" : "series"}/${item.slug}`}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors text-sm"
                                            >
                                                <Play size={16} fill="currentColor" />
                                                Play
                                            </Link>
                                            <button
                                                onClick={() => toggleMyList(item._id)}
                                                className={cn(
                                                    "p-2 rounded-full border-2 transition-colors",
                                                    myList.has(item._id)
                                                        ? "bg-accent-green border-accent-green text-black"
                                                        : "border-white/50 text-white hover:border-white"
                                                )}
                                            >
                                                {myList.has(item._id) ? <Check size={18} /> : <Plus size={18} />}
                                            </button>
                                            <Link
                                                href={`/${item.type === "movie" ? "movies" : "series"}/${item.slug}`}
                                                className="p-2 rounded-full border-2 border-white/50 text-white hover:border-white transition-colors"
                                            >
                                                <Info size={18} />
                                            </Link>
                                        </div>

                                        {/* Meta Info */}
                                        <div className="flex items-center gap-2 text-sm mb-2">
                                            {item.rating && (
                                                <span className="flex items-center gap-1 text-accent-green font-bold">
                                                    <Star size={14} fill="currentColor" />
                                                    {item.rating.toFixed(1)}
                                                </span>
                                            )}
                                            {item.releaseDate && (
                                                <span className="text-text-secondary">
                                                    {new Date(item.releaseDate).getFullYear()}
                                                </span>
                                            )}
                                            {item.duration && (
                                                <span className="text-text-secondary">
                                                    {Math.floor(item.duration / 60)}h {item.duration % 60}m
                                                </span>
                                            )}
                                            {item.isPremium && (
                                                <span className="px-1.5 py-0.5 bg-accent-gold text-black text-[10px] font-bold rounded">
                                                    PREMIUM
                                                </span>
                                            )}
                                        </div>

                                        {/* Genres */}
                                        {item.genres && item.genres.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {item.genres.slice(0, 3).map((genre, i) => (
                                                    <span key={genre} className="text-xs text-text-secondary">
                                                        {genre}{i < Math.min(item.genres!.length - 1, 2) && " •"}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Overview */}
                                        {item.overview && (
                                            <p className="text-text-secondary text-xs line-clamp-3">
                                                {item.overview}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .text-stroke-white {
                    -webkit-text-stroke: 2px white;
                    color: transparent;
                }
            `}</style>
        </section>
    );
}
