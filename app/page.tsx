"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MatchCardNew } from "@/components/MatchCardNew";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { SmartHero } from "@/components/SmartHero";
import { ContentCarousel } from "@/components/ContentCarousel";
import { Top10Row } from "@/components/Top10Row";
import Link from "next/link";
import Image from "next/image";
import { Play, Star, Info, ChevronRight, Crown, Zap, Shield, Tv, Download, Users, Film } from "lucide-react";
import { BlogCard } from "@/components/BlogCard";
import { ContinueWatchingRow } from "@/components/ContinueWatchingRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdSlot } from "@/components/AdSlot";
import { PremiumPromoBanner } from "@/components/PremiumPromoBanner";
import React, { useState, useEffect, useRef } from "react";
import { MovieCard } from "@/components/MovieCard";
import { useCountry } from "@/hooks/useCountry";
import { useUser } from "@/providers/UserProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export default function HomePage() {
  const matchData = useQuery(api.matches.getMatchesByStatus);
  const posts = useQuery(api.posts.listPosts, { isPublished: true, limit: 12 });
  const movies = useQuery(api.movies.listMovies, { isPublished: true, limit: 20 });
  const featuredMovies = useQuery(api.movies.getFeaturedMovies);
  const top10Movies = useQuery(api.movies.getTop10Movies);
  const series = useQuery(api.series.listSeries, { isPublished: true, limit: 20 });
  const settings = useQuery(api.settings.getSettings);
  const { userId, isPremium } = useUser();
  const { t } = useLanguage();
  const { country } = useCountry();
  const trending = useQuery(api.recommendations.getTrending, { limit: 12 });
  const personalized = useQuery(api.recommendations.getPersonalizedHome, { userId: userId || undefined });
  const trackPageView = useMutation(api.analytics.trackPageView);

  /* State & Tracking */
  const hasTracked = useRef(false);

  // Track page view once on mount
  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackPageView({ pageType: "home" });
    }
  }, [trackPageView]);

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
  const hasLiveMatches = live.length > 0;

  // Dynamic Section Rendering
  const renderSections = () => {
    if (hasLiveMatches) {
      // --- LIVE MODE LAYOUT ---
      return (
        <div className="-mt-32 md:-mt-40 relative z-10 space-y-8 md:space-y-12 pb-20">
          <PremiumPromoBanner />

          {/* Other Live Matches (if more than 1) */}
          {live.length > 1 && (
            <section className="px-4 md:px-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-red-500 rounded-full" />
                  <h2 className="text-xl font-black uppercase tracking-wider">{t("sections.live_matches")}</h2>
                  <LiveBadge text={`${live.length - 1} MORE`} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {live.slice(1).map((match) => (
                  <MatchCardNew key={match._id} {...match} isLocked={match.isPremium && !isPremium} />
                ))}
              </div>
            </section>
          )}

          {/* While You Wait (Short Movies) */}
          <ContentCarousel
            title="While You Wait (Quick Watch)"
            data={movies.filter(m => m.duration && parseInt(m.duration) < 90).slice(0, 5)}
            type="movie"
            link="/movies"
          />

          <ContinueWatchingRow />

          {/* Top 10 in Somalia - Netflix Style */}
          {top10Movies && top10Movies.length > 0 && (
            <Top10Row data={top10Movies} country={country || "Somalia"} />
          )}

          {/* Trending */}
          {trending && trending.length > 0 && (
            <ContentCarousel title="Trending Today" data={trending} type="mixed" />
          )}

          {/* Upcoming Matches */}
          {upcoming.length > 0 && (
            <section className="px-4 md:px-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase text-white/50">{t("sections.upcoming_matches")}</h2>
                <Link href="/ciyaar" className="text-accent-green text-xs font-bold uppercase">{t("common.view_all")}</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcoming.slice(0, 3).map((match) => (
                  <MatchCardNew key={match._id} {...match} isLocked={match.isPremium && !isPremium} />
                ))}
              </div>
            </section>
          )}

          <ContentCarousel title={t("sections.latest_movies")} link="/movies" data={movies} type="movie" />

          {posts.length > 0 && (
            <section className="px-4 md:px-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-blue-500 rounded-full" />
                <h2 className="text-xl font-black uppercase">{t("sections.news")}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {posts.slice(0, 3).map((post) => (
                  <BlogCard key={post._id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      );
    } else {
      // --- STANDARD DISCOVERY MODE ---
      return (
        <div className="-mt-32 md:-mt-40 relative z-10 space-y-8 md:space-y-12 pb-20">
          <PremiumPromoBanner />
          <ContinueWatchingRow />

          {/* Featured Movies - Large Grid like lookmovie2 */}
          <section className="px-4 md:px-8 lg:px-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-accent-green rounded-full" />
                <div className="flex items-center gap-2">
                  <Film className="text-accent-green" size={28} />
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Fanproj Play</h2>
                </div>
              </div>
              <Link href="/movies" className="text-accent-green text-sm font-bold flex items-center gap-1 hover:underline">
                Dhamaan <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
              {featuredMovies && featuredMovies.length > 0 ? (
                featuredMovies.slice(0, 8).map((movie) => (
                  <MovieCard
                    key={movie._id}
                    id={movie._id}
                    slug={movie.slug}
                    title={movie.titleSomali || movie.title}
                    posterUrl={movie.posterUrl}
                    year={movie.releaseDate?.split("-")[0] || ""}
                    rating={movie.rating}
                    isPremium={movie.isPremium}
                  />
                ))
              ) : (
                movies.slice(0, 8).map((movie) => (
                  <MovieCard
                    key={movie._id}
                    id={movie._id}
                    slug={movie.slug}
                    title={movie.titleSomali || movie.title}
                    posterUrl={movie.posterUrl}
                    year={movie.releaseDate?.split("-")[0] || ""}
                    rating={movie.rating}
                    isPremium={movie.isPremium}
                  />
                ))
              )}
            </div>
          </section>

          {/* Top 10 in Somalia - Netflix Style */}
          {top10Movies && top10Movies.length > 0 && (
            <Top10Row data={top10Movies} country={country || "Somalia"} />
          )}

          {/* Trending - Grid Layout */}
          {trending && trending.length > 0 && (
            <section className="px-4 md:px-8 lg:px-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-orange-500 rounded-full" />
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Trending in Somalia</h2>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {trending.slice(0, 8).map((item: any) => (
                  <MovieCard
                    key={item._id}
                    id={item._id}
                    slug={item.slug}
                    title={item.titleSomali || item.title}
                    posterUrl={item.posterUrl}
                    year={item.releaseDate?.split("-")[0] || item.firstAirDate?.split("-")[0] || ""}
                    rating={item.rating}
                    isPremium={item.isPremium}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Match Schedule */}
          {upcoming.length > 0 && (
            <section className="px-4 md:px-8 lg:px-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-green-500 rounded-full" />
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{t("sections.upcoming_matches")}</h2>
                </div>
                <Link href="/ciyaar" className="text-accent-green text-sm font-bold flex items-center gap-1 hover:underline">
                  Dhamaan <ChevronRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.slice(0, 6).map((match) => (
                  <MatchCardNew key={match._id} {...match} isLocked={match.isPremium && !isPremium} />
                ))}
              </div>
            </section>
          )}

          {/* Series - Grid Layout */}
          {series && series.length > 0 && (
            <section className="px-4 md:px-8 lg:px-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-purple-500 rounded-full" />
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Musalsalada Caanka ah</h2>
                </div>
                <Link href="/series" className="text-accent-green text-sm font-bold flex items-center gap-1 hover:underline">
                  Dhamaan <ChevronRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {series.slice(0, 8).map((item: any) => (
                  <Link
                    key={item._id}
                    href={`/series/${item.slug}`}
                    className="group block relative rounded-lg overflow-hidden bg-[#0d1117] border border-white/5 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden bg-white/5">
                      {item.posterUrl ? (
                        <Image
                          src={item.posterUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/30">
                          <Tv size={32} />
                        </div>
                      )}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-purple-600 text-white text-[8px] md:text-[9px] font-bold uppercase rounded">
                        <Tv size={8} />
                        <span className="hidden sm:inline">MUSALSAL</span>
                      </div>
                      {item.isPremium && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[8px] md:text-[9px] font-bold uppercase rounded">
                          <Crown size={8} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white rounded-full p-3 md:p-4 transform scale-50 group-hover:scale-100 transition-all duration-300">
                          <Play fill="black" size={20} className="text-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-2 md:p-3 bg-[#0d1117]">
                      <h3 className="font-bold text-white text-xs md:text-sm truncate mb-0.5">{item.titleSomali || item.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400">
                        <span>{item.firstAirDate?.split("-")[0]}</span>
                        <span className="text-purple-400">{item.numberOfSeasons} Season</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Personalized */}
          {personalized?.becauseYouWatched && personalized.becauseYouWatched.items.length > 0 && (
            <section className="px-4 md:px-8 lg:px-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-cyan-500 rounded-full" />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                  Maadaama aad daawatay {personalized.becauseYouWatched.title}
                </h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {personalized.becauseYouWatched.items.slice(0, 8).map((item: any) => (
                  <MovieCard
                    key={item._id}
                    id={item._id}
                    slug={item.slug}
                    title={item.titleSomali || item.title}
                    posterUrl={item.posterUrl}
                    year={item.releaseDate?.split("-")[0] || item.firstAirDate?.split("-")[0] || ""}
                    rating={item.rating}
                    isPremium={item.isPremium}
                  />
                ))}
              </div>
            </section>
          )}

          {/* News/Blog */}
          {posts.length > 0 && (
            <section className="px-4 md:px-8 lg:px-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Wararka Ciyaaraha</h2>
                </div>
                <Link href="/blog" className="text-accent-green text-sm font-bold flex items-center gap-1 hover:underline">
                  Dhamaan <ChevronRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {posts.slice(0, 3).map((post) => (
                  <BlogCard key={post._id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="px-4 md:px-8 lg:px-12">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-white/10">
              <div className="absolute inset-0 opacity-10">
                <Image src="/img/lm-bg.jpg" alt="" fill className="object-cover" />
              </div>
              <div className="relative z-10 p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
                      <Crown className="text-yellow-400" size={20} />
                      <span className="text-yellow-400 font-bold">PREMIUM</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase">
                      Madadaalada<br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Premium Somali</span>
                    </h2>
                    <p className="text-white/70 text-lg max-w-md">Ku raaxayso dhamaan filimada, musalsalada iyo ciyaaraha aan kala go' lahayn.</p>
                    <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-lg text-lg transition-all shadow-lg shadow-orange-500/25">
                      {t("common.start_now")} <ChevronRight size={20} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FeatureCard icon={<Tv size={24} />} title="HD & 4K" description="Tayada ugu sareysa" />
                    <FeatureCard icon={<Zap size={24} />} title="Xawaare Sare" description="Loading degdeg ah" />
                    <FeatureCard icon={<Shield size={24} />} title="Ad-Free" description="Xayeysiis la'aan" />
                    <FeatureCard icon={<Download size={24} />} title="Download" description="Daawo offline" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-stadium-dark overflow-x-hidden max-w-[100vw]">
      <div className="relative z-10 w-full overflow-hidden">
        <h1 className="sr-only">Daawo Ciyaar Live & Filimo Af-Soomaali – Fanbroj</h1>

        {/* Smart Hero Component */}
        <SmartHero liveMatches={live} movies={movies} upcomingMatches={upcoming} />

        {/* Dynamic Content Sections */}
        {renderSections()}
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
