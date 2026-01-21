import Link from "next/link";
import Image from "next/image";
import { Badge } from "./Badge";
import { formatKickoffTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Eye, Play, Tv } from "lucide-react";
import { getBoostedViews, formatViews } from "@/lib/analytics";
import type { Id } from "@/convex/_generated/dataModel";

interface MatchCardProps {
    _id: Id<"matches">;
    slug: string;
    title: string;
    teamA: string;
    teamB: string;
    league?: string;
    leagueName?: string;
    kickoffAt: number;
    status: "live" | "upcoming" | "finished";
    isPremium: boolean;
    thumbnailUrl?: string | null;
    views?: number;
    className?: string;
}

export function MatchCard({
    _id,
    slug,
    title,
    teamA,
    teamB,
    league,
    leagueName,
    kickoffAt,
    status,
    isPremium,
    thumbnailUrl,
    views,
    className,
}: MatchCardProps) {
    return (
        <Link href={`/match/${slug}`} className="block">
            <div
                className={cn(
                    "bg-stadium-elevated rounded-xl overflow-hidden border border-border-subtle card-hover group",
                    className
                )}
            >
                {/* Thumbnail */}
                <div className="relative w-full aspect-video bg-stadium-hover overflow-hidden">
                    {thumbnailUrl ? (
                        <Image
                            src={thumbnailUrl}
                            alt={`${teamA} vs ${teamB} ciyaar live maanta`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-stadium-elevated to-stadium-dark">
                            <Tv size={48} className="text-text-muted/30" />
                        </div>
                    )}

                    {/* Overlay on hover - Play button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-accent-green text-black rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform">
                            <Play size={24} fill="currentColor" />
                        </div>
                    </div>

                    {/* Badges positioned on thumbnail */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {status === "live" && <Badge variant="live" />}
                        {isPremium && <Badge variant="premium" />}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-1">
                        {teamA} vs {teamB}
                    </h3>

                    {/* League */}
                    <p className="text-sm text-text-secondary mb-3 line-clamp-1">{league || leagueName}</p>

                    <div className="flex items-center justify-between">
                        {/* Status/Time */}
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                            {status === "upcoming" && (
                                <span className="px-2 py-1 bg-accent-green/10 text-accent-green rounded font-medium">
                                    {formatKickoffTime(kickoffAt)}
                                </span>
                            )}
                            {status === "finished" && (
                                <span className="px-2 py-1 bg-stadium-hover text-text-muted rounded">
                                    Dhamaatay
                                </span>
                            )}
                            {status === "live" && (
                                <span className="px-2 py-1 bg-accent-red/10 text-accent-red rounded font-bold">
                                    LIVE HADDA
                                </span>
                            )}
                        </div>

                        {/* Views */}
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Eye size={12} />
                            <span>{formatViews(getBoostedViews(String(_id), views || 0))}</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-4">
                        <span className={cn(
                            "cta-primary w-full text-sm",
                            status === "live" && "animate-pulse"
                        )}>
                            <Play size={16} fill="currentColor" />
                            {status === "live" ? "Daawo Hadda" : status === "upcoming" ? "Jadwalka" : "Dib u Eeg"}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
