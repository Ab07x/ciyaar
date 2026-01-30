"use client";

import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface MatchTimerProps {
  status: "live" | "upcoming" | "finished";
  minute?: number;
  addedTime?: number;
  kickoffTime?: string;
  className?: string;
}

export function MatchTimer({
  status,
  minute,
  addedTime,
  kickoffTime,
  className
}: MatchTimerProps) {
  if (status === "live") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
          "bg-red-500/20 text-red-400 font-bold text-sm",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span>
          {minute ? `${minute}'` : "LIVE"}
          {addedTime && addedTime > 0 && (
            <span className="text-red-300"> +{addedTime}</span>
          )}
        </span>
      </div>
    );
  }

  if (status === "upcoming" && kickoffTime) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
          "bg-green-500/20 text-green-400 font-medium text-sm",
          className
        )}
      >
        <Clock size={14} />
        <span>{kickoffTime}</span>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
          "bg-white/10 text-white/60 font-medium text-sm",
          className
        )}
      >
        <span>FT</span>
      </div>
    );
  }

  return null;
}
