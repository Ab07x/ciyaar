"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    text?: string;
}

export function LoadingSpinner({
    size = "md",
    className,
    text
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-10 w-10",
        lg: "h-14 w-14",
        xl: "h-20 w-20",
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            {/* Animated Logo Spinner */}
            <div className="relative">
                {/* Outer glow ring */}
                <div className={cn(
                    "absolute inset-0 rounded-full animate-ping opacity-30",
                    "bg-gradient-to-r from-[#E50914] to-[#9AE600]",
                    sizeClasses[size]
                )} />

                {/* Main spinner */}
                <div className={cn(
                    "relative rounded-full",
                    "border-2 border-transparent",
                    "animate-spin",
                    sizeClasses[size]
                )}
                    style={{
                        borderTopColor: "#E50914",
                        borderRightColor: "#9AE600",
                        animationDuration: "0.8s"
                    }}
                />

                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                </div>
            </div>

            {text && (
                <p className="text-sm text-white/60 animate-pulse">{text}</p>
            )}
        </div>
    );
}

// Full page loading
export function PageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1b2a]">
            <LoadingSpinner size="xl" text={text} />
        </div>
    );
}

// Inline loader for sections
export function SectionLoader({
    className,
    minHeight = "400px"
}: {
    className?: string;
    minHeight?: string;
}) {
    return (
        <div
            className={cn(
                "flex items-center justify-center bg-[#0d1b2a]",
                className
            )}
            style={{ minHeight }}
        >
            <LoadingSpinner size="lg" />
        </div>
    );
}
