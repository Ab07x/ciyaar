"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    PlayCircle,
    FileText,
    Settings,
    Megaphone,
    Ticket,
    Download,
    Trophy,
    LogOut,
    DollarSign,
    Radio,
    Film,
    Tv,
    Smartphone,
    Sparkles,
    Palette,
    Image,
    Search,
} from "lucide-react";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/matches", label: "Matches", icon: PlayCircle },
    { href: "/admin/channels", label: "Channels", icon: Radio },
    { href: "/admin/movies", label: "Movies", icon: Film },
    { href: "/admin/series", label: "Series", icon: Tv },
    { href: "/admin/import", label: "Import", icon: Download },
    { href: "/admin/leagues", label: "Leagues", icon: Trophy },
    { href: "/admin/shorts", label: "Shorts", icon: Smartphone },
    { href: "/admin/blog", label: "Blog", icon: FileText },
    { href: "/admin/ads", label: "Ads", icon: Megaphone },
    { href: "/admin/banners", label: "Banners", icon: Sparkles },
    { href: "/admin/hero-slides", label: "Hero Slides", icon: Image },
    { href: "/admin/categories", label: "Categories", icon: Palette },
    { href: "/admin/codes", label: "Codes", icon: Ticket },
    { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
    { href: "/admin/seo", label: "SEO", icon: Search },
    { href: "/admin/media", label: "Media", icon: Image },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Don't show layout on login page
    if (pathname === "/admin/login") {
        return children;
    }

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-stadium-dark flex">
            {/* Sidebar */}
            <aside className="w-64 bg-stadium-elevated border-r border-border-strong flex flex-col">
                <div className="p-6 border-b border-border-strong">
                    <Link href="/admin" className="text-xl font-black">
                        FAN<span className="text-accent-green">BROJ</span>
                        <span className="block text-xs text-text-muted font-normal mt-1">Admin Panel</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== "/admin" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? "bg-accent-green text-black"
                                    : "text-text-secondary hover:bg-stadium-hover hover:text-white"
                                    }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border-strong">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-accent-red/20 hover:text-accent-red w-full transition-all"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                {children}
            </main>
        </div>
    );
}
