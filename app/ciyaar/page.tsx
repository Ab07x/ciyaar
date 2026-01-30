"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MatchCardNew } from "@/components/MatchCardNew";
import { EmptyState, NoMatchesState } from "@/components/EmptyState";
import { AdSlot } from "@/components/AdSlot";
import { SkeletonMatchGrid } from "@/components/ui/SkeletonMatchCard";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Radio, Calendar, CheckCircle, LayoutGrid, ChevronLeft } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

type FilterStatus = "all" | "live" | "upcoming" | "finished";

const filterConfig: Record<FilterStatus, { label: string; labelSo: string; icon: any; color: string }> = {
  all: { label: "All", labelSo: "Dhammaan", icon: LayoutGrid, color: "text-white" },
  live: { label: "Live", labelSo: "Live", icon: Radio, color: "text-[#DC2626]" },
  upcoming: { label: "Upcoming", labelSo: "Soo Socda", icon: Calendar, color: "text-[#9AE600]" },
  finished: { label: "Finished", labelSo: "Dhamaad", icon: CheckCircle, color: "text-white/50" }
};

function MatchesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leagueIdParam = searchParams.get("league");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const matches = useQuery(api.matches.listMatches, {
    status: filter === "all" ? undefined : filter as any,
    leagueId: leagueIdParam || undefined
  });
  const { isPremium } = useUser();

  // Count matches by status for the badges
  const allMatches = useQuery(api.matches.listMatches, {});
  const liveCount = allMatches?.filter(m => m.status === "live").length || 0;

  return (
    <>
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="text-yellow-500" size={28} />
              {liveCount > 0 && <LiveBadge text={`${liveCount} LIVE`} />}
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-2 uppercase tracking-tight">
              Daawo Ciyaar Live
            </h1>
            <p className="text-white/60 text-lg">
              Halkan kala soco dhammaan ciyaaraha live-ka ah iyo natiijooyinka kubadda cagta.
            </p>
          </div>
        </div>

        {leagueIdParam && (
          <button
            onClick={() => router.push('/ciyaar')}
            className="flex items-center gap-2 text-[#f0ad4e] hover:text-[#f0ad4e]/80 transition-colors font-bold"
          >
            <ChevronLeft size={20} />
            View All Leagues
          </button>
        )}

        {/* Filter Tabs - Redesigned */}
        <div className="flex items-center gap-2 p-1 bg-[#1a3a5c] rounded-xl border border-[#2a4a6c] w-full md:w-fit overflow-x-auto no-scrollbar">
          {(Object.keys(filterConfig) as FilterStatus[]).map((status) => {
            const config = filterConfig[status];
            const Icon = config.icon;
            const isActive = filter === status;
            const count = status === "live" ? liveCount : 0;

            return (
              <motion.button
                key={status}
                onClick={() => setFilter(status)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  isActive
                    ? "bg-[#f0ad4e] text-black"
                    : "text-white/60 hover:text-white hover:bg-[#2a4a6c]"
                )}
              >
                <Icon size={16} className={cn(isActive ? "text-black" : config.color)} />
                <span>{config.labelSo}</span>
                {count > 0 && status === "live" && (
                  <span className={cn(
                    "px-1.5 py-0.5 text-[10px] rounded-full",
                    isActive ? "bg-red-500 text-white" : "bg-red-500/20 text-red-400"
                  )}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#1a3a5c] w-full" />

      {/* Ad Slot */}
      <AdSlot slotKey="archive_sidebar" className="my-6" />

      {/* Match Grid */}
      <AnimatePresence mode="wait">
        {matches === undefined ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SkeletonMatchGrid count={8} />
          </motion.div>
        ) : matches.length > 0 ? (
          <motion.div
            key="matches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {matches.map((match, index) => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MatchCardNew
                  {...match}
                  isLocked={match.isPremium && !isPremium}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {filter === "live" ? (
              <EmptyState
                icon="match"
                title="Ma jiraan ciyaaro live ah hadda"
                description="Wax ciyaar live ah ma jiraan hadda. Fiiri jadwalka ciyaaraha soo socda."
                actionLabel="Eeg Jadwalka"
                onAction={() => setFilter("upcoming")}
              />
            ) : filter === "upcoming" ? (
              <EmptyState
                icon="calendar"
                title="Ma jiraan ciyaaro soo socda"
                description="Jadwalka ciyaaraha weli lama sii dayn."
              />
            ) : (
              <NoMatchesState />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function CiyaarArchivePage() {
  return (
    <div className="relative min-h-screen bg-[#0d1b2a]">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(154,230,0,0.03)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(220,38,38,0.05)_0%,transparent_30%)]" />
      </div>

      <main className="relative z-10 p-4 md:p-8 space-y-8 max-w-[1800px] mx-auto">
        <Suspense
          fallback={
            <div className="space-y-8">
              <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
              <SkeletonMatchGrid count={8} />
            </div>
          }
        >
          <MatchesContent />
        </Suspense>
      </main>
    </div>
  );
}
