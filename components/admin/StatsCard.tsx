"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    color?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    description?: string;
    index?: number;
}

export function StatsCard({
    label,
    value,
    icon: Icon,
    color = "text-accent-green",
    trend,
    description,
    index = 0,
}: StatsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="relative bg-stadium-elevated border border-border-strong p-5 rounded-xl overflow-hidden group"
        >
            {/* Background glow on hover */}
            <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.1 }}
                className={cn(
                    "absolute inset-0 bg-gradient-to-br from-current to-transparent",
                    color
                )}
            />

            {/* Icon */}
            <div
                className={cn(
                    "p-2.5 rounded-xl bg-stadium-hover inline-block mb-3",
                    color
                )}
            >
                <Icon size={22} />
            </div>

            {/* Value */}
            <div className="text-3xl font-black text-white mb-1">
                {typeof value === "number" ? value.toLocaleString() : value}
            </div>

            {/* Label */}
            <div className="text-xs text-text-muted uppercase tracking-wide font-semibold">
                {label}
            </div>

            {/* Trend indicator */}
            {trend && (
                <div
                    className={cn(
                        "absolute top-4 right-4 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                        trend.isPositive
                            ? "bg-accent-green/20 text-accent-green"
                            : "bg-accent-red/20 text-accent-red"
                    )}
                >
                    {trend.isPositive ? (
                        <TrendingUp size={14} />
                    ) : (
                        <TrendingDown size={14} />
                    )}
                    {Math.abs(trend.value)}%
                </div>
            )}

            {/* Description */}
            {description && (
                <p className="text-xs text-text-secondary mt-2">{description}</p>
            )}
        </motion.div>
    );
}
