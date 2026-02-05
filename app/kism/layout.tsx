"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
    Film,
    Tv,
    Smartphone,
    Sparkles,
    Palette,
    Image,
    Search,
    CreditCard,
    Bell,
    Lock,
    BarChart3,
} from "lucide-react";

const navItems = [
    { href: "/kism", label: "Dashboard", icon: LayoutDashboard },
    { href: "/kism/matches", label: "Matches", icon: PlayCircle },
    { href: "/kism/movies", label: "Movies", icon: Film },
    { href: "/kism/series", label: "Series", icon: Tv },
    { href: "/kism/import", label: "Import", icon: Download },
    { href: "/kism/leagues", label: "Leagues", icon: Trophy },
    { href: "/kism/shorts", label: "Shorts", icon: Smartphone },
    { href: "/kism/blog", label: "Blog", icon: FileText },
    { href: "/kism/ads", label: "Ads", icon: Megaphone },
    { href: "/kism/banners", label: "Banners", icon: Sparkles },
    { href: "/kism/hero", label: "Hero Slider", icon: Image },
    { href: "/kism/categories", label: "Categories", icon: Palette },
    { href: "/kism/codes", label: "Codes", icon: Ticket },
    { href: "/kism/ppv", label: "PPV", icon: CreditCard },
    { href: "/kism/notifications", label: "Notifications", icon: Bell },
    { href: "/kism/pricing", label: "Pricing", icon: DollarSign },
    { href: "/kism/seo", label: "SEO", icon: Search },
    { href: "/kism/search-analytics", label: "Search Analytics", icon: BarChart3 },
    { href: "/kism/media", label: "Media", icon: Image },
    { href: "/kism/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Check auth on mount (client-side)
    useEffect(() => {
        // Skip auth check for login page
        if (pathname === "/kism/login") {
            setIsAuthenticated(true);
            return;
        }

        // Check if admin session exists with small delay to ensure cookie is available
        const checkAuth = () => {
            const cookies = document.cookie;
            console.log("[Auth] Checking cookies:", cookies);
            if (cookies.includes("fanbroj_admin_session=authenticated")) {
                console.log("[Auth] Authenticated!");
                setIsAuthenticated(true);
            } else {
                console.log("[Auth] Not authenticated, redirecting...");
                setIsAuthenticated(false);
                router.push("/kism/login");
            }
        };

        // Small delay to ensure cookie is processed
        const timer = setTimeout(checkAuth, 100);
        return () => clearTimeout(timer);
    }, [pathname, router]);

    // Login page - no layout
    if (pathname === "/kism/login") {
        return children;
    }

    // Loading state
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-stadium-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-accent-green/30 border-t-accent-green rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-muted">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show nothing (redirecting)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-stadium-dark flex items-center justify-center">
                <div className="text-center">
                    <Lock size={48} className="text-accent-red mx-auto mb-4" />
                    <p className="text-text-muted">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        await fetch("/api/kism/logout", { method: "POST" });
        document.cookie = "fanbroj_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setIsAuthenticated(false);
        router.push("/kism/login");
    };

    return (
        <div className="min-h-screen bg-stadium-dark flex">
            {/* Sidebar */}
            <aside className="w-64 bg-stadium-elevated border-r border-border-strong flex flex-col fixed h-full">
                <div className="p-6 border-b border-border-strong">
                    <Link href="/kism" className="text-xl font-black">
                        FAN<span className="text-accent-green">BROJ</span>
                        <span className="block text-xs text-text-muted font-normal mt-1">Admin Panel</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== "/kism" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
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
            <main className="flex-1 ml-64 p-8 overflow-auto min-h-screen">
                {children}
            </main>
        </div>
    );
}
