"use client";

import useSWR, { mutate } from "swr";
import { Check, Loader2, Plus, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/providers/ToastProvider";
import { useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { PremiumPopupBanner } from "@/components/PremiumPopupBanner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MyListButtonProps {
    contentType: "movie" | "series" | "match";
    contentId: string;
    listType?: "mylist" | "favourites" | "watch_later";
    className?: string;
    variant?: "icon" | "full";
}

export function MyListButton({
    contentType,
    contentId,
    listType = "mylist",
    className,
    variant = "full",
}: MyListButtonProps) {
    const { userId, isPremium } = useUser();
    const swrKey = userId
        ? `/api/mylist?action=check&userId=${userId}&contentType=${contentType}&contentId=${contentId}&listType=${listType}`
        : null;
    const { data: listData } = useSWR(swrKey, fetcher);
    const isListed = listData?.isListed ?? false;

    // Custom toast
    const toast = useToast();

    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPremiumPopup, setShowPremiumPopup] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userId) {
            toast("Please login to use My List", "error");
            return;
        }

        // Lock My List for non-premium users
        if (!isPremium) {
            setShowPremiumPopup(true);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/mylist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, contentType, contentId, listType }),
            });
            const result = await res.json();
            if (result.action === "added") {
                toast("Added to My List", "success");
            } else {
                toast("Removed from My List", "info");
            }
            // Revalidate the SWR cache
            if (swrKey) mutate(swrKey);
        } catch (error) {
            console.error("Failed to toggle list", error);
            toast("Failed to update list", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // If loading initial state
    if (listData === undefined && userId) {
        if (variant === "icon") return <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />;
        return <div className="h-12 w-32 bg-white/10 rounded-xl animate-pulse" />;
    }

    const content = variant === "icon" ? (
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
                !isPremium && "border-yellow-500/50",
                className
            )}
            title={!isPremium ? "Premium Feature" : isListed ? "Remove from My List" : "Add to My List"}
        >
            {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : !isPremium ? (
                <Crown size={16} className="text-yellow-400" />
            ) : isListed && isHovered ? (
                <Plus size={18} className="rotate-45" /> // X icon via rotation
            ) : isListed ? (
                <Check size={18} />
            ) : (
                <Plus size={18} />
            )}
        </button>
    ) : (
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
            ) : !isPremium ? (
                <>
                    <Crown size={18} className="text-yellow-400" />
                    <span>My List</span>
                </>
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

    return (
        <>
            {content}
            <PremiumPopupBanner
                show={showPremiumPopup}
                onClose={() => setShowPremiumPopup(false)}
            />
        </>
    );
}
