"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Trophy, Search, Heart, Menu, Zap, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const scrollThreshold = 10;

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const isScrollingDown = currentScrollY > lastScrollY;
            const scrollDelta = Math.abs(currentScrollY - lastScrollY);

            // Only trigger visibility change if scroll delta exceeds threshold
            if (scrollDelta > scrollThreshold) {
                setIsVisible(!isScrollingDown || currentScrollY < 100);
                setLastScrollY(currentScrollY);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const isActive = (path: string) => pathname === path;

    const navItems = [
        {
            label: "Home",
            href: "/",
            icon: Home,
        },
        {
            label: "Ciyaar",
            href: "/ciyaar",
            icon: Trophy,
        },
        {
            label: "Shorts",
            href: "/shorts",
            icon: Play,
            isSpecial: true,
        },
        {
            label: "My List",
            href: "/mylist",
            icon: Heart,
        },
        {
            label: "Menu",
            href: "/menu",
            icon: Menu,
        }
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
                >
                    {/* Background blur layer */}
                    <div className="absolute inset-0 bg-stadium-dark/90 backdrop-blur-xl border-t border-white/10" />

                    {/* Nav items */}
                    <div className="relative flex items-center justify-around h-16 px-2">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            // Special center button (Shorts)
                            if (item.isSpecial) {
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="relative -mt-6"
                                    >
                                        <motion.div
                                            whileTap={{ scale: 0.9 }}
                                            className={cn(
                                                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                                                active
                                                    ? "bg-accent-green text-black"
                                                    : "bg-gradient-to-br from-accent-green to-accent-blue text-white"
                                            )}
                                        >
                                            <Icon size={24} fill={active ? "currentColor" : "none"} />
                                        </motion.div>
                                        {/* Glow effect */}
                                        <div className="absolute inset-0 rounded-full bg-accent-green/30 blur-xl -z-10" />
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="relative flex flex-col items-center justify-center w-full h-full"
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1 transition-colors",
                                            active ? "text-accent-green" : "text-text-muted hover:text-white"
                                        )}
                                    >
                                        <div className="relative">
                                            <Icon
                                                size={active ? 24 : 22}
                                                className="transition-all"
                                                strokeWidth={active ? 2.5 : 2}
                                            />
                                            {/* Active glow */}
                                            {active && (
                                                <motion.div
                                                    layoutId="bottomNavGlow"
                                                    className="absolute -inset-2 bg-accent-green/20 rounded-full blur-md -z-10"
                                                    transition={{ type: "spring", duration: 0.3 }}
                                                />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wide">{item.label}</span>

                                        {/* Active indicator dot */}
                                        {active && (
                                            <motion.div
                                                layoutId="bottomNavIndicator"
                                                className="absolute -bottom-1 w-1 h-1 bg-accent-green rounded-full"
                                                transition={{ type: "spring", duration: 0.3 }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Top border gradient */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-green/30 to-transparent" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
