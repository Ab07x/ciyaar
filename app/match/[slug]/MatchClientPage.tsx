"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlayerStage } from "@/components/PlayerStage";
import { MatchCardNew } from "@/components/MatchCardNew";
import { AdSlot } from "@/components/AdSlot";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { ViewerCount } from "@/components/ui/ViewerCount";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Newspaper, Share2, Trophy, Clock, MessageCircle, BarChart3, Users, ExternalLink } from "lucide-react";
import { ViewCounter } from "@/components/ViewCounter";
import { SocialShare } from "@/components/SocialShare";
import { LiveChat } from "@/components/LiveChat";
import { RelatedNews } from "@/components/RelatedNews";
import { MyListButton } from "@/components/MyListButton";
import PremiumBannerNew from "@/components/PremiumBannerNew";
import { PremiumAdInterstitial } from "@/components/PremiumAdInterstitial";
import { PPVUnlockGate } from "@/components/PPVUnlockGate";
import { MatchReminderButton } from "@/components/MatchReminderButton";
import { PredictionCard } from "@/components/PredictionCard";
import { useUser } from "@/providers/UserProvider";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatKickoffTime } from "@/lib/date-utils";
import { getBoostedViews } from "@/lib/analytics";

interface MatchClientPageProps {
  slug: string;
}

type TabType = "chat" | "stats" | "lineup";

