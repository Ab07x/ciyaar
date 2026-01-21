"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Star, Info, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroMovie {
    _id: string;
    slug: string;
    title: string;
    backdropUrl?: string;
    posterUrl: string;
    overview: string;
    rating?: number;
    releaseDate: string;
    isPremium?: boolean;
}

interface HeroSliderProps {
    movies: HeroMovie[];
}

export function HeroSlider({ movies }: HeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const heroMovies = movies.slice(0, 5); // Top 5 movies

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === heroMovies.length - 1 ? 0 : prevIndex + 1
            );
        }, 6000);

        return () => {
            resetTimeout();
        };
    }, [currentIndex, heroMovies.length]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === heroMovies.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? heroMovies.length - 1 : prev - 1));
    };

    if (heroMovies.length === 0) return null;

    return (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[2.4/1] bg-stadium-dark overflow-hidden rounded-2xl border border-border-subtle group mb-12 shadow-2xl">
            {/* Slides */}
            <div
                className="flex transition-transform duration-700 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {heroMovies.map((movie, index) => (
                    <div key={movie._id} className="w-full h-full flex-shrink-0 relative">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <Image
                                src={movie.backdropUrl || movie.posterUrl}
                                alt={movie.title}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-stadium-dark via-stadium-dark/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-stadium-dark via-transparent to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="container mx-auto px-6 md:px-12">
                                <div className="max-w-2xl animate-in slide-in-from-bottom-10 fade-in duration-700">
                                    {/* Badge */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="badge-af-somali">AF-SOMALI</span>
                                        {movie.isPremium && <span className="badge-premium">PREMIUM</span>}
                                        {movie.rating && (
                                            <span className="flex items-center gap-1 text-accent-gold text-xs font-bold bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
                                                <Star size={12} fill="currentColor" /> {movie.rating.toFixed(1)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight tracking-tight drop-shadow-lg">
                                        {movie.title}
                                    </h2>

                                    {/* Overview */}
                                    <p className="text-text-secondary text-sm md:text-lg line-clamp-2 md:line-clamp-3 mb-8 max-w-xl drop-shadow-md">
                                        {movie.overview}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4">
                                        <Link
                                            href={`/movies/${movie.slug}`}
                                            className="cta-primary text-base md:text-lg px-8 py-4"
                                        >
                                            <Play fill="currentColor" size={20} />
                                            Daawo Hadda
                                        </Link>
                                        <Link
                                            href={`/movies/${movie.slug}`}
                                            className="hidden md:flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold transition-all border border-white/10"
                                        >
                                            <Info size={20} />
                                            Faahfaahin
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                aria-label="Previous slide"
            >
                <ChevronLeft size={24} />
            </button>

            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                aria-label="Next slide"
            >
                <ChevronRight size={24} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {heroMovies.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            idx === currentIndex ? "w-8 bg-accent-green" : "bg-white/30 hover:bg-white/60"
                        )}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
