"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Search, Heart, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUser } from "@/providers/UserProvider";

export function BottomNav() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // user provider might be needed later for avatar in future

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
            label: "Search",
            href: "/search", // Or maybe toggle search overlay? For now link to /search page if I create one, or just /
            // Given I haven't created /search page, and SearchBox is in Navbar.
            // A dedicated search page is good for mobile. 
            // I'll point to /search and I should probably create that page or make this button focus the navbar search.
            // Let's make it a link to /search for now and I'll create a simple search page.
            icon: Search,
        },
        {
            label: "My List",
            href: "/mylist",
            icon: Heart,
        },
        {
            label: "Menu",
            href: "#menu", // This usually opens a drawer. For now, let's just link to /settings or trigger sidebar
            // Since I don't have a sidebar component ready to toggle globally, I'll link to /more or just display a placeholder.
            // Or I can make it toggle the existing mobile menu in Navbar? No, that's internal to Navbar.
            // I will leave it as a link to /more or similar for now.
            icon: Menu,
        }
    ];

    // Simple implementation for now.
    // For Search, since I don't have a /search page, I'll redirect to /ciyaar (or create /search).
    // Actually, I'll create a simple /search page for mobile that contains just the search box.

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            <div className="absolute inset-0 bg-stadium-dark/90 backdrop-blur-lg border-t border-white/10" />
            <div className="relative flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform",
                                active ? "text-accent-green" : "text-text-muted hover:text-white"
                            )}
                        >
                            <Icon
                                size={active ? 24 : 22}
                                className={cn("transition-all", active && "filter drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]")}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
