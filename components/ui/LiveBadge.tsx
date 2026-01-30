"use client";

import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  text?: string;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LiveBadge({
  text = "LIVE",
  pulse = true,
  size = "md",
  className
}: LiveBadgeProps) {
  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2"
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-black uppercase tracking-wider rounded-md",
        "bg-gradient-to-r from-red-600 to-red-500 text-white",
        "shadow-lg shadow-red-500/30",
        pulse && "animate-pulse-live",
        sizeStyles[size],
        className
      )}
    >
      <span className="relative flex">
        <span
          className={cn(
            "absolute inline-flex rounded-full bg-white opacity-75",
            pulse && "animate-ping",
            dotSizes[size]
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full bg-white",
            dotSizes[size]
          )}
        />
      </span>
      <span>{text}</span>
    </div>
  );
}
