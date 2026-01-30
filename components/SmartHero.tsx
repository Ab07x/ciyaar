"use client";

import { useState, useEffect } from "react";
import { LiveMatchHero } from "./hero/LiveMatchHero";
import { MovieHero } from "./hero/MovieHero";
import { AnimatePresence, motion } from "framer-motion";
// import { CountdownHero } from "./hero/CountdownHero"; // To be implemented

interface SmartHeroProps {
    liveMatches: any[];
    movies: any[];
    upcomingMatches: any[];
}

export function SmartHero({ liveMatches, movies, upcomingMatches }: SmartHeroProps) {
    const [currentMovieSlide, setCurrentMovieSlide] = useState(0);

    // Auto-advance movie carousel if in movie mode
    useEffect(() => {
        if (liveMatches.length > 0) return; // Don't slide if live match is showing
        if (!movies || movies.length === 0) return;

        const timer = setInterval(() => {
            setCurrentMovieSlide((prev) => (prev + 1) % Math.min(movies.length, 5));
        }, 8000);
        return () => clearInterval(timer);
    }, [movies, liveMatches]);

    // Priority 1: Live Matches
    if (liveMatches && liveMatches.length > 0) {
        // Find the "featured" live match (e.g., Premier League or most viewers)
        // For now, take the first one
        const featuredLive = liveMatches[0];
        return <LiveMatchHero match={featuredLive} />;
    }

    // Priority 2: Upcoming Big Match (Within 2 hours) - TODO
    // const nextBigMatch = upcomingMatches.find(m => isSoon(m.kickoffAt));
    // if (nextBigMatch) return <CountdownHero match={nextBigMatch} />;

    // Priority 3: Featured Movies (Default)
    if (movies && movies.length > 0) {
        return (
            <>
                <MovieHero movie={movies[currentMovieSlide]} />
                {/* Indicators could live here or be passed into MovieHero */}
                <div className="absolute bottom-32 md:bottom-40 right-6 md:right-12 flex items-center gap-2 z-20">
                    {movies.slice(0, 5).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentMovieSlide(idx)}
                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentMovieSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                                }`}
                        />
                    ))}
                </div>
            </>
        );
    }

    return null;
}
