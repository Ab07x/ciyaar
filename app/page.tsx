"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MatchCard } from "@/components/MatchCard";
import { MovieCard } from "@/components/MovieCard";
import { SeriesCard } from "@/components/SeriesCard";
import { ContentCarousel } from "@/components/ContentCarousel";
import { Top10Row } from "@/components/Top10Row";
import { ShortsRow } from "@/components/ShortsRow";
import Link from "next/link";
import { PlayCircle, Calendar, Clock, Crown, ChevronRight, Newspaper, Film, Tv } from "lucide-react";
import { BlogCard } from "@/components/BlogCard";
import { ContinueWatchingRow } from "@/components/ContinueWatchingRow";
import { HeroSlider } from "@/components/HeroSlider";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdSlot } from "@/components/AdSlot";

// Reusable Section Component for Grids (Live/Upcoming) to keep code clean
const Section = ({ title, icon: Icon, color, children, count, link }: any) => (
  <section className="mb-12">
    <div className="flex items-center justify-between mb-6 px-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>
          <Icon size={24} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">{title}</h2>
          {count !== undefined && (
            <span className="text-sm text-text-muted font-medium">{count} Ciyaarood</span>
          )}
        </div>
      </div>
      {link && (
        <Link href={link} className="text-sm font-bold text-accent-green hover:underline flex items-center gap-1">
          Dhamaan <ChevronRight size={16} />
        </Link>
      )}
    </div>
    <div className="px-4">
      {children}
    </div>
  </section>
);

export default function HomePage() {
  const matchData = useQuery(api.matches.getMatchesByStatus);
  const posts = useQuery(api.posts.listPosts, { isPublished: true, limit: 12 });
  const movies = useQuery(api.movies.listMovies, { isPublished: true, limit: 20 });
  const series = useQuery(api.series.listSeries, { isPublished: true, limit: 20 });
  const settings = useQuery(api.settings.getSettings);

  if (!matchData || !posts || !movies || !series) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Skeleton */}
        <div className="relative w-full h-[65vh] md:h-[70vh] rounded-3xl overflow-hidden bg-stadium-elevated border border-white/5">
          <Skeleton className="w-full h-full" />
        </div>
        {/* Carousels Skeleton */}
        <div className="space-y-12">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-48 rounded-lg ml-4" />
              <div className="flex gap-4 overflow-hidden px-4">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-48 w-32 md:w-48 rounded-xl flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { live, upcoming, finished, premium } = matchData;

  return (
    <div className="pb-20">
      <HeroSlider movies={movies} />

      {/* Main Content Container - fluid width for carousels */}
      <div className="mt-8 space-y-8">

        {/* 1. Shorts / Stories */}
        <ShortsRow />

        {/* 2. Continue Watching */}
        <ContinueWatchingRow />

        {/* 3. Live Matches (Vital - Keep as Grid) */}
        {live.length > 0 && (
          <Section title="LIVE HADA" icon={PlayCircle} color="red" count={live.length}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {live.slice(0, 3).map((match) => (
                <MatchCard key={match._id} {...match} />
              ))}
            </div>
            <div className="flex justify-center w-full mt-4">
              <Link href="/ciyaar" className="text-sm font-bold text-accent-green hover:underline flex items-center gap-1 bg-stadium-elevated px-6 py-2 rounded-full border border-white/10 hover:border-accent-green/50 transition-all">
                Dhamaan Ciyaaraha Live-ka ah <ChevronRight size={16} />
              </Link>
            </div>
          </Section>
        )}

        {/* 4. Top 10 Movies */}
        <Top10Row data={movies} />

        {/* 5. Filimada Cusub (Movies Carousel) */}
        <ContentCarousel
          title="Filimada Cusub"
          link="/movies"
          data={movies}
          type="movie"
        />

        {/* 6. Musalsal Cusub (Series Carousel) */}
        <ContentCarousel
          title="Musalsal Cusub"
          link="/series"
          data={series}
          type="series"
        />

        {/* 7. Upcoming Matches */}
        {upcoming.length > 0 && (
          <Section title="KUWA SOO SOCDA" icon={Calendar} color="green" count={upcoming.length} link="/ciyaar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.slice(0, 6).map((match) => (
                <MatchCard key={match._id} {...match} />
              ))}
            </div>
          </Section>
        )}

        {/* AdSlot */}
        <AdSlot slotKey="home_middle" className="mb-12" />

        {/* 8. Wararka (News) */}
        {posts.length > 0 && (
          <section className="mb-12 px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-accent-blue rounded-full inline-block"></span>
                Wararka Ciyaaraha
              </h2>
              <Link href="/blog" className="text-sm font-bold text-accent-green hover:underline flex items-center gap-1">
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

        {/* Premium Teaser */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-accent-gold/20 to-accent-red/20 border border-accent-gold/30 p-8 md:p-12 text-center mx-4">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          <div className="relative z-10 flex flex-col items-center">
            <Crown size={48} className="text-accent-gold mb-4 animate-pulse" />
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter">
              NOQO <span className="text-accent-gold">PREMIUM</span>
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-8">
              Iska diiwaan gali hada si aad u hesho dhamaan ciyaaraha tooska ah, filimada cusub iyo musalsalada ugu xiisaha badan.
            </p>
            <Link href="/pricing" className="cta-gold text-lg px-8 py-4 shadow-lg shadow-accent-gold/20 hover:shadow-accent-gold/40">
              KUSOO BIIR HADA
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
