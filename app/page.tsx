"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MatchCard } from "@/components/MatchCard";
import { ContentCarousel } from "@/components/ContentCarousel";
import { Top10Row } from "@/components/Top10Row";
import { ShortsRow } from "@/components/ShortsRow";
import Link from "next/link";
import Image from "next/image";
import { Play, Star, Info, ChevronRight, Crown, Zap, Shield, Tv, Download, Users, Film } from "lucide-react";
import { BlogCard } from "@/components/BlogCard";
import { ContinueWatchingRow } from "@/components/ContinueWatchingRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdSlot } from "@/components/AdSlot";
import { PremiumPromoBanner } from "@/components/PremiumPromoBanner";
import { useState, useEffect, useRef } from "react";
import { MovieCard } from "@/components/MovieCard";
import { useCountry } from "@/hooks/useCountry";

export default function HomePage() {
  const matchData = useQuery(api.matches.getMatchesByStatus);
  const posts = useQuery(api.posts.listPosts, { isPublished: true, limit: 12 });
  const movies = useQuery(api.movies.listMovies, { isPublished: true, limit: 20 });
  const top10Movies = useQuery(api.movies.getTop10Movies);
  const series = useQuery(api.series.listSeries, { isPublished: true, limit: 20 });
  const settings = useQuery(api.settings.getSettings);
  const trackPageView = useMutation(api.analytics.trackPageView);
  const { country } = useCountry();

  const [currentSlide, setCurrentSlide] = useState(0);
  const hasTracked = useRef(false);

  // Track page view once on mount
  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackPageView({ pageType: "home" });
    }
  }, [trackPageView]);

  // Auto-advance hero slide
  useEffect(() => {
    if (!movies || movies.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(movies.length, 5));
    }, 8000);
    return () => clearInterval(timer);
  }, [movies]);

  if (!matchData || !posts || !movies || !series) {
    return (
      <div className="min-h-screen bg-stadium-dark">
        {/* Hero Skeleton */}
        <div className="relative w-full h-[85vh] md:h-[90vh]">
          <Skeleton className="w-full h-full" />
        </div>
        {/* Content Skeletons */}
        <div className="space-y-12 -mt-32 relative z-10 px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <div className="flex gap-4 overflow-hidden">
                {[...Array(6)].map((_, j) => (
                  <Skeleton key={j} className="h-48 w-32 md:w-48 rounded-xl flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { live, upcoming } = matchData;
  const heroMovies = movies.slice(0, 5);
  const currentMovie = heroMovies[currentSlide];

  return (
    <div className="min-h-screen bg-stadium-dark">
      {/* Netflix-style Full-bleed Hero */}
      <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden">
        {/* Background Image with lm-bg.jpg base */}
        <div className="absolute inset-0">
          <Image
            src="/img/lm-bg.jpg"
            alt="Background"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>

        {/* Current Movie Backdrop */}
        {currentMovie && (
          <div className="absolute inset-0 transition-opacity duration-1000">
            <Image
              src={currentMovie.backdropUrl || currentMovie.posterUrl}
              alt={currentMovie.title}
              fill
              className="object-cover"
              priority
            />
            {/* Gradient overlays for Netflix-style fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-stadium-dark via-stadium-dark/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-stadium-dark via-transparent to-stadium-dark/30" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-stadium-dark to-transparent" />
          </div>
        )}

        {/* Hero Content */}
        {currentMovie && (
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
              <div className="max-w-2xl space-y-4 md:space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="px-3 py-1 bg-accent-green text-black text-xs md:text-sm font-bold rounded">
                    AF-SOMALI
                  </span>
                  {currentMovie.isPremium && (
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs md:text-sm font-bold rounded flex items-center gap-1">
                      <Crown size={12} /> PREMIUM
                    </span>
                  )}
                  {currentMovie.rating && (
                    <span className="flex items-center gap-1 text-yellow-400 text-xs md:text-sm font-bold">
                      <Star size={14} fill="currentColor" /> {currentMovie.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="text-white/60 text-xs md:text-sm">
                    {new Date(currentMovie.releaseDate).getFullYear()}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight">
                  {currentMovie.title}
                </h1>

                {/* Genres */}
                {currentMovie.genres && currentMovie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentMovie.genres.slice(0, 4).map((genre) => (
                      <span
                        key={genre}
                        className="text-white/70 text-sm border-r border-white/30 pr-2 last:border-0"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                <p className="text-white/80 text-sm md:text-lg line-clamp-3 max-w-xl">
                  {currentMovie.overview}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 md:gap-4 pt-2">
                  <Link
                    href={`/movies/${currentMovie.slug}`}
                    className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white hover:bg-white/90 text-black font-bold rounded-lg text-sm md:text-lg transition-all"
                  >
                    <Play fill="currentColor" size={20} />
                    Daawo
                  </Link>
                  <Link
                    href={`/movies/${currentMovie.slug}`}
                    className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold rounded-lg text-sm md:text-lg transition-all"
                  >
                    <Info size={20} />
                    Faahfaahin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide Indicators */}
        <div className="absolute bottom-32 md:bottom-40 right-6 md:right-12 flex items-center gap-2">
          {heroMovies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content - Overlapping the hero */}
      <div className="-mt-32 md:-mt-40 relative z-10 space-y-8 md:space-y-12 pb-20">

        {/* Premium Banner - Above CiyaarSnaps, Below Hero */}
        <PremiumPromoBanner />

        {/* Shorts Row (CiyaarSnaps) */}
        <ShortsRow />

        {/* Ad Slot - Between Shorts and Content */}
        <AdSlot slotKey="home_after_shorts" className="px-4" />

        {/* Fanproj Play Section - Netflix Style */}
        <section className="px-4 md:px-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-accent-green rounded-full" />
              <div className="flex items-center gap-2">
                <Film className="text-accent-green" size={24} />
                <h2 className="text-xl md:text-2xl font-black">FANPROJ PLAY</h2>
              </div>
            </div>
            <Link href="/movies" className="text-accent-green text-sm font-bold flex items-center gap-1 hover:underline">
              Dhamaan <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {movies.slice(0, 6).map((movie) => (
              <Link
                key={movie._id}
                href={`/movies/${movie.slug}`}
                className="group relative"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-stadium-elevated border border-border-subtle group-hover:border-accent-green/50 transition-all duration-300 shadow-lg">
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Premium badge */}
                  {movie.isPremium && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                      <Crown size={10} />
                      PREMIUM
                    </div>
                  )}

                  {/* Rating badge */}
                  {movie.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">
                      <Star size={10} className="text-yellow-400" fill="currentColor" />
                      {movie.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Play button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-300">
                      <Play size={24} className="text-black ml-1" fill="currentColor" />
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs text-white/70 truncate">
                      {movie.genres?.slice(0, 2).join(" • ")}
                    </p>
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-semibold line-clamp-1 group-hover:text-accent-green transition-colors">
                  {movie.titleSomali || movie.title}
                </h3>
                <p className="text-xs text-white/50">
                  {movie.releaseDate?.split("-")[0]}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Continue Watching */}
        <ContinueWatchingRow />

        {/* Live Matches */}
        {live.length > 0 && (
          <section className="px-4 md:px-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-red-500 rounded-full" />
                <div>
                  <h2 className="text-xl md:text-2xl font-black">LIVE HADA</h2>
                  <span className="text-sm text-red-400 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    {live.length} ciyaarood socda
                  </span>
                </div>
              </div>
              <Link href="/ciyaar" className="text-accent-green text-sm font-bold flex items-center gap-1 hover:underline">
                Dhamaan <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {live.slice(0, 3).map((match) => (
                <MatchCard key={match._id} {...match} />
              ))}
            </div>
          </section>
        )}

        {/* Top 10 */}
        <Top10Row data={top10Movies && top10Movies.length > 0 ? top10Movies : movies} country={country} />

        {/* Movies Carousel */}
        <ContentCarousel
          title="Filimada Cusub"
          link="/movies"
          data={movies}
          type="movie"
        />

        {/* Series Carousel */}
        <ContentCarousel
          title="Musalsal Cusub"
          link="/series"
          data={series}
          type="series"
        />

        {/* Upcoming Matches */}
        {upcoming.length > 0 && (
          <section className="px-4 md:px-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-accent-green rounded-full" />
                <h2 className="text-xl md:text-2xl font-black">KUWA SOO SOCDA</h2>
              </div>
              <Link href="/ciyaar" className="text-accent-green text-sm font-bold flex items-center gap-1 hover:underline">
                Dhamaan <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.slice(0, 6).map((match) => (
                <MatchCard key={match._id} {...match} />
              ))}
            </div>
          </section>
        )}

        {/* Ad Slot */}
        <AdSlot slotKey="home_middle" className="px-4" />

        {/* News Section */}
        {posts.length > 0 && (
          <section className="px-4 md:px-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-blue-500 rounded-full" />
                <h2 className="text-xl md:text-2xl font-black">WARARKA</h2>
              </div>
              <Link href="/blog" className="text-accent-green text-sm font-bold flex items-center gap-1 hover:underline">
                Dhamaan <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.slice(0, 3).map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Premium CTA Section - Netflix Style */}
        <section className="px-4 md:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-white/10">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <Image
                src="/img/lm-bg.jpg"
                alt=""
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left Content */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
                    <Crown className="text-yellow-400" size={20} />
                    <span className="text-yellow-400 font-bold">PREMIUM</span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                    Hel Waxa Ugu<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      Fiican
                    </span>
                  </h2>

                  <p className="text-white/70 text-lg max-w-md">
                    Ku raaxayso dhamaan filimada, musalsalada iyo ciyaaraha aan kala go' lahayn.
                  </p>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-lg text-lg transition-all shadow-lg shadow-orange-500/25"
                  >
                    Bilow Hadda
                    <ChevronRight size={20} />
                  </Link>
                </div>

                {/* Right - Features Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <FeatureCard
                    icon={<Tv size={24} />}
                    title="HD & 4K"
                    description="Tayada ugu sareysa"
                  />
                  <FeatureCard
                    icon={<Zap size={24} />}
                    title="Xawaare Sare"
                    description="Loading degdeg ah"
                  />
                  <FeatureCard
                    icon={<Shield size={24} />}
                    title="Ad-Free"
                    description="Xayeysiis la'aan"
                  />
                  <FeatureCard
                    icon={<Download size={24} />}
                    title="Download"
                    description="Daawo offline"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
      <div className="text-accent-green mb-2">{icon}</div>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  );
}
