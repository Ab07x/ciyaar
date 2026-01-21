"use client";

import Link from "next/link";
import { SearchBox } from "./SearchBox";
import { useState } from "react";
import { Menu, X, Search, User, Trophy, Radio, Film, Tv, Newspaper, Crown } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { href: "/ciyaar", label: "Ciyaaro", icon: Trophy, color: "text-accent-green" },
        { href: "/live", label: "Live", icon: Radio, color: "text-accent-red", hasLiveDot: true },
        { href: "/movies", label: "Filimo", icon: Film, color: "text-accent-blue" },
        { href: "/series", label: "Musalsal", icon: Tv, color: "text-white" },
        { href: "/blog", label: "Warar", icon: Newspaper, color: "text-text-secondary" },
    ];

    return (
        <header className="bg-stadium-dark border-b border-border-subtle sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-primary hover:bg-stadium-hover rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Logo */}
                <Link href="/" className="text-2xl font-black tracking-tighter text-white">
                    FAN<span className="text-accent-green">BROJ</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all hover:opacity-80 rounded-lg",
                                    item.color,
                                    isActive && "bg-white/5"
                                )}
                            >
                                <span className="relative">
                                    <Icon size={18} />
                                    {item.hasLiveDot && (
                                        <span className="absolute -top-0.5 -right-0.5 live-dot" />
                                    )}
                                </span>
                                <span className="hidden lg:inline">{item.label}</span>
                            </Link>
                        );
                    })}
                    <Link
                        href="/pricing"
                        className="bg-accent-gold text-black px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2"
                    >
                        <Crown size={16} />
                        <span className="hidden lg:inline">PREMIUM</span>
                    </Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* Desktop Search */}
                    <div className="hidden md:block w-56 lg:w-64">
                        <SearchBox />
                    </div>

                    {/* Mobile Search Toggle */}
                    <button
                        className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-primary hover:bg-stadium-hover rounded-lg transition-colors"
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        aria-label="Toggle search"
                    >
                        <Search size={22} />
                    </button>

                    {/* Account Icon */}
                    <Link
                        href="/login"
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-primary hover:bg-stadium-hover rounded-lg transition-colors hidden md:flex"
                        aria-label="Account"
                    >
                        <User size={22} />
                    </Link>
                </div>
            </div>

            {/* Mobile Search Bar */}
            {mobileSearchOpen && (
                <div className="md:hidden p-4 bg-stadium-elevated border-b border-border-subtle animate-in slide-in-from-top-2">
                    <SearchBox />
                </div>
            )}

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-16 bg-stadium-dark z-40 p-4 border-t border-border-subtle animate-in slide-in-from-left-10 overflow-y-auto">
                    <nav className="flex flex-col space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "p-4 min-h-[48px] rounded-xl text-lg font-bold flex items-center gap-4 transition-colors",
                                        item.color,
                                        isActive ? "bg-white/10" : "hover:bg-stadium-elevated"
                                    )}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="relative">
                                        <Icon size={24} />
                                        {item.hasLiveDot && (
                                            <span className="absolute -top-0.5 -right-0.5 live-dot" />
                                        )}
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}
                        <Link
                            href="/pricing"
                            className="p-4 min-h-[48px] rounded-xl text-lg font-bold bg-accent-gold text-black flex items-center gap-4 hover:brightness-110 mt-4 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Crown size={24} />
                            PREMIUM
                        </Link>

                        {/* Mobile Account Link */}
                        <Link
                            href="/login"
                            className="p-4 min-h-[48px] rounded-xl text-lg font-bold flex items-center gap-4 text-text-secondary hover:bg-stadium-elevated transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <User size={24} />
                            Akoon
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
