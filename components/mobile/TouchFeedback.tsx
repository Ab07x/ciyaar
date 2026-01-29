"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TouchFeedbackProps {
    children: ReactNode;
    className?: string;
    onTap?: () => void;
    onDoubleTap?: () => void;
    onLongPress?: () => void;
    haptic?: boolean;
    scale?: boolean;
    ripple?: boolean;
}

/**
 * Enhanced touch feedback component with:
 * - Visual feedback (scale, ripple)
 * - Haptic feedback (vibration)
 * - Double-tap detection
 * - Long press detection
 * - Better mobile UX
 */
export function TouchFeedback({
    children,
    className,
    onTap,
    onDoubleTap,
    onLongPress,
    haptic = false,
    scale = true,
    ripple = false
}: TouchFeedbackProps) {
    const [isPressed, setIsPressed] = useState(false);
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const pressTimerRef = useRef<any>(null);
    const lastTapRef = useRef<number>(0);
    const elementRef = useRef<HTMLDivElement>(null);

    const triggerHaptic = () => {
        if (haptic && 'vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsPressed(true);
        triggerHaptic();

        // Ripple effect
        if (ripple && elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            const id = Date.now();
            setRipples(prev => [...prev, { x, y, id }]);

            // Remove ripple after animation
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== id));
            }, 600);
        }

        // Long press detection
        if (onLongPress) {
            pressTimerRef.current = setTimeout(() => {
                triggerHaptic();
                onLongPress();
            }, 500);
        }
    };

    const handleTouchEnd = () => {
        setIsPressed(false);

        // Clear long press timer
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
        }

        // Double-tap detection
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // Double tap
            onDoubleTap?.();
        } else {
            // Single tap
            onTap?.();
        }

        lastTapRef.current = now;
    };

    const handleTouchCancel = () => {
        setIsPressed(false);
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
        }
    };

    useEffect(() => {
        return () => {
            if (pressTimerRef.current) {
                clearTimeout(pressTimerRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={elementRef}
            className={cn(
                "relative overflow-hidden touch-manipulation",
                scale && "transition-transform active:scale-95",
                className
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            style={{
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                WebkitUserSelect: 'none'
            }}
        >
            {children}

            {/* Ripple effects */}
            {ripples.map(({ x, y, id }) => (
                <span
                    key={id}
                    className="absolute pointer-events-none"
                    style={{
                        left: x,
                        top: y,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <span
                        className="block w-0 h-0 rounded-full bg-white/30"
                        style={{
                            animation: 'ripple 0.6s ease-out'
                        }}
                    />
                </span>
            ))}

            <style jsx>{`
                @keyframes ripple {
                    to {
                        width: 200px;
                        height: 200px;
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}
