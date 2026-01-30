"use client";

import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewerCountProps {
  count: number;
  className?: string;
  showIcon?: boolean;
}

function formatCount(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function ViewerCount({
  count,
  className,
  showIcon = true
}: ViewerCountProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-white/70 text-xs font-medium",
        className
      )}
    >
      {showIcon && <Eye size={12} className="opacity-70" />}
      <span>{formatCount(count)}</span>
    </div>
  );
}
