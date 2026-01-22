"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    variant?: "circle" | "rounded" | "square";
    status?: "online" | "offline" | "away" | "busy";
    badge?: React.ReactNode;
    className?: string;
}

const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
};

const variantClasses = {
    circle: "rounded-full",
    rounded: "rounded-xl",
    square: "rounded-lg",
};

const statusColors = {
    online: "bg-accent-green",
    offline: "bg-text-muted",
    away: "bg-accent-gold",
    busy: "bg-accent-red",
};

// Generate initials from name
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Generate consistent color from name
function getColorFromName(name: string): string {
    const colors = [
        "from-accent-green to-accent-blue",
        "from-accent-blue to-accent-red",
        "from-accent-red to-accent-gold",
        "from-accent-gold to-accent-green",
        "from-purple-500 to-pink-500",
        "from-cyan-500 to-blue-500",
        "from-orange-500 to-red-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
    src,
    alt,
    name,
    size = "md",
    variant = "circle",
    status,
    badge,
    className,
}: AvatarProps) {
    const [imageError, setImageError] = React.useState(false);
    const showFallback = !src || imageError;

    return (
        <div className={cn("relative inline-flex shrink-0", className)}>
            <motion.div
                whileHover={{ scale: 1.05 }}
                className={cn(
                    "flex items-center justify-center overflow-hidden bg-stadium-elevated border border-border-subtle",
                    sizeClasses[size],
                    variantClasses[variant]
                )}
            >
                {showFallback ? (
                    name ? (
                        <div
                            className={cn(
                                "w-full h-full flex items-center justify-center font-bold text-white bg-gradient-to-br",
                                getColorFromName(name)
                            )}
                        >
                            {getInitials(name)}
                        </div>
                    ) : (
                        <User className="w-1/2 h-1/2 text-text-muted" />
                    )
                ) : (
                    <img
                        src={src!}
                        alt={alt || name || "Avatar"}
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover"
                    />
                )}
            </motion.div>

            {/* Status indicator */}
            {status && (
                <span
                    className={cn(
                        "absolute bottom-0 right-0 block rounded-full ring-2 ring-stadium-dark",
                        statusColors[status],
                        size === "xs" || size === "sm" ? "w-2 h-2" : "w-3 h-3"
                    )}
                />
            )}

            {/* Badge */}
            {badge && (
                <span className="absolute -top-1 -right-1">{badge}</span>
            )}
        </div>
    );
}

// Avatar Group component
interface AvatarGroupProps {
    children: React.ReactNode;
    max?: number;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
}

export function AvatarGroup({
    children,
    max = 4,
    size = "md",
    className,
}: AvatarGroupProps) {
    const avatars = React.Children.toArray(children);
    const visibleAvatars = avatars.slice(0, max);
    const remainingCount = avatars.length - max;

    return (
        <div className={cn("flex -space-x-2", className)}>
            {visibleAvatars.map((avatar, index) => (
                <div key={index} className="ring-2 ring-stadium-dark rounded-full">
                    {avatar}
                </div>
            ))}
            {remainingCount > 0 && (
                <div
                    className={cn(
                        "flex items-center justify-center bg-stadium-elevated border border-border-subtle rounded-full font-bold text-text-primary ring-2 ring-stadium-dark",
                        sizeClasses[size]
                    )}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
}
