"use client";

import { cn } from "@/lib/utils";
import { Film, Trophy, Calendar, Search, Tv } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: string | "match" | "movie" | "search" | "calendar" | "tv";
  message?: string;
  hint?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "match",
  message,
  hint,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className
}: EmptyStateProps) {
  // Support both string emojis and icon types
  const iconMap: Record<string, any> = {
    match: Trophy,
    movie: Film,
    search: Search,
    calendar: Calendar,
    tv: Tv
  };

  const IconComponent = typeof icon === "string" && iconMap[icon] ? iconMap[icon] : null;
  const displayTitle = title || message;
  const displayDescription = description || hint;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        "bg-white/5 rounded-2xl border border-white/10",
        className
      )}
    >
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
          {IconComponent ? (
            <IconComponent size={40} className="text-white/30" />
          ) : (
            <span className="text-5xl">{icon}</span>
          )}
        </div>
        {/* Decorative ring */}
        <div
          className="absolute inset-0 rounded-full border border-white/5 animate-ping"
          style={{ animationDuration: "2s" }}
        />
      </div>

      {/* Title */}
      {displayTitle && (
        <h3 className="text-xl font-bold text-white mb-2">{displayTitle}</h3>
      )}

      {/* Description */}
      {displayDescription && (
        <p className="text-white/50 text-sm max-w-sm mb-6">{displayDescription}</p>
      )}

      {/* Action button */}
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link
            href={actionHref}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
          >
            {actionLabel}
          </button>
        )
      )}
    </motion.div>
  );
}

// Specific empty states for common use cases
export function NoMatchesState() {
  return (
    <EmptyState
      icon="match"
      title="Ma jiraan ciyaaro hadda"
      description="Wax ciyaar live ah ma jiraan hadda. Fiiri jadwalka ama browse filimada."
      actionLabel="Browse Movies"
      actionHref="/movies"
    />
  );
}

export function NoResultsState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="search"
      title="Ma helin wax"
      description={query ? `Ma helin wax la xidhiidha "${query}"` : "Fadlan isku day erey kale."}
    />
  );
}

export function NoUpcomingState() {
  return (
    <EmptyState
      icon="calendar"
      title="Ma jiraan ciyaaro soo socda"
      description="Jadwalka ciyaaraha weli lama sii dayn. Ku soo laabo mar kale."
    />
  );
}
