"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlayCircle, User } from "lucide-react";

type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navItems: NavItem[] = [
    { href: "/tv", label: "Home", icon: Home },
    { href: "/tv/search", label: "Search", icon: Search },
    { href: "/tv/live", label: "Live", icon: PlayCircle },
    { href: "/tv/profile", label: "Profile", icon: User },
];

export default function TVBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/75 px-3 py-2 backdrop-blur-xl shadow-2xl">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${isActive
                                ? "bg-red-600/90 text-white"
                                : "text-white/75 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
