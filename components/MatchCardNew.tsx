"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Play, Lock, Bell, Eye, Trophy, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { LiveBadge } from "./ui/LiveBadge";
import { ViewerCount } from "./ui/ViewerCount";
import { formatKickoffTime } from "@/lib/date-utils";
import { getBoostedViews } from "@/lib/analytics";
import type { Id } from "@/convex/_generated/dataModel";

interface MatchCardNewProps {
  _id: Id<"matches">;
  slug: string;
  title: string;
  teamA: string;
  teamB: string;
  teamALogo?: string | null;
  teamBLogo?: string | null;
  scoreA?: number;
  scoreB?: number;
  league?: string;
  leagueName?: string;
  leagueLogo?: string | null;
  kickoffAt: number;
  status: "live" | "upcoming" | "finished";
  isPremium: boolean;
  thumbnailUrl?: string | null;
  views?: number;
  minute?: number;
  className?: string;
  isLocked?: boolean;
  variant?: "default" | "compact" | "featured";
}

export function MatchCardNew({
  _id,
  slug,
  title,
  teamA,
  teamB,
  teamALogo,
  teamBLogo,
  scoreA,
  scoreB,
  league,
  leagueName,
  leagueLogo,
  kickoffAt,
  status,
  isPremium,
  thumbnailUrl,
  views = 0,
  minute,
  className,
  isLocked = false,
  variant = "default"
}: MatchCardNewProps) {
  const displayLeague = league || leagueName;
  const boostedViews = getBoostedViews(String(_id), views);

  // Team logo fallback - show first letter
  const TeamLogo = ({ name, logo, className: logoClassName }: { name: string; logo?: string | null; className?: string }) => (
    <div className={cn("relative flex items-center justify-center", logoClassName)}>
      {logo ? (
        <Image
          src={logo}
          alt={name}
          fill
          className="object-contain"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10">
          <span className="text-white font-black text-lg">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );

  if (variant === "featured") {
    return (
      <Link href={`/match/${slug}`} className="block group">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          className={cn(
            "relative overflow-hidden rounded-2xl",
            "bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]",
            "border border-white/10 hover:border-white/20",
            "transition-all duration-300",
            "shadow-xl hover:shadow-2xl hover:shadow-red-500/10",
            className
          )}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
          </div>

          {/* Thumbnail Background */}
          {thumbnailUrl && (
            <div className="absolute inset-0 opacity-20">
              <Image src={thumbnailUrl} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
            </div>
          )}

          <div className="relative z-10 p-6 md:p-8">
            {/* Top Bar - League & Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {leagueLogo && (
                  <div className="w-6 h-6 relative">
                    <Image src={leagueLogo} alt={displayLeague || ""} fill className="object-contain" />
                  </div>
                )}
                <span className="text-white/60 text-sm font-medium uppercase tracking-wider">
                  {displayLeague}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {status === "live" && <LiveBadge text="LIVE HADDA" />}
                {isPremium && (
                  <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[10px] font-bold rounded uppercase">
                    Premium
                  </span>
                )}
              </div>
            </div>

            {/* Teams Display */}
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* Team A */}
              <div className="flex-1 flex flex-col items-center text-center">
                <TeamLogo name={teamA} logo={teamALogo} className="w-16 h-16 md:w-20 md:h-20 mb-3" />
                <h3 className="text-white font-bold text-sm md:text-base uppercase tracking-wide line-clamp-1">
                  {teamA}
                </h3>
              </div>

              {/* Score / Time */}
              <div className="flex flex-col items-center">
                {status === "live" || status === "finished" ? (
                  <>
                    <div className="flex items-center gap-3 text-3xl md:text-4xl font-black text-white">
                      <span>{scoreA ?? 0}</span>
                      <span className="text-white/30">-</span>
                      <span>{scoreB ?? 0}</span>
                    </div>
                    {status === "live" && minute && (
                      <div className="mt-2 px-3 py-1 bg-red-500/20 rounded-full">
                        <span className="text-red-400 text-sm font-bold">{minute}'</span>
                      </div>
                    )}
                    {status === "finished" && (
                      <span className="mt-2 text-white/40 text-sm font-medium">FT</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-2xl md:text-3xl font-black text-white/30">VS</span>
                    <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 rounded-full">
                      <Clock size={14} className="text-green-400" />
                      <span className="text-green-400 text-sm font-bold">
                        {formatKickoffTime(kickoffAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Team B */}
              <div className="flex-1 flex flex-col items-center text-center">
                <TeamLogo name={teamB} logo={teamBLogo} className="w-16 h-16 md:w-20 md:h-20 mb-3" />
                <h3 className="text-white font-bold text-sm md:text-base uppercase tracking-wide line-clamp-1">
                  {teamB}
                </h3>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between">
              <ViewerCount count={boostedViews} className="text-white/50" />

              <button
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
                  "hover:scale-105 active:scale-95",
                  isLocked
                    ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black"
                    : status === "live"
                      ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30"
                      : "bg-white text-black"
                )}
              >
                {isLocked ? (
                  <>
                    <Lock size={16} />
                    Premium
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    {status === "live" ? "Daawo Hadda" : "Daawo"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live glow effect */}
          {status === "live" && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none">
              <div className="absolute inset-0 rounded-2xl border-2 border-red-500/50 animate-pulse" />
            </div>
          )}
        </motion.div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/match/${slug}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        className={cn(
          "relative overflow-hidden rounded-xl",
          "bg-gradient-to-br from-[#1a1a1a] to-[#111111]",
          "border border-white/10 hover:border-white/20",
          "transition-all duration-300",
          "shadow-lg hover:shadow-xl",
          status === "live" && "hover:shadow-red-500/20 hover:border-red-500/30",
          isLocked && "opacity-90",
          className
        )}
      >
        {/* Card Header - League */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-yellow-500" />
            <span className="text-white/70 text-xs font-medium uppercase tracking-wider truncate">
              {displayLeague}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {status === "live" && <LiveBadge size="sm" />}
            {isPremium && (
              <span className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[9px] font-bold rounded uppercase">
                Premium
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4">
          {/* Teams Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 overflow-hidden">
            {/* Team A */}
            <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
              <TeamLogo name={teamA} logo={teamALogo} className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
              <span className="text-white font-semibold text-xs sm:text-sm truncate">{teamA}</span>
            </div>

            {/* Score/VS */}
            <div className="flex-shrink-0 px-2 sm:px-3">
              {status === "live" || status === "finished" ? (
                <div className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-black">
                  <span className="text-white">{scoreA ?? 0}</span>
                  <span className="text-white/30">-</span>
                  <span className="text-white">{scoreB ?? 0}</span>
                </div>
              ) : (
                <span className="text-white/30 font-bold text-sm sm:text-base">VS</span>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 min-w-0 flex items-center justify-end gap-2 sm:gap-3">
              <span className="text-white font-semibold text-xs sm:text-sm truncate text-right">{teamB}</span>
              <TeamLogo name={teamB} logo={teamBLogo} className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {status === "live" && minute && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded font-bold">
                  {minute}'
                </span>
              )}
              {status === "upcoming" && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded font-medium">
                  <Clock size={12} />
                  {formatKickoffTime(kickoffAt)}
                </span>
              )}
              {status === "finished" && (
                <span className="px-2 py-1 bg-white/10 text-white/50 rounded font-medium">
                  Dhamaatay
                </span>
              )}
            </div>
            <ViewerCount count={boostedViews} />
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-4 pb-4">
          <div
            className={cn(
              "flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold text-sm transition-all",
              "group-hover:scale-[1.02]",
              isLocked
                ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black"
                : status === "live"
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white"
                  : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isLocked ? (
              <>
                <Lock size={16} />
                Premium Keliya
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                {status === "live" ? "Daawo Hadda" : status === "upcoming" ? "Jadwalka" : "Dib u Eeg"}
              </>
            )}
          </div>
        </div>

        {/* Live indicator line */}
        {status === "live" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse" />
        )}
      </motion.div>
    </Link>
  );
}
