"use client";

import { useState, useEffect, useMemo } from "react";
import { LiveMatchHero } from "./hero/LiveMatchHero";
import { MovieHero } from "./hero/MovieHero";

interface SmartHeroProps {
    liveMatches: any[];
    movies: any[];
    upcomingMatches: any[];
}

const MAX_SLIDES = 8;

export function SmartHero({ liveMatches, movies, upcomingMatches }: SmartHeroProps) {
    const [currentMovieSlide, setCurrentMovieSlide] = useState(0);

    // Sort movies by last modified (updatedAt) and limit to 8
    const sortedMovies = useMemo(() => {
        if (!movies || movies.length === 0) return [];
        return [...movies]
            .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
            .slice(0, MAX_SLIDES);
    }, [movies]);

    // Auto-advance movie carousel if in movie mode
    useEffect(() => {
        if (liveMatches.length > 0) return; // Don't slide if live match is showing
        if (sortedMovies.length === 0) return;

        const timer = setInterval(() => {
            setCurrentMovieSlide((prev) => (prev + 1) % sortedMovies.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [sortedMovies, liveMatches]);

    // Priority 1: Live Matches
    if (liveMatches && liveMatches.length > 0) {
        const featuredLive = liveMatches[0];
        return <LiveMatchHero match={featuredLive} />;
    }

    // Priority 2: Featured Movies (sorted by last modified, max 8)
    if (sortedMovies.length > 0) {
        return (
            <>
                <MovieHero movie={sortedMovies[currentMovieSlide]} />
                {/* Slide Indicators */}
                <div className="absolute bottom-32 md:bottom-40 right-6 md:right-12 flex items-center gap-2 z-20">
                    {sortedMovies.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentMovieSlide(idx)}
                            className={`h-1 rounded-full transition-all duration-300 ${
                                idx === currentMovieSlide
                                    ? "w-8 bg-white"
                                    : "w-2 bg-white/40 hover:bg-white/60"
                            }`}
                        />
                    ))}
                </div>
            </>
        );
    }

    return null;
}
