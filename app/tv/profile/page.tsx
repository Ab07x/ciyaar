"use client";

import { useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { User, Crown, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function TVProfilePage() {
    const { userId, isPremium, logout, username, updateUsername } = useUser();
    const [usernameInput, setUsernameInput] = useState("");
    const [hasEditedUsername, setHasEditedUsername] = useState(false);
    const [isSavingUsername, setIsSavingUsername] = useState(false);
    const [usernameFeedback, setUsernameFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleLogout = () => {
        logout();
    };

    const handleSaveUsername = async () => {
        if (!userId) return;
        const currentInput = (hasEditedUsername ? usernameInput : (username || "")).trim();
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(currentInput)) {
            setUsernameFeedback({
                type: "error",
                text: "Username waa inuu ahaadaa 3-20 xaraf: letters, numbers ama underscore.",
            });
            return;
        }

        setIsSavingUsername(true);
        setUsernameFeedback(null);
        const result = await updateUsername(currentInput);
        if (result.success) {
            setUsernameInput(currentInput);
            setHasEditedUsername(false);
            setUsernameFeedback({ type: "success", text: "Username-kaaga waa la keydiyay." });
        } else {
            setUsernameFeedback({
                type: "error",
                text: result.error || "Username lama keydin. Isku day mar kale.",
            });
        }
        setIsSavingUsername(false);
    };

    return (
        <div className="relative h-screen overflow-hidden bg-black text-white">
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

            {/* Main Content */}
            <main className="relative z-10 h-full overflow-y-auto p-8">
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
                                        {(username?.[0] || "U").toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{username ? `@${username}` : "User"}</h2>
                                        <p className="text-white/60">Premium Account</p>
                                    </div>
                                </div>

                                {/* Username Editor */}
                                <div className="mb-6">
                                    <p className="text-xs uppercase tracking-wider text-white/50 font-bold mb-2">Custom Username</p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex items-center bg-black/30 border border-white/15 rounded-xl px-3 py-2.5">
                                            <span className="text-white/40 mr-2">@</span>
                                            <input
                                                type="text"
                                                value={hasEditedUsername ? usernameInput : (username || "")}
                                                onChange={(e) => {
                                                    setHasEditedUsername(true);
                                                    setUsernameInput(e.target.value.replace(/\s+/g, ""));
                                                }}
                                                placeholder="username"
                                                maxLength={20}
                                                className="w-full bg-transparent outline-none text-white placeholder:text-white/30"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSaveUsername}
                                            disabled={isSavingUsername || (hasEditedUsername ? usernameInput.trim().length : (username || "").trim().length) < 3}
                                            className="px-4 py-2.5 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSavingUsername ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                    {usernameFeedback && (
                                        <p className={`mt-2 text-xs font-bold ${usernameFeedback.type === "success" ? "text-green-400" : "text-red-400"}`}>
                                            {usernameFeedback.text}
                                        </p>
                                    )}
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
