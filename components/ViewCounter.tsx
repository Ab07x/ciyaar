"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBoostedViews, formatViews } from "@/lib/analytics";

interface ViewCounterProps {
    id: string; // The ID of the match or post
    collection: "matches" | "posts";
    initialViews?: number;
    className?: string;
    showIcon?: boolean;
}

export function ViewCounter({
    id,
    collection,
    initialViews = 0,
    className,
    showIcon = true,
}: ViewCounterProps) {
    const increment = useMutation(api.analytics.increment);
    const [views, setViews] = useState(initialViews);
    const [hasIncremented, setHasIncremented] = useState(false);

    useEffect(() => {
        if (!hasIncremented && id) {
            // Prevent double counting in Strict Mode or re-renders
            setHasIncremented(true);
            increment({ id, collection })
                .then(() => {
                    // Optimistic update or just increment local state
                    setViews((v) => v + 1);
                })
                .catch((err) => {
                    console.error("Failed to increment views:", err);
                });
        }
    }, [id, collection, increment, hasIncremented]);

    if (views === 0) return null;

    const boostedViews = getBoostedViews(id, views);

    return (
        <div className={cn("flex items-center gap-1.5 text-text-muted text-xs", className)}>
            {showIcon && <Eye size={14} />}
            <span className="font-medium">
                {formatViews(boostedViews)}
            </span>
        </div>
    );
}
