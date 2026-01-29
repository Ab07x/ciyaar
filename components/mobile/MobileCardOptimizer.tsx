"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TouchFeedback } from "./TouchFeedback";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface MobileCardOptimizerProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    enableHaptic?: boolean;
    enableScale?: boolean;
    href?: string;
}

/**
 * Wraps cards with mobile-optimized touch feedback and interactions
 */
export function MobileCardOptimizer({
    children,
    className,
    onClick,
    enableHaptic = true,
    enableScale = true,
    href
}: MobileCardOptimizerProps) {
    const { isMobile } = useMobileDetection();

    if (!isMobile) {
        // Desktop: use normal hover states
        if (href) {
            return (
                <a href={href} className={cn("block", className)}>
                    {children}
                </a>
            );
        }
        return (
            <div onClick={onClick} className={className}>
                {children}
            </div>
        );
    }

    // Mobile: use touch feedback
    const content = (
        <TouchFeedback
            className={className}
            onTap={onClick}
            haptic={enableHaptic}
            scale={enableScale}
        >
            {children}
        </TouchFeedback>
    );

    if (href) {
        return (
            <a href={href} className="block">
                {content}
            </a>
        );
    }

    return content;
}
