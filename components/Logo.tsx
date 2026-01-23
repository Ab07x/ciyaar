"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

interface LogoProps {
    variant?: "full" | "icon" | "wordmark";
    size?: "sm" | "md" | "lg" | "xl";
    animated?: boolean;
    className?: string;
    href?: string;
}

const sizeClasses = {
    sm: { full: "h-6", icon: "w-6 h-6", wordmark: "text-lg", img: 24 },
    md: { full: "h-8", icon: "w-8 h-8", wordmark: "text-xl", img: 32 },
    lg: { full: "h-10", icon: "w-10 h-10", wordmark: "text-2xl", img: 40 },
    xl: { full: "h-12", icon: "w-12 h-12", wordmark: "text-3xl", img: 48 },
};

export function Logo({
    variant = "full",
    size = "md",
    animated = true,
    className,
    href = "/",
}: LogoProps) {
    const settingsData = useQuery(api.settings.getSettings);
    // Safe cast to access new fields
    const settings = settingsData as any;

    const logoContent = (
        <motion.div
            whileHover={animated ? { scale: 1.02 } : undefined}
            whileTap={animated ? { scale: 0.98 } : undefined}
            className={cn("flex items-center gap-2", className)}
        >
            {(variant === "full" || variant === "icon") && (
                <>
                    {settings?.logoUrl ? (
                        <div className={cn("relative rounded overflow-hidden aspect-square", sizeClasses[size].icon)}>
                            <Image
                                src={settings.logoUrl}
                                alt={settings.siteName || "Fanbroj"}
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <LogoIcon className={sizeClasses[size].icon} animated={animated} />
                    )}
                </>
            )}

            {(variant === "full" || variant === "wordmark") && (
                <LogoWordmark
                    className={sizeClasses[size].wordmark}
                    siteName={settings?.siteName}
                />
            )}
        </motion.div>
    );

    if (href) {
        return (
            <Link href={href} className="focus:outline-none">
                {logoContent}
            </Link>
        );
    }

    return logoContent;
}

// Logo Wordmark
function LogoWordmark({ className, siteName }: { className?: string, siteName?: string }) {
    if (siteName && siteName !== "Fanbroj") {
        return (
            <span className={cn("font-black tracking-tighter text-white", className)}>
                {siteName}
            </span>
        );
    }

    // Default Fanbroj
    return (
        <span className={cn("font-black tracking-tighter", className)}>
            <span className="text-white">FAN</span>
            <span className="text-accent-green">BROJ</span>
        </span>
    );
}

// Logo Icon - Stadium/Sports themed (Fallback)
function LogoIcon({ className, animated }: { className?: string; animated?: boolean }) {
    return (
        <motion.svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            initial={animated ? { rotate: 0 } : undefined}
            whileHover={animated ? { rotate: 5 } : undefined}
        >
            {/* Stadium base shape */}
            <rect
                x="2"
                y="8"
                width="36"
                height="24"
                rx="4"
                className="fill-stadium-elevated stroke-accent-green"
                strokeWidth="2"
            />

            {/* Stadium field */}
            <rect
                x="6"
                y="12"
                width="28"
                height="16"
                rx="2"
                className="fill-accent-green/20"
            />

            {/* Center circle */}
            <circle
                cx="20"
                cy="20"
                r="4"
                className="stroke-accent-green/50"
                strokeWidth="1.5"
                fill="none"
            />

            {/* Center line */}
            <line
                x1="20"
                y1="12"
                x2="20"
                y2="28"
                className="stroke-accent-green/50"
                strokeWidth="1.5"
            />

            {/* Stadium lights - left */}
            <motion.circle
                cx="8"
                cy="6"
                r="2"
                className="fill-accent-gold"
                animate={animated ? { opacity: [1, 0.5, 1] } : undefined}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Stadium lights - right */}
            <motion.circle
                cx="32"
                cy="6"
                r="2"
                className="fill-accent-gold"
                animate={animated ? { opacity: [0.5, 1, 0.5] } : undefined}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Play button overlay */}
            <path
                d="M17 16L25 20L17 24V16Z"
                className="fill-accent-green"
            />
        </motion.svg>
    );
}

