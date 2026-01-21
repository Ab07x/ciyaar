import { cn } from "@/lib/utils";
import { Crown, Clock, CheckCircle } from "lucide-react";

type BadgeVariant = "live" | "premium" | "upcoming" | "finished";

interface BadgeProps {
    variant: BadgeVariant;
    className?: string;
}

export function Badge({ variant, className }: BadgeProps) {
    if (variant === "live") {
        return (
            <span
                className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md bg-accent-red text-white badge-live",
                    className
                )}
            >
                <span className="live-dot" />
                LIVE HADDA
            </span>
        );
    }

    if (variant === "premium") {
        return (
            <span
                className={cn(
                    "badge-premium",
                    className
                )}
            >
                <Crown size={10} />
                PREMIUM
            </span>
        );
    }

    if (variant === "upcoming") {
        return (
            <span
                className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md bg-accent-green/20 text-accent-green",
                    className
                )}
            >
                <Clock size={12} />
                SOO SOCDA
            </span>
        );
    }

    if (variant === "finished") {
        return (
            <span
                className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md bg-stadium-hover text-text-muted",
                    className
                )}
            >
                <CheckCircle size={12} />
                DHAMAATAY
            </span>
        );
    }

    return null;
}
