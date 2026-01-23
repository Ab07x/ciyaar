"use client";

import React, { useRef } from "react";
import { MovieCard } from "./MovieCard";
import { ChevronRight, ChevronLeft, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Star, Play, Crown } from "lucide-react";

interface Top10RowProps {
    data: any[]; // Assuming Movies for now
    country?: string;
}

export function Top10Row({ data, country = "Somalia" }: Top10RowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -320 : 320;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    if (!data || data.length === 0) return null;

    return (
        <section className="mb-12 group/section relative">
            {/* Section Header */}
            <div className="flex items-center gap-3 px-4 md:px-6 mb-4">
                <div className="w-1 h-8 bg-red-500 rounded-full" />
                <div className="flex items-center gap-2">
                    <Trophy className="text-red-500" size={24} />
                    <h2 className="text-xl md:text-2xl font-black text-white">Top 10 in {country}</h2>
                </div>
            </div>

            <div className="relative group/carousel">
                {/* Scroll Buttons (Desktop) */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/70 hover:bg-white hover:text-black rounded-full text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hidden md:flex items-center justify-center shadow-2xl border border-white/10"
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={28} />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/70 hover:bg-white hover:text-black rounded-full text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hidden md:flex items-center justify-center shadow-2xl border border-white/10"
                    aria-label="Scroll right"
                >
                    <ChevronRight size={28} />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-1 md:gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar pl-4 md:pl-6 pb-4"
                >
                    {data.slice(0, 10).map((item, index) => (
                        <Link
                            href={`/movies/${item.slug}`}
                            key={item._id}
                            className="snap-start flex-shrink-0 relative flex items-end group/item"
                        >
                            {/* Netflix-style Number - SVG for perfect stroke */}
                            <div className="relative z-0 flex-shrink-0 -mr-4 md:-mr-6">
                                <svg
                                    viewBox="0 0 100 140"
                                    className="w-[70px] h-[100px] md:w-[100px] md:h-[140px]"
                                    style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}
                                >
                                    <text
                                        x="50%"
                                        y="75%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="font-black"
                                        style={{
                                            fontSize: index + 1 === 10 ? "80px" : "100px",
                                            fontWeight: 900,
                                            fill: "#0a0a0a",
                                            stroke: "#404040",
                                            strokeWidth: index + 1 === 10 ? "2px" : "3px",
                                            fontFamily: "system-ui, -apple-system, sans-serif",
                                        }}
                                    >
                                        {index + 1}
                                    </text>
                                </svg>
                            </div>

                            {/* Movie Poster Card */}
                            <div className="relative z-10 w-[100px] md:w-[130px] aspect-[2/3] rounded-lg overflow-hidden bg-stadium-elevated border border-white/10 group-hover/item:border-white/30 transition-all duration-300 shadow-2xl group-hover/item:scale-105 group-hover/item:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                <Image
                                    src={item.posterUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />

                                {/* Premium badge */}
                                {item.isPremium && (
                                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        <Crown size={8} />
                                        <span className="hidden md:inline">PREMIUM</span>
                                    </div>
                                )}

                                {/* Rating */}
                                {item.rating && (
                                    <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/80 text-white text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        <Star size={8} className="text-yellow-400" fill="currentColor" />
                                        {item.rating.toFixed(1)}
                                    </div>
                                )}

                                {/* Play button on hover */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all duration-300">
                                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover/item:scale-100 transition-transform duration-300">
                                        <Play size={18} className="text-black ml-0.5" fill="currentColor" />
                                    </div>
                                </div>

                                {/* Rank badge on mobile */}
                                <div className="absolute bottom-1.5 left-1.5 md:hidden bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                                    #{index + 1}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* End padding */}
                    <div className="w-8 flex-shrink-0" />
                </div>
            </div>
        </section>
    );
}
