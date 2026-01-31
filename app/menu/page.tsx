"use client";

import React, { useState } from "react";
import {
    UserCircle,
    Settings,
    Download,
    Globe,
    LogOut,
    ChevronRight,
    Trophy,
    Film,
    Tv,
    Heart,
    Home,
    Crown,
    Bell,
    Shield,
    Activity,
    CreditCard,
    Smartphone,
    Share2,
    Info,
    CheckCircle2,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { format } from "date-fns";
import { ReferralCard } from "@/components/ReferralCard";

/**
 * MenuPage - A premium, sports-themed navigation and settings hub.
 * Design Ethos: "Stadium Noir" - Dark gradients, glassmorphism, and bold accents.
 */
export default function MenuPage() {
    const router = useRouter();
    const { userId, isPremium, subscription, isLoading, logout } = useUser();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Navigation sections
    const mainNav = [
        { label: "Home", icon: Home, href: "/", color: "text-blue-400" },
        { label: "Ciyaaraha Live", icon: Trophy, href: "/ciyaar", color: "text-accent-green" },
        { label: "Filimaan", icon: Film, href: "/movies", color: "text-red-400" },
        { label: "Musalsal", icon: Tv, href: "/series", color: "text-purple-400" },
        { label: "Liiskaaga (My List)", icon: Heart, href: "/mylist", color: "text-pink-400" },
    ];

    const supportNav = [
        { label: "Soo Degso Apps", icon: Download, href: "/apps", color: "text-yellow-400" },
        { label: "Wararka & News", icon: Activity, href: "/blog", color: "text-orange-400" },
        { label: "Ku Saabsan", icon: Info, href: "/about", color: "text-blue-400" },
    ];

    const settingsNav = [
        { label: "Fariimaha (Notifications)", icon: Bell, href: "/kism/notifications" },
        { label: "Gooni u Ahaanshaha", icon: Shield, href: "/privacy" },
        { label: "Websaydhka Booqo", icon: Globe, href: "https://fanbroj.net" },
    ];

    const handleLogout = async () => {
        if (confirm("Ma hubtaa inaad ka bixi karto user-kaaga?")) {
            setIsLoggingOut(true);
            try {
                await logout();
            } catch (error) {
                console.error("Logout failed:", error);
                setIsLoggingOut(false);
            }
        }
    };

    // Determine user status UI
    let statusConfig = {
        label: "Booqde (Guest)",
        sub: "Saxiix si aad u hesho adeegyo dheeraad ah",
        theme: "guest",
        icon: UserCircle,
        badge: null as React.ReactNode
    };

    if (!isLoading && userId) {
        if (isPremium) {
            statusConfig = {
                label: "Premium User",
                sub: subscription?.expiresAt
                    ? `Wuxuu dhacayaa: ${format(subscription.expiresAt, 'MMM dd, yyyy')}`
                    : "Access aan xad lahayn",
                theme: "premium",
                icon: Trophy,
                badge: <Crown size={12} fill="currentColor" />
            };
        } else {
            statusConfig = {
                label: "Isticmaale Bilaash ah",
                sub: "Inyar oo kooban ayaad haysata",
                theme: "free",
                icon: UserCircle,
                badge: <CheckCircle2 size={12} className="text-accent-green" />
            };
        }
    }

    return (
        <div className="min-h-screen bg-stadium-dark text-white selection:bg-accent-green selection:text-black pb-40">
            {/* Header / Profile Stage */}
            <div className="relative pt-16 pb-8 px-6 bg-gradient-to-b from-[#1a1a2e] to-stadium-dark border-b border-white/5 overflow-hidden">
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] -ml-24 -mt-24 rounded-full" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    {/* Avatar with dynamic glow */}
                    <div className={`relative p-1 rounded-full bg-gradient-to-tr ${statusConfig.theme === 'premium'
                        ? 'from-yellow-400 via-orange-500 to-yellow-400 shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]'
                        : 'from-accent-green/50 to-blue-500/50'
                        }`}>
                        <div className="w-20 h-20 rounded-full bg-stadium-elevated flex items-center justify-center border-2 border-black/20">
                            <statusConfig.icon size={40} className={statusConfig.theme === 'premium' ? 'text-accent-gold' : 'text-accent-green'} />
                        </div>
                        {statusConfig.badge && (
                            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-black ${statusConfig.theme === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' : 'bg-stadium-elevated text-accent-green'
                                }`}>
                                {statusConfig.badge}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-2xl font-black uppercase tracking-tight flex items-center justify-center gap-2">
                            {statusConfig.label}
                        </h1>
                        <p className="text-sm font-medium text-text-muted">{statusConfig.sub}</p>
                    </div>

                    {statusConfig.theme !== 'premium' && (
                        <Link
                            href="/pricing"
                            className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-full text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                        >
                            <Zap size={14} fill="currentColor" />
                            Kordhi Premium-kaaga
                        </Link>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-8 max-w-2xl mx-auto">
                {/* Referral Program - Premium Card */}
                {userId && (
                    <div className="relative overflow-hidden rounded-3xl group">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-green/20 via-blue-500/10 to-transparent transition-opacity group-hover:opacity-80" />
                        <ReferralCard />
                    </div>
                )}

                {/* Navigation Blocks */}
                <div className="grid gap-8">
                    {/* Main Nav Section */}
                    <MenuSection title="Daawo & Baro">
                        <div className="grid grid-cols-1 gap-2">
                            {mainNav.map((item) => (
                                <MenuLink key={item.label} {...item} />
                            ))}
                        </div>
                    </MenuSection>

                    {/* Support Nav Section */}
                    <MenuSection title="Caawimaad & News">
                        <div className="grid grid-cols-1 gap-2">
                            {supportNav.map((item) => (
                                <MenuLink key={item.label} {...item} />
                            ))}
                        </div>
                    </MenuSection>

                    {/* Settings Section */}
                    <MenuSection title="Abaabulka & Settings">
                        <div className="grid grid-cols-1 gap-2">
                            {settingsNav.map((item) => (
                                <MenuLink key={item.label} {...item} />
                            ))}

                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full flex items-center gap-4 p-4 bg-stadium-elevated/50 hover:bg-red-500/10 border border-white/5 rounded-2xl transition-all group active:scale-[0.98] disabled:opacity-50"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-red-500 group-hover:bg-red-500/20 transition-all">
                                    <LogOut size={20} />
                                </div>
                                <div className="flex-1 text-left">
                                    <span className="block font-bold text-white group-hover:text-red-500 transition-colors">Ka Bax User-ka</span>
                                    <span className="block text-[10px] text-text-muted group-hover:text-red-500/50">Logout of current device</span>
                                </div>
                                <ChevronRight size={18} className="text-white/10 group-hover:text-red-500/50 transition-colors" />
                            </button>
                        </div>
                    </MenuSection>
                </div>

                {/* Footer Logo & Version */}
                <div className="text-center pt-8 pb-4 space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
                        <p className="text-2xl font-black tracking-tighter text-white/10">
                            FAN<span className="text-accent-green/30">BROJ</span>
                        </p>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-muted/40">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <span>•</span>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                    </div>
                    <p className="text-[9px] text-text-muted/30">Version 2.5.0 • Built with Stadium Noir Engine</p>
                </div>
            </div>
        </div>
    );
}

// Sub-components for structure and consistency
function MenuSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="px-4 text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">{title}</h2>
            {children}
        </section>
    );
}

interface MenuLinkProps {
    label: string;
    icon: any;
    href: string;
    color?: string;
    subLabel?: string;
}

function MenuLink({ label, icon: Icon, href, color, subLabel }: MenuLinkProps) {
    const isExternal = href.startsWith('http');
    const LinkComponent = isExternal ? 'a' : Link;

    return (
        <LinkComponent
            href={href}
            {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex items-center gap-4 p-4 bg-stadium-elevated/50 hover:bg-white/5 border border-white/5 rounded-2xl transition-all group active:scale-[0.98]"
        >
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color || 'text-text-muted'} group-hover:bg-white/10 group-hover:scale-110 transition-all`}>
                <Icon size={20} />
            </div>
            <div className="flex-1">
                <span className="block font-bold text-white group-hover:text-accent-green transition-colors">{label}</span>
                {subLabel && <span className="block text-[10px] text-text-muted">{subLabel}</span>}
            </div>
            <ChevronRight size={18} className="text-white/10 group-hover:text-accent-green group-hover:translate-x-1 transition-all" />
        </LinkComponent>
    );
}
