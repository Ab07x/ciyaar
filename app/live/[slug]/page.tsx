"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { useState, useEffect, useRef } from "react";
import { AdSlot } from "@/components/AdSlot";
import { ChannelCard } from "@/components/ChannelCard";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    ArrowLeft, Crown, Radio, MessageSquare,
    Tv, ChevronRight, Play
} from "lucide-react";
import { StreamPlayer } from "@/components/StreamPlayer";

export default function ChannelWatchPage() {
    const params = useParams();
    const slug = params.slug as string;

    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: channel } = useSWR(`/api/channels/${slug}`, fetcher);
    const { data: allChannels } = useSWR("/api/channels?byStatus=true", fetcher);
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { isPremium, redeemCode } = useUser();

    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const hasTracked = useRef(false);

    // Track page view once on mount
    useEffect(() => {
        if (!hasTracked.current && channel) {
            hasTracked.current = true;
            fetch("/api/analytics/pageview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageType: "live", pageId: slug }),
            }).catch(() => { });
        }
    }, [channel, slug]);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [localUnlocked, setLocalUnlocked] = useState(false);

    if (!channel || !settings) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    const isUnlocked = !channel.isPremium || isPremium || localUnlocked;
    const activeEmbed = channel.embeds[activeEmbedIndex];

    // Related channels (same category, excluding current)
    const relatedChannels = allChannels?.all
        .filter((c: any) => c.category === channel.category && c._id !== channel._id)
        .slice(0, 4) || [];

    const handleRedeem = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setError("");
        const result = await redeemCode(code.trim());
        setLoading(false);
        if (result.success) {
            setLocalUnlocked(true);
        } else {
            setError(result.error || "Code qaldan");
        }
    };

    const whatsappLink = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}?text=Waxaan rabaa inaan furo channel ${channel.name}`;

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-6">
                {/* Breadcrumb */}
                <Link
                    href="/live"
                    className="inline-flex items-center gap-2 text-text-muted hover:text-accent-green transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    <span>Ku laabo Live TV</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Player Area */}
                    <div className="lg:col-span-2">
                        {/* Channel header */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                {channel.isLive && (
                                    <div className="flex items-center gap-1.5 bg-accent-red px-2.5 py-1 rounded-full">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        <span className="text-xs font-black text-white">LIVE</span>
                                    </div>
                                )}
                                {channel.isPremium && (
                                    <div className="flex items-center gap-1 bg-accent-gold px-2.5 py-1 rounded-full">
                                        <Crown size={12} className="text-black" />
                                        <span className="text-xs font-bold text-black">PREMIUM</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Player Stage */}
                        <div className="player-stage bg-stadium-elevated rounded-2xl overflow-hidden border border-border-strong mb-4">
                            {channel.isPremium && !isUnlocked ? (
                                /* Premium Lock UI */
                                <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-b from-stadium-dark/90 to-stadium-elevated">
                                    <div className="bg-stadium-dark border-2 border-accent-gold rounded-2xl p-8 max-w-md text-center">
                                        <div className="w-16 h-16 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Crown size={32} className="text-accent-gold" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-accent-gold mb-2">PREMIUM CHANNEL</h3>
                                        <p className="text-text-secondary mb-6">Channel-kan waxaa u baahan subscription</p>

                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={code}
                                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                                    placeholder="CODE"
                                                    className="flex-1 bg-stadium-elevated border border-border-subtle rounded-lg px-4 py-3 uppercase text-center tracking-wider"
                                                />
                                                <button
                                                    onClick={handleRedeem}
                                                    disabled={loading}
                                                    className="px-6 py-3 bg-accent-green text-black font-bold rounded-lg"
                                                >
                                                    {loading ? "..." : "Fur"}
                                                </button>
                                            </div>
                                            {error && <p className="text-accent-red text-sm">{error}</p>}
                                            <div className="flex gap-3">
                                                <Link
                                                    href="/pricing"
                                                    className="flex-1 px-4 py-3 bg-accent-gold text-black font-bold rounded-lg text-center"
                                                >
                                                    Iibso
                                                </Link>
                                                <a
                                                    href={whatsappLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                                                >
                                                    <MessageSquare size={18} />
                                                    WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : channel.isLive && activeEmbed?.url ? (
                                /* Live StreamPlayer */
                                <StreamPlayer
                                    source={{
                                        url: activeEmbed.url,
                                        type: (activeEmbed as any).type || "auto",
                                        isProtected: (activeEmbed as any).isProtected
                                    }}
                                    poster={channel.thumbnailUrl}
                                    className="absolute inset-0"
                                />
                            ) : (
                                /* Offline state */
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                    <Tv size={64} className="text-text-muted/30 mb-4" />
                                    <h3 className="text-xl font-bold text-text-muted mb-2">Channel offline</h3>
                                    <p className="text-text-muted">Channel-kan hadda ma shaqeynayo. Dib ugu soo laabo mar kale.</p>
                                </div>
                            )}
                        </div>

                        {/* Embed switcher */}
                        {isUnlocked && channel.embeds.length > 1 && (
                            <div className="flex flex-wrap gap-2 items-center mb-6">
                                <span className="text-xs text-text-muted uppercase font-bold tracking-wider mr-2">
                                    Haddii uusan shaqaynin → Bedel Link:
                                </span>
                                {channel.embeds.map((embed: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveEmbedIndex(index)}
                                        className={cn(
                                            "px-4 py-2 text-sm font-semibold rounded-md border transition-all",
                                            activeEmbedIndex === index
                                                ? "bg-accent-green text-black border-accent-green"
                                                : "bg-stadium-elevated text-text-secondary border-border-subtle hover:border-text-muted"
                                        )}
                                    >
                                        {embed.label || `Link ${index + 1}`}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Channel Info */}
                        <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-6 mb-6">
                            <h1 className="text-2xl font-black mb-2">{channel.name}</h1>
                            {channel.description && (
                                <p className="text-text-secondary">{channel.description}</p>
                            )}
                        </div>

                        <AdSlot slotKey="channel_below_player" className="mb-6" />
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <AdSlot slotKey="channel_sidebar" className="mb-6" />

                        {/* Related Channels */}
                        {relatedChannels.length > 0 && (
                            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">Channels la mid ah</h3>
                                    <Link
                                        href="/live"
                                        className="text-sm text-accent-green flex items-center gap-1"
                                    >
                                        Dhamaan <ChevronRight size={16} />
                                    </Link>
                                </div>
                                <div className="space-y-3">
                                    {relatedChannels.map((ch: any) => (
                                        <Link
                                            key={ch._id}
                                            href={`/live/${ch.slug}`}
                                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-stadium-hover transition-colors group"
                                        >
                                            <div className="w-16 h-10 bg-stadium-dark rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {ch.thumbnailUrl ? (
                                                    <img
                                                        src={ch.thumbnailUrl}
                                                        alt={ch.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Tv size={20} className="text-text-muted/30" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate group-hover:text-accent-green transition-colors">
                                                    {ch.name}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {ch.isLive && (
                                                        <span className="text-xs text-accent-red font-bold">LIVE</span>
                                                    )}
                                                    {ch.isPremium && (
                                                        <Crown size={10} className="text-accent-gold" />
                                                    )}
                                                </div>
                                            </div>
                                            <Play size={16} className="text-text-muted group-hover:text-accent-green transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
