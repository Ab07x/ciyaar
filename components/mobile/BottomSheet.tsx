"use client";

import { ReactNode, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    snapPoints?: number[]; // Percentage heights: [50, 90]
    defaultSnap?: number; // Index of default snap point
    closeButton?: boolean;
    className?: string;
}

/**
 * Mobile-optimized bottom sheet with:
 * - Swipe to dismiss
 * - Multiple snap points
 * - Backdrop blur
 * - iOS-style handle
 * - Safe area support
 */
export function BottomSheet({
    isOpen,
    onClose,
    children,
    title,
    snapPoints = [90],
    defaultSnap = 0,
    closeButton = true,
    className
}: BottomSheetProps) {
    const [currentSnap, setCurrentSnap] = useState(defaultSnap);
    const [isDragging, setIsDragging] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        setIsDragging(false);

        const velocity = info.velocity.y;
        const offset = info.offset.y;

        // Close if dragged down significantly
        if (offset > 100 || velocity > 500) {
            onClose();
            return;
        }

        // Snap to nearest point
        const height = window.innerHeight;
        const currentHeight = snapPoints[currentSnap];
        const draggedPercent = ((height - offset) / height) * 100;

        // Find closest snap point
        let closestSnap = 0;
        let minDiff = Math.abs(snapPoints[0] - draggedPercent);

        snapPoints.forEach((point, index) => {
            const diff = Math.abs(point - draggedPercent);
            if (diff < minDiff) {
                minDiff = diff;
                closestSnap = index;
            }
        });

        setCurrentSnap(closestSnap);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: "100%" }}
                        animate={{
                            y: `${100 - snapPoints[currentSnap]}%`,
                        }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300
                        }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            "fixed bottom-0 left-0 right-0 z-50",
                            "bg-stadium-dark rounded-t-3xl shadow-2xl",
                            "safe-bottom",
                            className
                        )}
                        style={{
                            height: '100vh',
                            touchAction: 'none'
                        }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {/* Header */}
                        {(title || closeButton) && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                                {title && <h3 className="text-lg font-bold">{title}</h3>}
                                {closeButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    >
                                        <X size={24} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto" style={{ maxHeight: `${snapPoints[currentSnap]}vh` }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
