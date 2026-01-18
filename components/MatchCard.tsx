import Link from "next/link";
import Image from "next/image";
import { Badge } from "./Badge";
import { formatKickoffTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
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
        <Link href={`/match/${slug}`}>
            <div
                className={cn(
                    "bg-stadium-elevated rounded-lg overflow-hidden border border-border-subtle card-hover",
                    className
                )}
            >
                {/* Thumbnail */}
                <div className="relative w-full aspect-video bg-stadium-hover">
                    {thumbnailUrl ? (
                        <Image
                            src={thumbnailUrl}
                            alt={`${teamA} vs ${teamB} ciyaar live maanta`}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-6xl">
                            ⚽
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Badges */}
                    <div className="flex gap-2 mb-3">
                        {status === "live" && <Badge variant="live" />}
                        {isPremium && <Badge variant="premium" />}
                        {status === "upcoming" && <Badge variant="upcoming" />}
                        {status === "finished" && <Badge variant="finished" />}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-2">
                        {teamA} vs {teamB}
                    </h3>

                    {/* League */}
                    <p className="text-sm text-text-secondary mb-2">{league || leagueName}</p>

                    <div className="flex items-center justify-between text-xs text-text-muted">
                        <p>{formatKickoffTime(kickoffAt)}</p>
                        <div className="flex items-center gap-1">
                            <Eye size={12} />
                            <span>{formatViews(getBoostedViews(String(_id), views || 0))}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
