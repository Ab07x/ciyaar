"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlayerStage } from "@/components/PlayerStage";
import { MatchCard } from "@/components/MatchCard";
import { AdSlot } from "@/components/AdSlot";
import Link from "next/link";
import { ChevronLeft, Newspaper } from "lucide-react";
import { ViewCounter } from "@/components/ViewCounter";
import { SocialShare } from "@/components/SocialShare";
import { LiveChat } from "@/components/LiveChat";
import { RelatedNews } from "@/components/RelatedNews";
import { MyListButton } from "@/components/MyListButton";
import { PremiumPromoBanner } from "@/components/PremiumPromoBanner";
import { PremiumAdInterstitial } from "@/components/PremiumAdInterstitial";
import { useUser } from "@/providers/UserProvider";
import { useState } from "react";

interface MatchClientPageProps {
    slug: string;
}

export default function MatchClientPage({ slug }: MatchClientPageProps) {
    const { isPremium } = useUser();
    const [showInterstitial, setShowInterstitial] = useState(true);
    const [adCompleted, setAdCompleted] = useState(false);
    const match = useQuery(api.matches.getMatchBySlug, { slug });
    const settings = useQuery(api.settings.getSettings);
    const relatedMatches = useQuery(api.matches.getRelatedMatches, (match && match.leagueId) ? { matchId: match._id, leagueId: match.leagueId } : "skip");
    const matchesStatus = useQuery(api.matches.getMatchesByStatus);

    if (match === undefined || settings === undefined || matchesStatus === undefined) {
        return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div></div>;
    }

    if (match === null) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-black mb-4">Ciyaartan lama helin</h1>
                <p className="text-text-secondary mb-8">Fadlan hubi URL-ka aad soo raacday</p>
                <Link href="/" className="bg-accent-green text-black px-6 py-3 rounded-lg font-bold">Ku laabo Home</Link>
            </div>
        );
    }

    const otherLiveMatches = matchesStatus.live.filter((m: any) => m._id !== match._id);

    // Show interstitial ad for non-premium users before video
    if (!isPremium && showInterstitial && !adCompleted) {
        return (
            <PremiumAdInterstitial
                movieTitle={`${match.teamA} vs ${match.teamB}`}
                duration={10}
                onComplete={() => {
                    setAdCompleted(true);
                    setShowInterstitial(false);
                }}
            />
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"><ChevronLeft size={18} /> Ku laabo</Link>
                <SocialShare title={`${match.teamA} vs ${match.teamB}`} url={`/match/${slug}`} />
            </div>

            <div className="mb-4">
                <Link href={`/ciyaar?league=${match.leagueId}`} className="text-xs text-accent-green font-bold uppercase tracking-wider hover:underline">
                    {match.leagueName}
                </Link>
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl md:text-4xl font-black">{match.teamA} <span className="text-accent-green">vs</span> {match.teamB} – Ciyaar Live</h1>
                    <MyListButton contentType="match" contentId={match._id} variant="icon" />
                </div>
                <div className="flex items-center gap-4 mt-2">
                    {match.isPremium && <span className="px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs font-bold rounded-full">PREMIUM</span>}
                    <div className="flex items-center gap-1.5 text-text-muted text-xs">
                        <ViewCounter id={match._id} collection="matches" initialViews={match.views} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-8">
                    <PlayerStage match={match as any} settings={settings} />

                    {/* Premium Promo Banner - Hidden for premium users */}
                    {!isPremium && (
                        <div className="mt-6">
                            <PremiumPromoBanner />
                        </div>
                    )}

                    {match.articleTitle && match.articleContent && (
                        <article className="mt-8 prose prose-invert max-w-none">
                            <AdSlot slotKey="match_article_top" className="mb-6" />
                            <h2 className="text-3xl font-black mb-4">{match.articleTitle}</h2>
                            <div dangerouslySetInnerHTML={{ __html: match.articleContent }} className="text-text-secondary leading-relaxed" />
                            <AdSlot slotKey="match_article_bottom" className="mt-6" />
                        </article>
                    )}
                </div>
                <div className="lg:col-span-4 space-y-6">
                    <AdSlot slotKey="match_sidebar" />
                    <LiveChat matchId={match._id} />
                </div>
            </div>

            <AdSlot slotKey="match_below_player" className="mb-8" />

            {/* Floating Premium CTA Banner - for non-premium users */}
            {!isPremium && (
                <div className="relative my-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 animate-pulse" />

                    <div className="relative bg-gradient-to-r from-amber-900/50 to-amber-800/50 border border-amber-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-amber-400 font-bold text-lg">Fur Premium Features</p>
                            <p className="text-white/70 text-sm">Full HD • Xayeysiis La&apos;aan • Download</p>
                        </div>
                        <Link href="/pricing" className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all hover:scale-105 whitespace-nowrap">
                            Premium Ka Noqo
                        </Link>
                    </div>
                </div>
            )}

            {otherLiveMatches.length > 0 && (
                <section className="relative mb-12">
                    {/* Background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent rounded-3xl" />

                    {/* Animated border container */}
                    <div className="relative border border-red-500/30 rounded-3xl p-6 backdrop-blur-sm">
                        {/* Header with live pulse */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                                <div className="w-3 h-3 bg-red-500 rounded-full" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase">LIVE HADDA</h2>
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-bold">
                                {otherLiveMatches.length} ciyaar
                            </span>
                        </div>

                        {/* Cards grid with hover glow */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {otherLiveMatches.map((m: any) => <MatchCard key={m._id} {...m} glowColor="red" />)}
                        </div>
                    </div>
                </section>
            )}

            {relatedMatches && relatedMatches.length > 0 && (
                <section className="relative mb-12">
                    {/* Background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#9AE600]/5 to-transparent rounded-3xl" />

                    <div className="relative border border-[#9AE600]/20 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-1 h-6 bg-[#9AE600] rounded-full" />
                                Ciyaaro kale oo xiiso leh
                            </h2>
                            <Link href={`/ciyaar?league=${match.leagueId}`} className="text-[#9AE600] hover:underline text-sm font-medium">
                                Dhammaan →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {relatedMatches.slice(0, 6).map((m: any) => <MatchCard key={m._id} {...m} glowColor="green" />)}
                        </div>
                    </div>
                </section>
            )}

            {/* Related News Section for SEO */}
            <section className="relative mb-12">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-3xl" />

                <div className="relative border border-blue-500/20 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Newspaper className="text-blue-400" size={24} />
                            Wararka Kubadda Cagta
                        </h2>
                        <Link href="/blog" className="text-blue-400 hover:underline text-sm font-medium">
                            Dhamaan Wararka →
                        </Link>
                    </div>
                    <RelatedNews limit={3} />
                </div>
            </section>
        </div>
    );
}
