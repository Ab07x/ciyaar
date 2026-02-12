"use client";

import useSWR from "swr";
import { MatchCardNew } from "@/components/MatchCardNew";
import PremiumBannerNew from "@/components/PremiumBannerNew";
import { LiveBadge } from "@/components/ui/LiveBadge";
import Link from "next/link";

import { MoviePosterImage } from "@/components/MoviePosterImage";
import { ContentCarousel } from "@/components/ContentCarousel";
import { Play, Star, ChevronRight, ChevronLeft, Crown, Tv, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/providers/UserProvider";
import { RamadanBanner } from "@/components/RamadanBanner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data: matchData } = useSWR("/api/matches", fetcher);
  const { data: moviesData } = useSWR("/api/movies?isPublished=true&pageSize=1000", fetcher);
  const { data: heroSlidesData } = useSWR("/api/hero-slides?auto=true", fetcher);
  const { data: trendingMovies } = useSWR("/api/movies?sort=views&limit=10&isPublished=true", fetcher);

  const { isPremium } = useUser();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 42;

  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pageview", pageType: "home", date: new Date().toISOString().split("T")[0] }),
      }).catch(() => { });
    }
  }, []);

  // Extract movies array from paginated response
  const movies = moviesData?.movies || moviesData || [];

  // Hero movies: auto-rotated slides (changes every 24hrs), fallback to latest movies
  const heroMovies = (heroSlidesData && heroSlidesData.length > 0)
    ? heroSlidesData.map((s: any) => s.content || { title: s.title, backdropUrl: s.imageUrl, slug: s.contentId, posterUrl: s.imageUrl })
    : (movies || [])
      .filter((m: any) => m.posterUrl)
      .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
      .slice(0, 8);

  useEffect(() => {
    if (heroMovies.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroMovies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroMovies.length]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre, selectedYear, sortBy]);

  const isLoading = matchData === undefined && moviesData === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020D18]">
        <Skeleton className="w-full h-[400px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-8">
          {[...Array(12)].map((_, j) => (
            <Skeleton key={j} className="aspect-[2/3] rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Matches: handle both array and object responses
  const allMatchesRaw = Array.isArray(matchData) ? matchData : [];
  const live = allMatchesRaw.filter((m: any) => m.status === "live");
  const upcoming = allMatchesRaw.filter((m: any) => m.status === "upcoming");
  const allMatches = [...live, ...upcoming];
  const moviesList = movies || [];


  const filteredMovies = moviesList.filter((movie: any) => {
    if (selectedGenre && !movie.genres?.includes(selectedGenre)) return false;
    if (selectedYear && movie.releaseDate?.split("-")[0] !== selectedYear) return false;
    return true;
  }).sort((a: any, b: any) => {
    if (sortBy === "newest") return (b.createdAt || 0) - (a.createdAt || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const genres = ([...new Set(moviesList.flatMap((m: any) => m.genres || []))] as string[]).filter(Boolean).slice(0, 15);
  const years = ([...new Set(moviesList.map((m: any) => m.releaseDate?.split("-")[0]).filter(Boolean))] as string[]).sort().reverse().slice(0, 10);

  // Pagination
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
  const paginatedMovies = filteredMovies.slice((currentPage - 1) * moviesPerPage, currentPage * moviesPerPage);

  const currentHero = heroMovies[currentSlide];

  return (
    <div className="min-h-screen bg-[#020D18]">
      {/* Ramadan Banner */}
      <RamadanBanner variant="full" />

      {/* HERO SLIDER - Lookmovie Style */}
      {currentHero && (
        <section className="relative w-full h-[400px] md:h-[450px] overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020D18] via-[#1b2838] to-[#020D18]">
            <div className="absolute inset-0 opacity-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentHero.backdropUrl || currentHero.posterUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#020D18] via-transparent to-[#020D18]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020D18] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 h-full flex items-center justify-between px-4 md:px-16 max-w-7xl mx-auto">
            {/* Left - Movie Info */}
            <div className="flex-1 max-w-lg">
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 uppercase">
                {currentHero.titleSomali || currentHero.title}
                <span className="text-[#E50914] ml-2">({currentHero.releaseDate?.split("-")[0]})</span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                {currentHero.rating && (
                  <span className="bg-[#333333] text-white px-2 py-1 rounded flex items-center gap-1">
                    <Star size={10} className="text-[#E50914]" fill="currentColor" />
                    {currentHero.rating.toFixed(1)}
                  </span>
                )}
                <span className="bg-[#333333] text-white px-2 py-1 rounded">HD</span>
                {currentHero.genres?.slice(0, 2).map((g: string) => (
                  <span key={g} className="bg-[#E50914] text-white px-2 py-1 rounded font-bold">{g}</span>
                ))}
              </div>

              <p className="text-gray-300 text-sm line-clamp-3 mb-6 hidden md:block">
                {currentHero.overviewSomali || currentHero.overview}
              </p>

              <div className="flex gap-3">
                <Link
                  href={`/movies/${currentHero.slug}-af-somali`}
                  className="px-6 py-2 bg-[#E50914] hover:bg-[#B20710] text-white font-bold rounded transition-colors flex items-center gap-2"
                >
                  <Play size={16} fill="white" /> DAAWO
                </Link>
              </div>
            </div>

            {/* Right - Movie Poster */}
            <div className="hidden md:block relative w-[200px] h-[300px] rounded-lg overflow-hidden shadow-2xl border-4 border-white/10">
              <MoviePosterImage
                src={currentHero.posterUrl}
                alt={currentHero.title}
                priority
                quality={85}
                sizes="200px"
              />
              {currentHero.isPremium && (
                <div className="absolute top-2 right-2 bg-[#E50914] text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <Crown size={10} /> VIP
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + heroMovies.length) % heroMovies.length)}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white z-20"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % heroMovies.length)}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white z-20"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {heroMovies.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? "bg-[#E50914] w-6" : "bg-white/40"}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* PREMIUM BANNER AD */}
      <PremiumBannerNew />

      {/* SPORTS MATCHES - Live & Upcoming */}
      {allMatches.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white uppercase tracking-wide">Sports Up Coming & Live</h2>
              {live.length > 0 && <LiveBadge text={`${live.length} LIVE`} />}
            </div>
            <Link href="/ciyaar" className="text-[#E50914] text-sm font-bold hover:underline flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMatches.slice(0, 6).map((match: any) => (
              <MatchCardNew key={match._id} {...match} isLocked={match.isPremium && !isPremium} />
            ))}
          </div>
        </section>
      )}

      {/* TRENDING - Most Watched */}
      {(() => {
        const trending = Array.isArray(trendingMovies?.movies) ? trendingMovies.movies : Array.isArray(trendingMovies) ? trendingMovies : [];
        return trending.length > 0 ? (
          <section className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp size={22} className="text-[#E50914]" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">Trending Now</h2>
              </div>
              <Link href="/movies" className="text-[#E50914] text-sm font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trending.slice(0, 10).map((movie: any, idx: number) => (
                <Link
                  key={movie._id}
                  href={`/movies/${movie.slug}-af-somali`}
                  className="group block relative"
                >
                  <div className="relative aspect-[2/3] rounded overflow-hidden bg-[#333333] mb-2">
                    <MoviePosterImage
                      src={movie.posterUrl}
                      alt={`${movie.titleSomali || movie.title} Af Somali`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-[#E50914] text-white text-xs font-black px-2 py-1 rounded-full min-w-[28px] text-center">
                      #{idx + 1}
                    </div>
                    {movie.rating && (
                      <div className="absolute top-2 right-2 bg-[#333333]/90 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Star size={10} className="text-[#E50914]" fill="currentColor" />
                        {movie.rating.toFixed(1)}
                      </div>
                    )}
                    {movie.isPremium && (
                      <div className="absolute bottom-2 right-2 bg-[#E50914] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        VIP
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-lg">
                        Daawo NOW
                        <Play size={16} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-white text-sm font-medium truncate group-hover:text-[#E50914] transition-colors">
                    {movie.titleSomali || movie.title}
                  </h3>
                  <p className="text-gray-500 text-xs">{movie.releaseDate?.split("-")[0]}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null;
      })()}

      {/* MOVIES FILTER */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="border-t border-b border-[#333333] py-4 mb-6">
          <h2 className="text-center text-xl font-bold text-white uppercase tracking-widest mb-4">Movies Filter</h2>

          <div className="flex flex-wrap justify-center gap-3">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-[#333333] text-white px-4 py-2 rounded text-sm border border-[#2a4a6c] focus:border-[#E50914] outline-none min-w-[140px]"
            >
              <option value="">Select Genres</option>
              {genres.map((g: string) => <option key={g} value={g}>{g}</option>)}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-[#333333] text-white px-4 py-2 rounded text-sm border border-[#2a4a6c] focus:border-[#E50914] outline-none min-w-[140px]"
            >
              <option value="">Select Year</option>
              {years.map((y: string) => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#333333] text-white px-4 py-2 rounded text-sm border border-[#2a4a6c] focus:border-[#E50914] outline-none min-w-[140px]"
            >
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
            </select>

            {(selectedGenre || selectedYear) && (
              <button
                onClick={() => { setSelectedGenre(""); setSelectedYear(""); }}
                className="px-4 py-2 bg-[#E50914] text-white font-bold rounded text-sm hover:bg-[#B20710]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
          {paginatedMovies.map((movie: any) => (
            <Link
              key={movie._id}
              href={`/movies/${movie.slug}-af-somali`}
              className="group block"
            >
              <div className="relative aspect-[2/3] rounded overflow-hidden bg-[#333333] mb-2">
                <MoviePosterImage
                  src={movie.posterUrl}
                  alt={`${movie.titleSomali || movie.title} Af Somali`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="group-hover:scale-105 transition-transform duration-300"
                />

                {movie.rating && (
                  <div className="absolute top-2 left-2 bg-[#333333]/90 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Star size={10} className="text-[#E50914]" fill="currentColor" />
                    {movie.rating.toFixed(1)}
                  </div>
                )}

                {movie.isPremium && (
                  <div className="absolute top-2 right-2 bg-[#E50914] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    VIP
                  </div>
                )}

                <div className="absolute bottom-2 left-2 bg-[#333333] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  HD
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-lg">
                    Daawo NOW
                    <Play size={16} fill="currentColor" />
                  </div>
                </div>
              </div>

              <h3 className="text-white text-sm font-medium truncate group-hover:text-[#E50914] transition-colors">
                {movie.titleSomali || movie.title}
              </h3>
              <p className="text-gray-500 text-xs">{movie.releaseDate?.split("-")[0]}</p>
            </Link>
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <p className="text-center text-gray-500 py-12">No movies found</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <div className="flex justify-center items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded font-bold text-sm ${currentPage === 1 ? "bg-[#333333] text-gray-500 cursor-not-allowed" : "bg-[#333333] text-white hover:bg-[#444444]"}`}
              >
                <ChevronLeft size={18} />
              </button>

              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push("...");
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (currentPage < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }
                return pages.map((page, idx) =>
                  typeof page === "string" ? (
                    <span key={`dots-${idx}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] px-2.5 py-2 rounded font-bold text-sm transition-colors ${currentPage === page ? "bg-[#E50914] text-white scale-110" : "bg-[#333333] text-white hover:bg-[#444444]"}`}
                    >
                      {page}
                    </button>
                  )
                );
              })()}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded font-bold text-sm ${currentPage === totalPages ? "bg-[#333333] text-gray-500 cursor-not-allowed" : "bg-[#333333] text-white hover:bg-[#444444]"}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <p className="text-center text-gray-400 text-sm mt-3">
              Page {currentPage} of {totalPages} ({filteredMovies.length} filimad)
            </p>
          </div>
        )}

        {/* View All Movies Link */}
        <div className="flex justify-center mt-6">
          <Link
            href="/movies"
            className="text-[#E50914] text-sm font-bold hover:underline flex items-center gap-1"
          >
            View All Movies <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
