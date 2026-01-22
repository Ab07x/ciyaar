"use client";

import { UserCircle, Settings, Download, Globe, LogOut, ChevronRight, Trophy, Film, Tv, Heart, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MenuPage() {
    const router = useRouter();

    const menuItems = [
        { label: "Home", icon: Home, href: "/" },
        { label: "Ciyaaraha (Sports)", icon: Trophy, href: "/ciyaar" },
        { label: "Filimaan (Movies)", icon: Film, href: "/movies" },
        { label: "Musalsal (Series)", icon: Tv, href: "/series" },
        { label: "My List", icon: Heart, href: "/mylist" },
    ];

    const settingsItems = [
        { label: "Download Apps", icon: Download, href: "/apps" },
        { label: "Pricing / Premium", icon: Settings, href: "/pricing" },
        { label: "Visit Website", icon: Globe, href: "https://fanbroj.net" },
    ];

    const handleLogout = () => {
        // Clear local storage or hit logout API
        if (confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            window.location.href = "/";
        }
    };

    return (
        <div className="min-h-screen bg-stadium-dark pb-32">
            {/* Header */}
            <div className="p-6 pt-12 bg-gradient-to-b from-stadium-elevated to-stadium-dark border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center border-2 border-accent-green">
                        <UserCircle size={32} className="text-accent-green" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">Guest User</h1>
                        <p className="text-sm text-text-muted">Fanbroj Free Account</p>
                        <Link href="/pricing" className="text-xs font-bold text-accent-gold mt-1 block hover:underline">
                            Upgrade to Premium
                        </Link>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Main Navigation */}
                <section>
                    <h2 className="text-xs font-black text-text-muted uppercase tracking-widest mb-3 ml-2">Browse</h2>
                    <div className="bg-stadium-elevated border border-white/5 rounded-2xl overflow-hidden">
                        {menuItems.map((item, i) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${i !== menuItems.length - 1 ? 'border-b border-white/5' : ''}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted icon-box">
                                    <item.icon size={18} />
                                </div>
                                <span className="font-bold text-white flex-1">{item.label}</span>
                                <ChevronRight size={16} className="text-text-muted/50" />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Settings & More */}
                <section>
                    <h2 className="text-xs font-black text-text-muted uppercase tracking-widest mb-3 ml-2">More</h2>
                    <div className="bg-stadium-elevated border border-white/5 rounded-2xl overflow-hidden">
                        {settingsItems.map((item, i) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${i !== settingsItems.length - 1 ? 'border-b border-white/5' : ''}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted icon-box">
                                    <item.icon size={18} />
                                </div>
                                <span className="font-bold text-white flex-1">{item.label}</span>
                                <ChevronRight size={16} className="text-text-muted/50" />
                            </Link>
                        ))}

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 p-4 hover:bg-red-500/10 transition-colors border-t border-white/5 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted group-hover:text-red-500 transition-colors icon-box">
                                <LogOut size={18} />
                            </div>
                            <span className="font-bold text-white group-hover:text-red-500 transition-colors flex-1 text-left">Log Out</span>
                        </button>
                    </div>
                </section>

                {/* Footer Info */}
                <div className="text-center py-6">
                    <p className="text-2xl font-black tracking-tighter text-white/20 mb-2">
                        FAN<span className="text-white/40">BROJ</span>
                    </p>
                    <p className="text-[10px] text-text-muted/50">Version 2.4.0 (Build 2026)</p>
                </div>
            </div>
        </div>
    );
}
