"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Crown, Radio, Tv, Lock, Play } from "lucide-react";

interface ChannelCardProps {
    slug: string;
    name: string;
    description?: string;
    thumbnailUrl?: string;
    category: "sports" | "entertainment" | "news" | "movies";
    isPremium: boolean;
    isLive: boolean;
    isLocked?: boolean;
}

const categoryConfig = {
    sports: { label: "Sports", color: "bg-accent-green/20 text-accent-green" },
    entertainment: { label: "Entertainment", color: "bg-purple-500/20 text-purple-400" },
    news: { label: "News", color: "bg-blue-500/20 text-blue-400" },
    movies: { label: "Movies", color: "bg-orange-500/20 text-orange-400" },
};

export function ChannelCard({
    slug,
    name,
    description,
    thumbnailUrl,
    category,
    isPremium,
    isLive,
    isLocked = false,
}: ChannelCardProps) {
    const cat = categoryConfig[category];

    return (
        <Link
            href={`/live/${slug}`}
            className={cn(
                "group relative block rounded-2xl overflow-hidden border-2 transition-all duration-300",
                "bg-stadium-elevated hover:bg-stadium-hover",
                isPremium ? "border-accent-gold/30 hover:border-accent-gold" : "border-border-strong hover:border-accent-green",
                "card-hover"
            )}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-stadium-dark overflow-hidden">
                {thumbnailUrl ? (
                    <Image
                        src={thumbnailUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stadium-elevated to-stadium-dark">
                        <Tv size={48} className="text-text-muted/30" />
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Live indicator */}
                {isLive && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-accent-red px-2.5 py-1 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <span className="text-xs font-black text-white tracking-wide">LIVE</span>
                    </div>
                )}

                {/* Premium badge */}
                {isPremium && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent-gold/90 px-2 py-1 rounded-full">
                        <Crown size={12} className="text-black" />
                        <span className="text-xs font-bold text-black">PREMIUM</span>
                    </div>
                )}

                {/* Play button on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-accent-green/90 flex items-center justify-center shadow-2xl">
                        {isLocked ? (
                            <Lock size={24} className="text-black" />
                        ) : (
                            <Play size={28} className="text-black ml-1" fill="black" />
                        )}
                    </div>
                </div>

                {/* Category badge */}
                <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-lg text-xs font-bold ${cat.color}`}>
                    {cat.label}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-lg text-white group-hover:text-accent-green transition-colors line-clamp-1">
                    {name}
                </h3>
                {description && (
                    <p className="text-sm text-text-muted mt-1 line-clamp-2">{description}</p>
                )}

                {/* Status bar */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                    <div className="flex items-center gap-2">
                        <Radio size={14} className={isLive ? "text-accent-red" : "text-text-muted"} />
                        <span className={`text-xs font-medium ${isLive ? "text-accent-red" : "text-text-muted"}`}>
                            {isLive ? "On Air" : "Offline"}
                        </span>
                    </div>
                    {isPremium && isLocked && (
                        <div className="flex items-center gap-1 text-xs text-accent-gold">
                            <Lock size={12} />
                            <span>Subscription Required</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium gradient border glow */}
            {isPremium && (
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent-gold/0 via-accent-gold/10 to-accent-gold/0" />
                </div>
            )}
        </Link>
    );
}
