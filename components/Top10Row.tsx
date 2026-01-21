"use client";

import React, { useRef } from "react";
import { MovieCard } from "./MovieCard";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Top10RowProps {
    data: any[]; // Assuming Movies for now
}

export function Top10Row({ data }: Top10RowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    if (!data || data.length === 0) return null;

    return (
        <section className="mb-12 group/section relative">
            <div className="flex items-center gap-2 px-4 mb-4">
                <h2 className="text-xl md:text-2xl font-black text-white">Top 10 in Somalia</h2>
            </div>

            <div className="relative group/carousel">
                {/* Scroll Buttons (Desktop) */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-white hover:text-black rounded-full text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hidden md:flex items-center justify-center -ml-5 shadow-elevated"
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-white hover:text-black rounded-full text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hidden md:flex items-center justify-center -mr-5 shadow-elevated"
                    aria-label="Scroll right"
                >
                    <ChevronRight size={24} />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-0 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 pb-8"
                >
                    {data.slice(0, 10).map((item, index) => (
                        <div key={item._id} className="snap-start flex-shrink-0 w-[160px] md:w-[220px] relative flex items-center">
                            {/* Big Number */}
                            <div className="text-[120px] md:text-[160px] font-black text-stadium-dark stroke-white translate-y-4 -mr-6 z-0 leading-none select-none"
                                style={{
                                    WebkitTextStroke: "2px #4b5563",
                                    textShadow: "0 0 20px rgba(0,0,0,0.8)"
                                }}>
                                {index + 1}
                            </div>

                            {/* Card */}
                            <div className="z-10 transform scale-90 md:scale-100 origin-bottom-left shadow-2xl">
                                <MovieCard
                                    id={item._id}
                                    slug={item.slug}
                                    title={item.titleSomali || item.title}
                                    posterUrl={item.posterUrl}
                                    year={item.releaseDate?.split("-")[0] || ""}
                                    rating={item.rating}
                                    isPremium={item.isPremium}
                                />
                            </div>
                        </div>
                    ))}

                    <div className="w-12 flex-shrink-0" />
                </div>
            </div>
        </section>
    );
}
