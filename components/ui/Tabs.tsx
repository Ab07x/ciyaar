"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
    disabled?: boolean;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    variant?: "default" | "pills" | "underline";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    className?: string;
}

export function Tabs({
    tabs,
    activeTab,
    onChange,
    variant = "default",
    size = "md",
    fullWidth = false,
    className,
}: TabsProps) {
    const sizeClasses = {
        sm: "text-xs px-3 py-1.5",
        md: "text-sm px-4 py-2",
        lg: "text-base px-5 py-3",
    };

    const variantClasses = {
        default: {
            container: "bg-stadium-elevated p-1 rounded-xl border border-border-subtle",
            tab: "rounded-lg",
            active: "bg-accent-green text-black",
            inactive: "text-text-muted hover:text-white hover:bg-white/5",
        },
        pills: {
            container: "gap-2",
            tab: "rounded-full",
            active: "bg-accent-green text-black",
            inactive: "text-text-muted hover:text-white bg-stadium-elevated hover:bg-stadium-hover border border-border-subtle",
        },
        underline: {
            container: "border-b border-border-subtle gap-1",
            tab: "rounded-none border-b-2 -mb-px",
            active: "text-accent-green border-accent-green",
            inactive: "text-text-muted border-transparent hover:text-white hover:border-text-muted",
        },
    };

    const styles = variantClasses[variant];

    return (
        <div
            className={cn(
                "flex",
                styles.container,
                fullWidth && "w-full",
                className
            )}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && onChange(tab.id)}
                        disabled={tab.disabled}
                        className={cn(
                            "relative font-semibold transition-all duration-200 flex items-center gap-2",
                            sizeClasses[size],
                            styles.tab,
                            isActive ? styles.active : styles.inactive,
                            fullWidth && "flex-1 justify-center",
                            tab.disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {variant === "default" && isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-accent-green rounded-lg"
                                transition={{ type: "spring", duration: 0.4 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span
                                    className={cn(
                                        "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                                        isActive
                                            ? "bg-black/20 text-white"
                                            : "bg-accent-red text-white"
                                    )}
                                >
                                    {tab.badge}
                                </span>
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

// Tab Panel component
interface TabPanelProps {
    children: React.ReactNode;
    tabId: string;
    activeTab: string;
    className?: string;
}

export function TabPanel({ children, tabId, activeTab, className }: TabPanelProps) {
    if (tabId !== activeTab) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
