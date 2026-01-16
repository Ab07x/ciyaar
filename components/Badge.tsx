import { cn } from "@/lib/utils";

type BadgeVariant = "live" | "premium" | "upcoming" | "finished";

interface BadgeProps {
    variant: BadgeVariant;
    className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
    live: "bg-accent-red text-white badge-live",
    premium: "bg-accent-gold text-black",
    upcoming: "bg-blue-600 text-white",
    finished: "bg-gray-600 text-white",
};

const badgeLabels: Record<BadgeVariant, string> = {
    live: "🔴 LIVE HADA",
    premium: "⭐ PREMIUM",
    upcoming: "⏭️ SOO SOCDA",
    finished: "✅ DHAMAATAY",
};

export function Badge({ variant, className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-sm",
                badgeStyles[variant],
                className
            )}
        >
            {badgeLabels[variant]}
        </span>
    );
}
