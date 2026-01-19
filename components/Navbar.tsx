"use client";

import Link from "next/link";
import { SearchBox } from "./SearchBox";
import { useState } from "react";
import { Menu, X, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { href: "/ciyaar", label: "Ciyaaro", color: "text-accent-green" },
        { href: "/movies", label: "Filimo", color: "text-accent-blue" },
        { href: "/series", label: "Musalsal", color: "text-white" },
        { href: "/live", label: "Live", color: "text-accent-red" },
    ];

    return (
        <header className="bg-stadium-dark border-b border-border-subtle sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-text-primary hover:bg-stadium-hover rounded-lg"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Logo */}
                <Link href="/" className="text-2xl font-black tracking-tighter text-white">
                    FAN<span className="text-accent-green">BROJ</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-bold uppercase tracking-wide transition-colors hover:opacity-80",
                                item.color,
                                pathname.startsWith(item.href) && "opacity-100 border-b-2 border-current pb-1"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link
                        href="/pricing"
                        className="bg-accent-gold text-black px-4 py-1.5 rounded-lg font-bold text-sm hover:scale-105 transition-transform flex items-center gap-1"
                    >
                        <span className="text-xs">⭐</span> PREMIUM
                    </Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* Desktop Search */}
                    <div className="hidden md:block w-64">
                        <SearchBox />
                    </div>

                    {/* Mobile Search Toggle */}
                    <button
                        className="md:hidden p-2 text-text-primary hover:bg-stadium-hover rounded-lg"
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                    >
                        <Search size={22} />
                    </button>

                    {/* Account Icon (Placeholder for now) */}
                    <Link href="/login" className="p-2 text-text-primary hover:bg-stadium-hover rounded-lg hidden md:block">
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
                <div className="md:hidden fixed inset-0 top-16 bg-stadium-dark z-40 p-4 border-t border-border-subtle animate-in slide-in-from-left-10">
                    <nav className="flex flex-col space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "p-4 rounded-xl text-lg font-bold flex items-center justify-between hover:bg-stadium-elevated transition-colors",
                                    item.color
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href="/pricing"
                            className="p-4 rounded-xl text-lg font-bold bg-accent-gold text-black flex items-center justify-between hover:opacity-90 mt-4"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            PREMIUM ⭐
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
