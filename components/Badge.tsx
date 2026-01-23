import { cn } from "@/lib/utils";
import { Crown, Clock, CheckCircle } from "lucide-react";

type BadgeVariant = "live" | "premium" | "upcoming" | "finished" | "danger" | "success" | "warning";

interface BadgeProps {
    variant: BadgeVariant;
    children?: React.ReactNode;
    className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
    if (variant === "live") {
        return (
            <span
                className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md bg-accent-red text-white badge-live",
                    className
                )}
            >
                <span className="live-dot" />
                {children || "LIVE HADDA"}
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
                {children || "PREMIUM"}
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
                {children || "SOO SOCDA"}
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
                {children || "DHAMAATAY"}
            </span>
        );
    }

    if (variant === "danger") {
        return (
            <span className={cn("inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-red-500/20 text-red-500", className)}>
                {children}
            </span>
        );
    }

    if (variant === "success") {
        return (
            <span className={cn("inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-accent-green/20 text-accent-green", className)}>
                {children}
            </span>
        );
    }

    if (variant === "warning") {
        return (
            <span className={cn("inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-accent-gold/20 text-accent-gold", className)}>
                {children}
            </span>
        );
    }

    return null;
}
