"use client";

import { useUser } from "@/providers/UserProvider";
import { Tv, Search, User, LogOut, Home, PlayCircle, Crown, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function TVProfilePage() {
    const { userId, isPremium, logout } = useUser();
    const router = useRouter();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="relative flex h-screen overflow-hidden bg-black text-white">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/bgcdn.webp"
                    alt="Background"
                    fill
                    className="object-cover opacity-20"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
            </div>

            {/* Sidebar Navigation */}
            <nav className="relative w-24 flex-shrink-0 bg-zinc-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-8 z-50">
                <div className="mb-10">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <Tv size={24} className="text-white" />
                    </div>
                </div>

                <div className="flex-1 space-y-8 w-full flex flex-col items-center">
                    <NavLink href="/tv" icon={<Home size={28} />} label="Home" />
                    <NavLink href="/tv/search" icon={<Search size={28} />} label="Search" />
                    <NavLink href="/tv/live" icon={<PlayCircle size={28} />} label="Live" />
                    <NavLink href="/tv/profile" icon={<User size={28} />} label="Profile" active />
                </div>

                <div className="mt-auto">
                    <button
                        onClick={handleLogout}
                        className="p-4 rounded-xl hover:bg-white/10 focus:bg-white/20 focus:outline-none transition-colors text-white/50 hover:text-white"
                    >
                        <LogOut size={24} />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-black mb-6">Profile</h1>
                    </div>

                    {userId ? (
                        <div className="space-y-6">
                            {/* User Info Card */}
                            <div className="bg-zinc-900/80 backdrop-blur border border-white/10 rounded-3xl p-8">
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center text-3xl font-black">
                                        U
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">User</h2>
                                        <p className="text-white/60">Premium Account</p>
                                    </div>
                                </div>

                                {/* Subscription Status */}
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                    <Crown className={isPremium ? "text-yellow-500" : "text-white/30"} size={32} />
                                    <div className="flex-1">
                                        <p className="font-bold">
                                            {isPremium ? "Premium Member" : "Free Member"}
                                        </p>
                                        <p className="text-sm text-white/60">
                                            {isPremium
                                                ? "Unlimited access to all content"
                                                : "Upgrade to unlock premium content"}
                                        </p>
                                    </div>
                                    {!isPremium && (
                                        <Link
                                            href="/pricing"
                                            className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                                        >
                                            Upgrade
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Viewing Activity */}
                            <div className="bg-zinc-900/80 backdrop-blur border border-white/10 rounded-3xl p-8">
                                <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                                <div className="space-y-4">
                                    <ActivityItem
                                        icon={<Clock size={20} />}
                                        title="Continue Watching"
                                        description="Resume your movies and series"
                                        link="/mylist"
                                    />
                                    <ActivityItem
                                        icon={<Calendar size={20} />}
                                        title="Watch History"
                                        description="View all content you've watched"
                                        link="/mylist"
                                    />
                                </div>
                            </div>

                            {/* Account Settings */}
                            <div className="bg-zinc-900/80 backdrop-blur border border-white/10 rounded-3xl p-8">
                                <h3 className="text-xl font-bold mb-6">Settings</h3>
                                <div className="space-y-4">
                                    <button className="w-full text-left px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
                                        Language Preferences
                                    </button>
                                    <button className="w-full text-left px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
                                        Subtitle Settings
                                    </button>
                                    <button className="w-full text-left px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
                                        Parental Controls
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-6 py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-2xl transition-colors font-bold"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Not logged in
                        <div className="bg-zinc-900/80 backdrop-blur border border-white/10 rounded-3xl p-12 text-center">
                            <User size={64} className="mx-auto mb-6 text-white/30" />
                            <h2 className="text-3xl font-bold mb-4">Not Logged In</h2>
                            <p className="text-white/60 mb-8">Sign in to access your profile and preferences</p>
                            <Link
                                href="/login"
                                className="inline-block px-8 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-red-600 focus:bg-zinc-800 focus:scale-110 ${active ? 'bg-red-600/20 text-red-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
            {icon}
            <span className="text-[10px] mt-1 font-medium">{label}</span>
        </Link>
    );
}

function ActivityItem({ icon, title, description, link }: { icon: React.ReactNode; title: string; description: string; link: string }) {
    return (
        <Link
            href={link}
            className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group"
        >
            <div className="text-white/60 group-hover:text-white transition-colors">{icon}</div>
            <div className="flex-1">
                <p className="font-bold">{title}</p>
                <p className="text-sm text-white/60">{description}</p>
            </div>
            <svg className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
    );
}