export default function MatchClientPage({ slug }: MatchClientPageProps) {
  const { isPremium, isLoading: userLoading, userId } = useUser();
  const [mounted, setMounted] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem(`ad_completed_${slug}`);
    if (stored === "true") {
      setAdCompleted(true);
    }
  }, [slug]);

  const handleAdComplete = useCallback(() => {
    setAdCompleted(true);
    sessionStorage.setItem(`ad_completed_${slug}`, "true");
  }, [slug]);

  const match = useQuery(api.matches.getMatchBySlug, { slug });
  const settings = useQuery(api.settings.getSettings);
  const relatedMatches = useQuery(api.matches.getRelatedMatches, (match && match.leagueId) ? { matchId: match._id, leagueId: match.leagueId } : "skip");
  const matchesStatus = useQuery(api.matches.getMatchesByStatus);

  const ppvAccess = useQuery(
    api.ppv.checkAccess,
    match ? { userId: userId || undefined, contentType: "match", contentId: match._id } : "skip"
  );

  if (match === undefined || settings === undefined || matchesStatus === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
          <p className="text-white/50 text-sm">Loading match...</p>
        </div>
      </div>
    );
  }

  if (match === null) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Trophy size={40} className="text-white/30" />
          </div>
          <h1 className="text-3xl font-black mb-4">Ciyaartan lama helin</h1>
          <p className="text-white/50 mb-8">Fadlan hubi URL-ka aad soo raacday</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition-colors">
            <ChevronLeft size={18} />
            Ku laabo Home
          </Link>
        </div>
      </div>
    );
  }

  const otherLiveMatches = matchesStatus.live.filter((m: any) => m._id !== match._id);
  const boostedViews = getBoostedViews(String(match._id), match.views || 0);

  // Show interstitial ad for non-premium users before video
  if (mounted && !userLoading && !isPremium && !adCompleted) {
    return (
      <PremiumAdInterstitial
        movieTitle={`${match.teamA} vs ${match.teamB}`}
        duration={10}
        onComplete={handleAdComplete}
      />
    );
  }

  // Team Logo Component
  const TeamLogo = ({ name, logo, className: logoClassName }: { name: string; logo?: string | null; className?: string }) => (
    <div className={cn("relative flex items-center justify-center", logoClassName)}>
      {logo ? (
        <Image src={logo} alt={name} fill className="object-contain" />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10">
          <span className="text-white font-black text-2xl md:text-4xl">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d1b2a]">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#0d1b2a]/90 backdrop-blur-lg border-b border-[#1a3a5c]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/ciyaar" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-[#1a3a5c] rounded-lg text-sm border border-[#2a4a6c]">
              <Trophy size={14} className="text-[#f0ad4e]" />
              <span className="text-white/70">{match.leagueName}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <SocialShare title={`${match.teamA} vs ${match.teamB}`} url={`/match/${slug}`} />
          </div>
        </div>
      </div>

      {/* Match Header - Teams & Score */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {match.thumbnailUrl && (
            <Image src={match.thumbnailUrl} alt="" fill className="object-cover opacity-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b2a] via-[#0d1b2a]/60 to-[#0d1b2a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(220,38,38,0.1)_0%,transparent_50%)]" />
        </div>

        <div className="relative container mx-auto px-4 py-8 md:py-12">
          {/* League Badge */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Link
              href={`/ciyaar?league=${match.leagueId}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a3a5c] rounded-full border border-[#2a4a6c] hover:border-[#f0ad4e]/50 transition-colors"
            >
              <Trophy size={16} className="text-yellow-500" />
              <span className="text-sm font-medium text-white/70">{match.leagueName}</span>
            </Link>
            {match.status === "live" && <LiveBadge text="LIVE HADDA" size="lg" />}
            {match.isPremium && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold rounded-full">
                PREMIUM
              </span>
            )}
          </div>

          {/* Teams Display */}
          <div className="flex items-center justify-center gap-6 md:gap-12 mb-6">
            {/* Team A */}
            <div className="flex-1 flex flex-col items-center text-center max-w-[200px]">
              <TeamLogo
                name={match.teamA}
                logo={(match as any).teamALogo}
                className="w-20 h-20 md:w-28 md:h-28 mb-4"
              />
              <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wide">
                {match.teamA}
              </h2>
            </div>

            {/* Score / Time */}
            <div className="flex flex-col items-center">
              {match.status === "live" || match.status === "finished" ? (
                <>
                  <div className="flex items-center gap-4 md:gap-6 text-4xl md:text-6xl font-black text-white">
                    <span>{(match as any).scoreA ?? 0}</span>
                    <span className="text-white/20">-</span>
                    <span>{(match as any).scoreB ?? 0}</span>
                  </div>
                  {match.status === "live" && (match as any).minute && (
                    <div className="mt-3 px-4 py-2 bg-red-500/20 rounded-full">
                      <span className="text-red-400 text-lg font-bold">{(match as any).minute}'</span>
                    </div>
                  )}
                  {match.status === "finished" && (
                    <span className="mt-3 text-white/40 text-sm font-medium uppercase">Full Time</span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-3xl md:text-5xl font-black text-white/20">VS</span>
                  <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
                    <Clock size={16} className="text-green-400" />
                    <span className="text-green-400 text-sm font-bold">
                      {formatKickoffTime(match.kickoffAt)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 flex flex-col items-center text-center max-w-[200px]">
              <TeamLogo
                name={match.teamB}
                logo={(match as any).teamBLogo}
                className="w-20 h-20 md:w-28 md:h-28 mb-4"
              />
              <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wide">
                {match.teamB}
              </h2>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-center gap-4">
            <ViewerCount count={boostedViews} className="text-white/50" />
            <div className="w-1 h-1 bg-white/30 rounded-full" />
            {match.status === "upcoming" && (
              <MatchReminderButton matchId={match._id} />
            )}
            <MyListButton contentType="match" contentId={match._id} variant="icon" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Video Player Column */}
          <div className="lg:col-span-8">
            {/* PPV Gate */}
            {ppvAccess?.isPPV && !ppvAccess?.hasAccess ? (
              <PPVUnlockGate
                contentType="match"
                contentId={match._id}
                contentTitle={`${match.teamA} vs ${match.teamB}`}
              >
                <PlayerStage match={match as any} settings={settings} />
              </PPVUnlockGate>
            ) : (
              <PlayerStage match={match as any} settings={settings} />
            )}

            {/* Premium Promo */}
            {!isPremium && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <PremiumBannerNew />
              </motion.div>
            )}

            {/* Article Content */}
            {match.articleTitle && match.articleContent && (
              <article className="mt-8 bg-[#1a3a5c] rounded-2xl border border-[#2a4a6c] p-6 md:p-8">
                <AdSlot slotKey="match_article_top" className="mb-6" />
                <h2 className="text-2xl md:text-3xl font-black mb-4">{match.articleTitle}</h2>
                <div
                  dangerouslySetInnerHTML={{ __html: match.articleContent }}
                  className="prose prose-invert max-w-none text-white/70 leading-relaxed"
                />
                <AdSlot slotKey="match_article_bottom" className="mt-6" />
              </article>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#1a3a5c] rounded-xl border border-[#2a4a6c]">
              {[
                { id: "chat" as TabType, label: "Chat", icon: MessageCircle },
                { id: "stats" as TabType, label: "Stats", icon: BarChart3 },
                { id: "lineup" as TabType, label: "Lineup", icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-[#f0ad4e] text-black"
                      : "text-white/60 hover:text-white hover:bg-[#2a4a6c]"
                  )}
                >
                  <tab.icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <LiveChat matchId={match._id} />
                </motion.div>
              )}
              {activeTab === "stats" && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <PredictionCard
                    matchId={match._id}
                    teamA={match.teamA}
                    teamB={match.teamB}
                    kickoffAt={match.kickoffAt}
                    status={match.status}
                  />
                </motion.div>
              )}
              {activeTab === "lineup" && (
                <motion.div
                  key="lineup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#1a3a5c] rounded-xl border border-[#2a4a6c] p-6 text-center"
                >
                  <Users size={40} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">Lineup not available yet</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AdSlot slotKey="match_sidebar" />
          </div>
        </div>

        <AdSlot slotKey="match_below_player" className="my-8" />

        {/* Other Live Matches */}
        {otherLiveMatches.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase">LIVE HADDA</h2>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-bold">
                {otherLiveMatches.length} ciyaar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherLiveMatches.slice(0, 4).map((m: any) => (
                <MatchCardNew key={m._id} {...m} isLocked={m.isPremium && !isPremium} />
              ))}
            </div>
          </section>
        )}

        {/* Related Matches */}
        {relatedMatches && relatedMatches.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="w-1 h-6 bg-[#9AE600] rounded-full" />
                Ciyaaro kale oo xiiso leh
              </h2>
              <Link href={`/ciyaar?league=${match.leagueId}`} className="text-[#f0ad4e] hover:underline text-sm font-medium">
                Dhammaan →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedMatches.slice(0, 6).map((m: any) => (
                <MatchCardNew key={m._id} {...m} isLocked={m.isPremium && !isPremium} />
              ))}
            </div>
          </section>
        )}

        {/* Related News */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Newspaper className="text-[#3B82F6]" size={24} />
              Wararka Kubadda Cagta
            </h2>
            <Link href="/blog" className="text-[#f0ad4e] hover:underline text-sm font-medium">
              Dhamaan Wararka →
            </Link>
          </div>
          <RelatedNews limit={3} />
        </section>
      </div>
    </div>
  );
}
