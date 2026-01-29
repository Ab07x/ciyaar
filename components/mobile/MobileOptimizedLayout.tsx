"use client";

import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MobileOptimizedLayoutProps {
    children: ReactNode;
    className?: string;
    enablePullToRefresh?: boolean;
}

export function MobileOptimizedLayout({
    children,
    className,
    enablePullToRefresh = false
}: MobileOptimizedLayoutProps) {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    useEffect(() => {
        if (!enablePullToRefresh) return;

        let startY = 0;
        let currentY = 0;
        let isAtTop = false;

        const handleTouchStart = (e: TouchEvent) => {
            isAtTop = window.scrollY === 0;
            startY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isAtTop) return;

            currentY = e.touches[0].clientY;
            const distance = currentY - startY;

            if (distance > 0) {
                setPullDistance(Math.min(distance, 150));
                setIsPulling(distance > 80);
            }
        };

        const handleTouchEnd = () => {
            if (isPulling) {
                window.location.reload();
            }
            setPullDistance(0);
            setIsPulling(false);
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enablePullToRefresh, isPulling]);

    return (
        <div className={cn("mobile-optimized-layout", className)}>
            {/* Pull to refresh indicator */}
            {enablePullToRefresh && pullDistance > 0 && (
                <div
                    className="fixed top-0 left-0 right-0 flex items-center justify-center z-50 transition-all"
                    style={{
                        transform: `translateY(${Math.min(pullDistance - 50, 0)}px)`,
                        opacity: pullDistance / 80
                    }}
                >
                    <div className="bg-black/80 backdrop-blur-lg rounded-full p-3 text-white">
                        {isPulling ? '↻ Release to refresh' : '↓ Pull to refresh'}
                    </div>
                </div>
            )}

            {children}

            <style jsx global>{`
                /* Prevent overscroll bounce on iOS */
                body {
                    overscroll-behavior-y: contain;
                }

                /* Smooth scrolling */
                html {
                    scroll-behavior: smooth;
                }

                /* Optimize for mobile */
                @media (max-width: 768px) {
                    * {
                        -webkit-tap-highlight-color: transparent;
                        -webkit-touch-callout: none;
                    }

                    /* Better touch scrolling */
                    .mobile-optimized-layout {
                        -webkit-overflow-scrolling: touch;
                    }

                    /* Prevent text selection on buttons */
                    button {
                        -webkit-user-select: none;
                        user-select: none;
                    }

                    /* Improve input focus */
                    input, textarea {
                        font-size: 16px !important; /* Prevents zoom on iOS */
                    }
                }
            `}</style>
        </div>
    );
}
