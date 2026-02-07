"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
    variant?: "full" | "icon" | "wordmark";
    size?: "sm" | "md" | "lg" | "xl";
    animated?: boolean;
    className?: string;
    href?: string;
}

const sizeConfig = {
    sm: { icon: 24, wordmark: { height: 24, width: 82 } },
    md: { icon: 32, wordmark: { height: 32, width: 110 } },
    lg: { icon: 36, wordmark: { height: 36, width: 124 } },
    xl: { icon: 48, wordmark: { height: 48, width: 165 } },
};

export function Logo({
    variant = "full",
    size = "md",
    animated = true,
    className,
    href = "/",
}: LogoProps) {
    const config = sizeConfig[size];

    const logoContent = (
        <motion.div
            whileHover={animated ? { scale: 1.02 } : undefined}
            whileTap={animated ? { scale: 0.98 } : undefined}
            className={cn("flex items-center gap-2", className)}
        >
            {(variant === "full" || variant === "icon") && (
                <Image
                    src="/img/logo/icon-fanbroj.png"
                    alt="Fanbroj"
                    width={config.icon}
                    height={config.icon}
                    className="object-contain"
                    priority
                />
            )}

            {(variant === "full" || variant === "wordmark") && (
                <Image
                    src="/img/logo/fanproj-logo.png"
                    alt="Fanbroj TV"
                    width={config.wordmark.width}
                    height={config.wordmark.height}
                    className="object-contain"
                    priority
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
