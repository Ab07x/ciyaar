"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlayerStage } from "@/components/PlayerStage";
import { MatchCard } from "@/components/MatchCard";
import { AdSlot } from "@/components/AdSlot";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ViewCounter } from "@/components/ViewCounter";
import { SocialShare } from "@/components/SocialShare";
import { LiveChat } from "@/components/LiveChat";

interface MatchClientPageProps {
    slug: string;
}

export default function MatchClientPage({ slug }: MatchClientPageProps) {
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"><ChevronLeft size={18} /> Ku laabo</Link>
                <SocialShare title={`${match.teamA} vs ${match.teamB}`} url={`/match/${slug}`} />
            </div>

            <div className="mb-4">
                <span className="text-xs text-text-muted uppercase tracking-wider">{match.leagueName}</span>
                <h1 className="text-2xl md:text-4xl font-black">{match.teamA} <span className="text-accent-green">vs</span> {match.teamB}</h1>
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

                    {match.articleTitle && match.articleContent && (
                        <article className="mt-8 prose prose-invert max-w-none">
                            <AdSlot slotKey="match_article_top" className="mb-6" />
                            <h1 className="text-3xl font-black mb-4">{match.articleTitle}</h1>
                            <div dangerouslySetInnerHTML={{ __html: match.articleContent }} className="text-text-secondary whitespace-pre-wrap leading-relaxed" />
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

            {otherLiveMatches.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-accent-red rounded-full animate-pulse" />
                        <h2 className="text-xl font-black uppercase">CIYAARO KALE OO LIVE AH</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {otherLiveMatches.map((m: any) => <MatchCard key={m._id} {...m} />)}
                    </div>
                </section>
            )}

            {relatedMatches && relatedMatches.length > 0 && (
                <section>
                    <h2 className="text-xl font-black mb-4">CIYAARO KALE</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {relatedMatches.slice(0, 6).map((m: any) => <MatchCard key={m._id} {...m} />)}
                    </div>
                </section>
            )}
        </div>
    );
}
