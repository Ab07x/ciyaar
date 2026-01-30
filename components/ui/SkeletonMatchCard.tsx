"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonMatchCardProps {
  className?: string;
  variant?: "default" | "featured";
}

export function SkeletonMatchCard({ className, variant = "default" }: SkeletonMatchCardProps) {
  if (variant === "featured") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]",
          "border border-white/10",
          "p-6 md:p-8",
          className
        )}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-6 w-20 bg-white/10 rounded" />
        </div>

        {/* Teams Display */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full mb-3" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>

          {/* Score */}
          <div className="flex flex-col items-center">
            <div className="h-10 w-24 bg-white/10 rounded mb-2" />
            <div className="h-5 w-12 bg-white/10 rounded-full" />
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full mb-3" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 bg-white/10 rounded" />
          <div className="h-10 w-28 bg-white/10 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-[#1a1a1a] to-[#111111]",
        "border border-white/10",
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-5 w-12 bg-white/10 rounded" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Teams */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
          <div className="h-6 w-12 bg-white/10 rounded" />
          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="w-10 h-10 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-16 bg-white/10 rounded" />
          <div className="h-4 w-12 bg-white/10 rounded" />
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <div className="h-11 w-full bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

// Multiple skeleton cards grid
export function SkeletonMatchGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonMatchCard />
        </motion.div>
      ))}
    </div>
  );
}
