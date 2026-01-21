"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, Heart, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUser } from "@/providers/UserProvider";

interface MyListButtonProps {
    contentType: "movie" | "series" | "match";
    contentId: string;
    className?: string;
    variant?: "icon" | "full";
}

export function MyListButton({ contentType, contentId, className, variant = "full" }: MyListButtonProps) {
    const { userId } = useUser();
    const isListed = useQuery(api.mylist.checkStatus, userId ? { userId, contentType, contentId } : "skip");
    const toggle = useMutation(api.mylist.toggle);

    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userId) return; // Should prompt login?

        setIsLoading(true);
        try {
            await toggle({ userId, contentType, contentId });
        } catch (error) {
            console.error("Failed to toggle list", error);
        } finally {
            setIsLoading(false);
        }
    };

    // If loading initial state
    if (isListed === undefined) {
        if (variant === "icon") return <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />;
        return <div className="h-12 w-32 bg-white/10 rounded-xl animate-pulse" />;
    }

    if (variant === "icon") {
        return (
            <button
                onClick={handleToggle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={isLoading}
                className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border",
                    isListed
                        ? "bg-accent-green text-black border-accent-green hover:bg-red-500 hover:text-white hover:border-red-500"
                        : "bg-black/40 text-white border-white/20 hover:bg-white/20",
                    className
                )}
                title={isListed ? "Remove from My List" : "Add to My List"}
            >
                {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : isListed && isHovered ? (
                    <Plus size={18} className="rotate-45" /> // X icon via rotation
                ) : isListed ? (
                    <Check size={18} />
                ) : (
                    <Plus size={18} />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isLoading}
            className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95",
                isListed
                    ? "bg-stadium-elevated text-accent-green border border-accent-green/30 hover:border-red-500/50 hover:text-red-500"
                    : "bg-white/10 text-white hover:bg-white/20 hover:border-white/30 border border-transparent",
                className
            )}
        >
            {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
            ) : isListed && isHovered ? (
                <>
                    <Plus size={20} className="rotate-45" />
                    <span>Remove</span>
                </>
            ) : isListed ? (
                <>
                    <Check size={20} />
                    <span>My List</span>
                </>
            ) : (
                <>
                    <Plus size={20} />
                    <span>My List</span>
                </>
            )}
        </button>
    );
}
