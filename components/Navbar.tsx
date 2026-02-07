"use client";

import Link from "next/link";
import { SearchBox } from "./SearchBox";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, User, Trophy, Radio, Film, Tv, Newspaper, Crown, CreditCard, List, Zap, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserProvider";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/providers/LanguageProvider";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const { isPremium, isLoading } = useUser();
    const { t } = useLanguage();

    // Handle scroll for glassmorphism effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
    }, [pathname]);

    const navItems = [
        { href: "/ciyaar", label: t("nav.matches"), icon: Trophy, color: "text-[#9AE600]" },
        { href: "/movies", label: t("nav.movies"), icon: Film, color: "text-[#E50914]" },
        { href: "/series", label: t("nav.series"), icon: Tv, color: "text-[#DC2626]" },
        { href: "/requests", label: "Codso", icon: MessageSquare, color: "text-[#3B82F6]" },
        { href: "/mylist", label: t("nav.profile"), icon: List, color: "text-[#E50914]" },
    ];

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "sticky top-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-[#020D18]/98 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
                    : "bg-[#0a192f] border-b border-white/5"
            )}
        >
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Mobile Menu Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <AnimatePresence mode="wait">
                        {mobileMenuOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <X size={24} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Menu size={24} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Logo */}
                <Logo variant="wordmark" size="lg" href="/" />

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-2 px-3 py-2 text-sm font-semibold tracking-wide transition-all rounded-lg group",
                                    isActive ? "text-[#E50914] bg-red-500/10" : "text-white/80 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <span className="relative">
                                    <Icon size={18} />
                                </span>
                                <span className="hidden lg:inline">{item.label}</span>

                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="navIndicator"
                                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#E50914] rounded-full"
                                        transition={{ type: "spring", duration: 0.3 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                    {!isPremium && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                href="/pricing"
                                className="ml-2 bg-gradient-to-r from-[#E50914] to-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                <Crown size={16} />
                                <span className="hidden lg:inline">PREMIUM</span>
                            </Link>
                        </motion.div>
                    )}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* Desktop Search */}
                    <div className="hidden md:block w-56 lg:w-64">
                        <SearchBox />
                    </div>

                    {/* Mobile Search Toggle */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        aria-label="Toggle search"
                    >
                        <Search size={22} />
                    </motion.button>

                    {/* Language Switcher */}
                    <div className="hidden md:block">
                        <LanguageSwitcher />
                    </div>

                    {/* Notification Bell */}
                    <div className="hidden md:block">
                        <NotificationBell />
                    </div>

                    {/* Account Icon */}
                    {isLoading ? (
                        <div className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hidden md:flex">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="h-5 w-5 border-2 border-white/30 border-t-[#E50914] rounded-full"
                            />
                        </div>
                    ) : isPremium ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/subscription"
                                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#E50914] hover:bg-red-500/10 rounded-lg transition-colors hidden md:flex border border-red-500/30 relative group"
                                aria-label="My Subscription"
                            >
                                <Crown size={22} />
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/login"
                                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:bg-white/10 rounded-lg transition-colors hidden md:flex"
                                aria-label="Account"
                            >
                                <User size={22} />
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Mobile Search Bar */}
            <AnimatePresence>
                {mobileSearchOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden"
                        style={{ zIndex: 9999 }}
                    >
                        <div className="p-4 bg-[#0a192f] border-b border-white/10">
                            <SearchBox />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40"
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="md:hidden fixed inset-y-0 left-0 top-16 w-[280px] bg-white z-50 p-4 border-r border-gray-200 overflow-y-auto pb-safe"
                        >
                            <nav className="flex flex-col space-y-1">
                                {navItems.map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "p-4 min-h-[48px] rounded-xl text-base font-semibold flex items-center gap-4 transition-all",
                                                    isActive ? "text-[#E50914] bg-red-50" : "text-gray-700 hover:bg-gray-50"
                                                )}
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <span className="relative">
                                                    <Icon size={22} />
                                                </span>
                                                {item.label}
                                                {isActive && (
                                                    <Zap size={16} className="ml-auto text-[#E50914]" />
                                                )}
                                            </Link>
                                        </motion.div>
                                    );
                                })}

                                {/* Divider */}
                                <div className="h-px bg-gray-200 my-4" />

                                {!isPremium && (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.35 }}
                                    >
                                        <Link
                                            href="/pricing"
                                            className="p-4 min-h-[48px] rounded-xl text-lg font-bold bg-gradient-to-r from-[#E50914] to-red-600 text-white flex items-center gap-4 hover:brightness-110 transition-all shadow-lg"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <Crown size={24} />
                                            PREMIUM
                                        </Link>
                                    </motion.div>
                                )}

                                {/* Mobile Account Link */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {isPremium ? (
                                        <Link
                                            href="/subscription"
                                            className="p-4 min-h-[48px] rounded-xl text-base font-semibold flex items-center gap-4 text-[#E50914] hover:bg-red-50 transition-colors border border-red-200"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <CreditCard size={22} />
                                            My Plan
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="p-4 min-h-[48px] rounded-xl text-base font-semibold flex items-center gap-4 text-gray-600 hover:bg-gray-50 transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <User size={22} />
                                            Akoon
                                        </Link>
                                    )}
                                </motion.div>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
