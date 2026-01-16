import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: string;
    message: string;
    hint?: string;
    className?: string;
}

export function EmptyState({
    icon = "📺",
    message,
    hint,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-4 text-center",
                className
            )}
        >
            <div className="text-6xl mb-4">{icon}</div>
            <p className="text-lg text-text-secondary mb-2">{message}</p>
            {hint && <p className="text-sm text-text-muted">{hint}</p>}
        </div>
    );
}
