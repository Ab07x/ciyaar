"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Play, Star, Info, ChevronRight, ChevronLeft, Volume2, VolumeX } from "lucide-react";
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
    trailerUrl?: string;
    genres?: string[];
}

interface HeroSliderProps {
    movies: HeroMovie[];
}

export function HeroSlider({ movies }: HeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const heroMovies = movies.slice(0, 5);
    const currentMovie = heroMovies[currentIndex];

    // Parallax effect
    const y = useMotionValue(0);
    const opacity = useTransform(y, [0, 100], [1, 0]);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    // Auto-advance slides
    useEffect(() => {
        if (isHovering || showTrailer) return;

        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === heroMovies.length - 1 ? 0 : prevIndex + 1
            );
        }, 6000);

        return () => {
            resetTimeout();
        };
    }, [currentIndex, heroMovies.length, isHovering, showTrailer]);

    // Show trailer after hover delay (desktop only)
    useEffect(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        if (isHovering && currentMovie?.trailerUrl) {
            hoverTimeoutRef.current = setTimeout(() => {
                setShowTrailer(true);
            }, 1500);
        } else {
            setShowTrailer(false);
        }

        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [isHovering, currentMovie?.trailerUrl]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === heroMovies.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? heroMovies.length - 1 : prev - 1));
    };

    // Touch Handlers for Swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
        resetTimeout();
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;

        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (distance > minSwipeDistance) {
            nextSlide();
        } else if (distance < -minSwipeDistance) {
            prevSlide();
        }

        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    if (heroMovies.length === 0) return null;

    return (
        <div
            className="relative w-full h-[65vh] md:h-auto md:aspect-[21/9] lg:aspect-[2.4/1] bg-stadium-dark overflow-hidden rounded-2xl border border-border-subtle group mb-12 shadow-2xl touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Slides */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    {/* Background Image/Video */}
                    <div className="absolute inset-0">
                        {/* Mobile Image */}
                        <div className="md:hidden w-full h-full relative">
                            <Image
                                src={currentMovie.posterUrl}
                                alt={currentMovie.title}
                                fill
                                className="object-cover opacity-60"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stadium-dark via-stadium-dark/80 to-transparent" />
                        </div>

                        {/* Desktop - Image or Video Preview */}
                        <div className="hidden md:block w-full h-full relative">
                            {showTrailer && currentMovie.trailerUrl ? (
                                // Video Trailer Preview
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0"
                                >
                                    <video
                                        src={currentMovie.trailerUrl}
                                        autoPlay
                                        loop
                                        muted={isMuted}
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Mute toggle */}
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute bottom-4 right-4 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors z-20"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsMuted(!isMuted);
                                        }}
                                    >
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </motion.button>
                                </motion.div>
                            ) : (
                                // Static Image with Parallax
                                <motion.div
                                    style={{ y, opacity }}
                                    className="w-full h-full relative"
                                >
                                    <Image
                                        src={currentMovie.backdropUrl || currentMovie.posterUrl}
                                        alt={currentMovie.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </motion.div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-stadium-dark via-stadium-dark/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-stadium-dark via-transparent to-transparent" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 flex items-end md:items-center pb-12 md:pb-0">
                        <div className="container mx-auto px-6 md:px-12">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="max-w-2xl"
                            >
                                {/* Badges */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-wrap items-center gap-2 mb-3 md:mb-4"
                                >
                                    <span className="badge-af-somali text-xs md:text-sm">AF-SOMALI</span>
                                    {currentMovie.isPremium && <span className="badge-premium text-xs md:text-sm">PREMIUM</span>}
                                    {currentMovie.rating && (
                                        <span className="flex items-center gap-1 text-accent-gold text-[10px] md:text-xs font-bold bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
                                            <Star size={10} className="md:w-3 md:h-3" fill="currentColor" /> {currentMovie.rating.toFixed(1)}
                                        </span>
                                    )}
                                </motion.div>

                                {/* Genre Pills */}
                                {currentMovie.genres && currentMovie.genres.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.35 }}
                                        className="flex flex-wrap gap-2 mb-3"
                                    >
                                        {currentMovie.genres.slice(0, 3).map((genre) => (
                                            <span
                                                key={genre}
                                                className="px-2 py-0.5 text-[10px] font-semibold text-white/80 bg-white/10 rounded-full backdrop-blur-sm"
                                            >
                                                {genre}
                                            </span>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-4 leading-tight tracking-tight drop-shadow-lg"
                                >
                                    {currentMovie.title}
                                </motion.h2>

                                {/* Overview */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-text-secondary text-sm md:text-lg line-clamp-3 md:line-clamp-3 mb-6 md:mb-8 max-w-xl drop-shadow-md"
                                >
                                    {currentMovie.overview}
                                </motion.p>

                                {/* Actions */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex items-center gap-3 md:gap-4"
                                >
                                    <Link
                                        href={`/movies/${currentMovie.slug}`}
                                        className="cta-primary text-sm md:text-lg px-6 md:px-8 py-3 md:py-4 w-full md:w-auto text-center justify-center flex items-center gap-2 group/btn"
                                    >
                                        <motion.span
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Play fill="currentColor" size={18} className="md:w-5 md:h-5" />
                                        </motion.span>
                                        Daawo Hadda
                                    </Link>
                                    <Link
                                        href={`/movies/${currentMovie.slug}`}
                                        className="hidden md:flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold transition-all border border-white/10 group/info"
                                    >
                                        <Info size={20} className="group-hover/info:rotate-12 transition-transform" />
                                        Faahfaahin
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows (Desktop Only) */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovering ? 1 : 0 }}
                onClick={prevSlide}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur text-white transition-all border border-white/10 items-center justify-center"
                aria-label="Previous slide"
            >
                <ChevronLeft size={24} />
            </motion.button>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovering ? 1 : 0 }}
                onClick={nextSlide}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur text-white transition-all border border-white/10 items-center justify-center"
                aria-label="Next slide"
            >
                <ChevronRight size={24} />
            </motion.button>

            {/* Progress Dots with Animation */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {heroMovies.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className="relative h-2 group/dot"
                        aria-label={`Go to slide ${idx + 1}`}
                    >
                        <span
                            className={cn(
                                "block h-2 rounded-full transition-all duration-300",
                                idx === currentIndex ? "w-8 bg-accent-green" : "w-2 bg-white/30 hover:bg-white/60"
                            )}
                        />
                        {idx === currentIndex && (
                            <motion.span
                                className="absolute inset-0 rounded-full bg-accent-green/30"
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Slide Counter */}
            <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-2 text-white/50 text-sm font-medium">
                <span className="text-white">{String(currentIndex + 1).padStart(2, '0')}</span>
                <span>/</span>
                <span>{String(heroMovies.length).padStart(2, '0')}</span>
            </div>
        </div>
    );
}
