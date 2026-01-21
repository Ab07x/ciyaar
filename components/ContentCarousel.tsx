"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { MovieCard } from "./MovieCard";
import { SeriesCard } from "./SeriesCard";
import { MatchCard } from "./MatchCard";
import { cn } from "@/lib/utils";

interface ContentCarouselProps {
    title: string;
    link?: string;
    data: any[];
    type: "movie" | "series" | "match";
}

export function ContentCarousel({ title, link, data, type }: ContentCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    if (!data || data.length === 0) return null;

    return (
        <section className="mb-8 md:mb-12 group/section">
            <div className="flex items-center justify-between px-4 mb-4">
                <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-accent-green rounded-full inline-block"></span>
                    {title}
                </h2>
                {link && (
                    <Link href={link} className="text-xs md:text-sm font-bold text-accent-green/80 hover:text-accent-green hover:underline flex items-center gap-1 transition-colors">
                        Dhamaan <ChevronRight size={14} />
                    </Link>
                )}
            </div>

            <div className="relative group/carousel">
                {/* Scroll Buttons (Desktop) */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-accent-green hover:text-black rounded-full text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hidden md:flex items-center justify-center -ml-5 shadow-elevated"
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-accent-green hover:text-black rounded-full text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hidden md:flex items-center justify-center -mr-5 shadow-elevated"
                    aria-label="Scroll right"
                >
                    <ChevronRight size={24} />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 pb-4"
                >
                    {data.map((item, index) => (
                        <div
                            key={item._id || index}
                            className={cn(
                                "snap-start flex-shrink-0 transition-transform duration-300",
                                type === "match" ? "w-[280px] md:w-[320px]" : "w-[150px] md:w-[180px]"
                            )}
                        >
                            {type === "movie" && (
                                <MovieCard
                                    id={item._id}
                                    slug={item.slug}
                                    title={item.titleSomali || item.title}
                                    posterUrl={item.posterUrl}
                                    year={item.releaseDate?.split("-")[0] || ""}
                                    rating={item.rating}
                                    isPremium={item.isPremium}
                                />
                            )}
                            {type === "series" && (
                                <SeriesCard
                                    id={item._id}
                                    slug={item.slug}
                                    title={item.titleSomali || item.title}
                                    posterUrl={item.posterUrl}
                                    seasons={item.numberOfSeasons}
                                    episodes={item.numberOfEpisodes}
                                    year={item.firstAirDate?.split("-")[0] || ""}
                                    isPremium={item.isPremium}
                                />
                            )}
                            {type === "match" && (
                                <MatchCard {...item} />
                            )}
                        </div>
                    ))}

                    {/* End spacer for easy scrolling */}
                    <div className="w-4 flex-shrink-0" />
                </div>
            </div>
        </section>
    );
}
