"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
    variant?: "full" | "icon" | "wordmark";
    size?: "sm" | "md" | "lg" | "xl";
    animated?: boolean;
    className?: string;
    href?: string;
}

const sizeClasses = {
    sm: { full: "h-6", icon: "w-6 h-6", wordmark: "text-lg" },
    md: { full: "h-8", icon: "w-8 h-8", wordmark: "text-xl" },
    lg: { full: "h-10", icon: "w-10 h-10", wordmark: "text-2xl" },
    xl: { full: "h-12", icon: "w-12 h-12", wordmark: "text-3xl" },
};

export function Logo({
    variant = "full",
    size = "md",
    animated = true,
    className,
    href = "/",
}: LogoProps) {
    const content = (
        <motion.div
            whileHover={animated ? { scale: 1.02 } : undefined}
            whileTap={animated ? { scale: 0.98 } : undefined}
            className={cn("flex items-center gap-2", className)}
        >
            {(variant === "full" || variant === "icon") && (
                <LogoIcon className={sizeClasses[size].icon} animated={animated} />
            )}
            {(variant === "full" || variant === "wordmark") && (
                <LogoWordmark className={sizeClasses[size].wordmark} />
            )}
        </motion.div>
    );

    if (href) {
        return (
            <Link href={href} className="focus:outline-none">
                {content}
            </Link>
        );
    }

    return content;
}

// Logo Icon - Stadium/Sports themed
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

// Logo Wordmark
function LogoWordmark({ className }: { className?: string }) {
    return (
        <span className={cn("font-black tracking-tighter", className)}>
            <span className="text-white">FAN</span>
            <span className="text-accent-green">BROJ</span>
        </span>
    );
}

// Alternate Logo for Ciyaar branding
export function CiyaarLogo({
    size = "md",
    animated = true,
    className,
    href = "/",
}: Omit<LogoProps, "variant">) {
    const content = (
        <motion.div
            whileHover={animated ? { scale: 1.02 } : undefined}
            whileTap={animated ? { scale: 0.98 } : undefined}
            className={cn("flex items-center gap-2", className)}
        >
            <CiyaarIcon className={sizeClasses[size].icon} animated={animated} />
            <span className={cn("font-black tracking-tighter", sizeClasses[size].wordmark)}>
                <span className="text-white">CIYAAR</span>
            </span>
        </motion.div>
    );

    if (href) {
        return (
            <Link href={href} className="focus:outline-none">
                {content}
            </Link>
        );
    }

    return content;
}

// Ciyaar Icon - Soccer ball themed
function CiyaarIcon({ className, animated }: { className?: string; animated?: boolean }) {
    return (
        <motion.svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            animate={animated ? { rotate: [0, 360] } : undefined}
            transition={animated ? { duration: 20, repeat: Infinity, ease: "linear" } : undefined}
        >
            {/* Ball circle */}
            <circle
                cx="20"
                cy="20"
                r="18"
                className="fill-white stroke-text-muted"
                strokeWidth="1"
            />

            {/* Pentagon pattern */}
            <path
                d="M20 8L26 14L24 22L16 22L14 14L20 8Z"
                className="fill-stadium-dark"
            />

            {/* Side pentagons */}
            <path
                d="M8 18L14 14L16 22L12 28L6 24L8 18Z"
                className="fill-stadium-dark"
            />
            <path
                d="M32 18L34 24L28 28L24 22L26 14L32 18Z"
                className="fill-stadium-dark"
            />
            <path
                d="M16 22L24 22L26 30L20 34L14 30L16 22Z"
                className="fill-stadium-dark"
            />
        </motion.svg>
    );
}
