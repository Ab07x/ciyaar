"use client";

import useSWR from "swr";
import { ChannelCard } from "@/components/ChannelCard";
import { PremiumBanner } from "@/components/PremiumBanner";
import { AdSlot } from "@/components/AdSlot";
import { useUser } from "@/providers/UserProvider";
import { useState } from "react";
import { Radio, Tv, Crown, Sparkles, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { RamadanBanner } from "@/components/RamadanBanner";

const categories = [
    { id: "all", label: "Dhammaan", icon: Tv },
    { id: "sports", label: "Sports", icon: Radio },
    { id: "entertainment", label: "Entertainment", icon: Sparkles },
    { id: "news", label: "News", icon: Tv },
    { id: "movies", label: "Movies", icon: Tv },
] as const;

export default function LivePage() {
    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: channelData } = useSWR("/api/channels?byStatus=true", fetcher);
    const { isPremium } = useUser();
    const [activeCategory, setActiveCategory] = useState<string>("all");

    if (!channelData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    const { live, free, premium, all } = channelData;

    // Filter channels by category
    const filteredChannels = activeCategory === "all"
        ? all
        : all.filter((c) => c.category === activeCategory);

    const filteredFree = activeCategory === "all"
        ? free
        : free.filter((c) => c.category === activeCategory);

    const filteredPremium = activeCategory === "all"
        ? premium
        : premium.filter((c) => c.category === activeCategory);

    return (
        <div className="relative min-h-screen">
            <RamadanBanner variant="slim" />
            {/* Background Image */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: "url('/theater.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-stadium-dark/95 via-stadium-dark/90 to-stadium-dark" />
            </div>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="relative py-12 md:py-20 overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-accent-red/10 via-transparent to-transparent" />

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative">
                                <span className="absolute inset-0 animate-ping bg-accent-red rounded-full opacity-75"></span>
                                <span className="relative flex h-4 w-4 rounded-full bg-accent-red"></span>
                            </div>
                            <span className="text-accent-red font-bold tracking-wide">LIVE TV</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                            Daawo <span className="text-accent-green">Live Channels</span>
                        </h1>
                        <p className="text-xl text-text-secondary max-w-2xl">
                            Ku daawo channels-ka tooska ah ee dunida – Sports, Entertainment, News iyo wax badan oo kale.
                        </p>

                        {/* Live count badge */}
                        {live.length > 0 && (
                            <div className="inline-flex items-center gap-2 mt-6 bg-accent-red/20 border border-accent-red/30 text-accent-red px-4 py-2 rounded-full">
                                <Radio size={16} className="animate-pulse" />
                                <span className="font-bold">{live.length} Channel{live.length > 1 ? "s" : ""} LIVE hadda</span>
                            </div>
                        )}
                    </div>
                </section>

                <div className="container mx-auto px-4 pb-16">
                    <AdSlot slotKey="live_top" className="mb-8" />

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2 mb-8 p-2 bg-stadium-elevated/80 backdrop-blur-sm rounded-2xl border border-border-strong">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all",
                                        isActive
                                            ? "bg-accent-green text-black"
                                            : "text-text-secondary hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    <Icon size={16} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Live Now Section */}
                    {live.length > 0 && (
                        <section className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-accent-red/20 text-accent-red rounded-xl flex items-center justify-center">
                                    <Radio size={20} />
                                </div>
                                <h2 className="text-2xl font-black">LIVE HADA</h2>
                                <span className="text-xs bg-accent-red/20 text-accent-red px-2 py-1 rounded-full font-bold">
                                    {live.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {live.map((channel) => (
                                    <ChannelCard
                                        key={channel._id}
                                        {...channel}
                                        isLocked={channel.isPremium && !isPremium}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Free Channels */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-accent-green/20 text-accent-green rounded-xl flex items-center justify-center">
                                <Tv size={20} />
                            </div>
                            <h2 className="text-2xl font-black">FREE CHANNELS</h2>
                            <span className="text-xs bg-stadium-hover px-2 py-1 rounded-full text-text-muted">
                                {filteredFree.length}
                            </span>
                        </div>
                        {filteredFree.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredFree.map((channel) => (
                                    <ChannelCard key={channel._id} {...channel} isLocked={false} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 text-center">
                                <Tv size={48} className="text-text-muted/30 mx-auto mb-4" />
                                <p className="text-text-muted">Ma jiraan free channels category-gan.</p>
                            </div>
                        )}
                    </section>

                    <AdSlot slotKey="live_middle" className="mb-12" />

                    {/* Premium Banner */}
                    {!isPremium && <PremiumBanner className="mb-12" />}

                    {/* Premium Channels */}
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-accent-gold/20 text-accent-gold rounded-xl flex items-center justify-center">
                                <Crown size={20} />
                            </div>
                            <h2 className="text-2xl font-black">PREMIUM CHANNELS</h2>
                            <span className="text-xs bg-accent-gold/20 text-accent-gold px-2 py-1 rounded-full font-bold">
                                {filteredPremium.length}
                            </span>
                        </div>
                        {filteredPremium.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredPremium.map((channel) => (
                                    <ChannelCard
                                        key={channel._id}
                                        {...channel}
                                        isLocked={!isPremium}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-stadium-elevated border border-accent-gold/30 rounded-2xl p-8 text-center">
                                <Crown size={48} className="text-accent-gold/30 mx-auto mb-4" />
                                <p className="text-text-muted">Ma jiraan premium channels category-gan.</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
