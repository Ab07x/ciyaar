"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    Crown, User, LogOut, CreditCard, Clock, Download,
    Copy, Check, Film, Tv, Trophy, List, Settings,
    ChevronRight, Ticket, Shield, Bell, Zap,
} from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ── Sidebar nav items ── */
const NAV = [
    { label: "Overview",        icon: User,       id: "overview"  },
    { label: "Subscription",    icon: Crown,       id: "subscription" },
    { label: "Settings",        icon: Settings,    id: "settings"  },
];

const QUICK_LINKS = [
    { label: "Watch History",   icon: Clock,      href: "/history"              },
    { label: "My List",         icon: List,       href: "/mylist"               },
    { label: "Movies",          icon: Film,       href: "/movies"               },
    { label: "Series",          icon: Tv,         href: "/series"               },
    { label: "Live Sports",     icon: Trophy,     href: "/ciyaar"               },
    { label: "Payments",        icon: CreditCard, href: "/payments"             },
    { label: "Download App",    icon: Download,   href: "/apps"                 },
    { label: "Notifications",   icon: Bell,       href: "/kism/notifications"   },
    { label: "Privacy",         icon: Shield,     href: "/privacy"              },
];

export default function AccountPage() {
    const { userId, deviceId, email, username, isPremium, subscription, isLoading, logout, updateUsername, profile, updateAvatar } = useUser();
    const [activeTab, setActiveTab] = useState("overview");
    const [usernameInput, setUsernameInput] = useState("");
    const [editingUsername, setEditingUsername] = useState(false);
    const [savingUsername, setSavingUsername] = useState(false);
    const [usernameFeedback, setUsernameFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const { data: subData } = useSWR(
        deviceId ? `/api/subscriptions?deviceId=${encodeURIComponent(deviceId)}` : null,
        fetcher
    );

    const accessCode = String(subData?.code?.code || (typeof window !== "undefined" ? localStorage.getItem("fanbroj_last_payment_code") : "") || "").trim();
    const sub = subscription as { plan?: string; expiresAt?: number; activatedAt?: number } | null;
    const expiresAt = Number(sub?.expiresAt || 0);
    const avatarLetter = (username?.[0] || email?.[0] || "U").toUpperCase();
    const avatarUrl = (profile as Record<string, unknown>)?.avatarUrl as string | undefined;

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        await updateAvatar(file);
        setUploadingAvatar(false);
        e.target.value = "";
    };

    const handleCopyCode = async () => {
        if (!accessCode) return;
        await navigator.clipboard.writeText(accessCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1800);
    };

    const handleSaveUsername = async () => {
        const val = usernameInput.trim();
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) {
            setUsernameFeedback({ ok: false, msg: "3–20 chars: letters, numbers, underscore only." });
            return;
        }
        setSavingUsername(true);
        setUsernameFeedback(null);
        const res = await updateUsername(val);
        if (res.success) {
            setUsernameFeedback({ ok: true, msg: "Username saved!" });
            setEditingUsername(false);
        } else {
            setUsernameFeedback({ ok: false, msg: res.error || "Failed to save." });
        }
        setSavingUsername(false);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#E50914] rounded-full animate-spin" />
            </div>
        );
    }

    if (!userId && !isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="text-gray-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in to your account</h2>
                    <p className="text-gray-500 text-sm mb-6">Login or create an account to manage your subscription and settings.</p>
                    <div className="flex flex-col gap-3">
                        <Link href="/login" className="py-3 rounded-xl bg-[#E50914] text-white font-bold text-center hover:bg-red-700 transition-colors">Login</Link>
                        <Link href="/premium" className="py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-center hover:bg-gray-200 transition-colors">Create Account</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-10">

                {/* ── Page header ── */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-gray-900">My Account</h1>
                    <p className="text-gray-500 text-sm mt-1">{email || "Guest account"}</p>
                </div>

                <div className="flex gap-6 items-start">

                    {/* ── Sidebar ── */}
                    <aside className="w-56 flex-shrink-0 sticky top-24">
                        {/* Avatar card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 text-center shadow-sm">
                            <div className="relative inline-block">
                                {avatarUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={avatarUrl} alt="" className={`w-14 h-14 rounded-full mx-auto mb-3 object-cover border-2 ${isPremium ? "border-yellow-400" : "border-gray-200"} ${uploadingAvatar ? "opacity-50" : ""}`} />
                                ) : (
                                    <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-black text-white ${isPremium ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-[#E50914] to-red-700"} ${uploadingAvatar ? "opacity-50" : ""}`}>
                                        {avatarLetter}
                                    </div>
                                )}
                                <label className="absolute inset-0 rounded-full cursor-pointer hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                    <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                                </label>
                            </div>
                            <p className="font-bold text-gray-900 text-sm truncate">{username ? `@${username}` : email || "User"}</p>
                            {isPremium ? (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                                    <Crown size={10} /> Premium
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                                    Free
                                </span>
                            )}
                        </div>

                        {/* Nav */}
                        <nav className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            {NAV.map((item, i) => {
                                const Icon = item.icon;
                                const active = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-left ${i > 0 ? "border-t border-gray-100" : ""} ${active ? "bg-red-50 text-[#E50914]" : "text-gray-600 hover:bg-gray-50"}`}
                                    >
                                        <Icon size={16} />
                                        {item.label}
                                        {active && <ChevronRight size={14} className="ml-auto" />}
                                    </button>
                                );
                            })}
                            <div className="border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    <LogOut size={16} />
                                    {loggingOut ? "Logging out…" : "Logout"}
                                </button>
                            </div>
                        </nav>
                    </aside>

                    {/* ── Main content ── */}
                    <main className="flex-1 min-w-0 space-y-5">

                        {/* ── OVERVIEW ── */}
                        {activeTab === "overview" && (
                            <>
                                {/* Subscription banner */}
                                {isPremium ? (
                                    <div className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 p-5 text-black shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Crown size={18} />
                                                    <span className="font-black text-base uppercase tracking-wide">
                                                        {String(sub?.plan || "Premium").toUpperCase()} PLAN
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold opacity-80">
                                                    {expiresAt > 0 ? `Expires ${format(expiresAt, "MMM dd, yyyy")}` : "Active"}
                                                </p>
                                            </div>
                                            <Link href="/subscription" className="bg-black/20 hover:bg-black/30 transition-colors text-black font-bold text-xs px-4 py-2 rounded-xl">
                                                Manage
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl bg-gradient-to-r from-[#E50914] to-red-700 p-5 text-white shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-black text-base mb-1">Upgrade to Premium</p>
                                                <p className="text-sm opacity-80">Unlimited streaming · No ads · HD/4K</p>
                                            </div>
                                            <Link href="/pricing" className="bg-white text-[#E50914] font-black text-xs px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1.5">
                                                <Zap size={13} /> Get Premium
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Access code */}
                                {accessCode && (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Ticket size={15} className="text-gray-400" />
                                            <h3 className="font-black text-sm text-gray-700 uppercase tracking-wide">Premium Access Code</h3>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                            <span className="font-mono text-gray-900 text-sm tracking-widest">{accessCode}</span>
                                            <button onClick={handleCopyCode} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                                {copiedCode ? <><Check size={13} className="text-green-500" /> Copied</> : <><Copy size={13} /> Copy</>}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Keep this code as a record of your payment.</p>
                                    </div>
                                )}

                                {/* Quick links grid */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <h3 className="font-black text-sm text-gray-700 uppercase tracking-wide mb-4">Quick Links</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {QUICK_LINKS.map(({ label, icon: Icon, href }) => (
                                            <Link
                                                key={href}
                                                href={href}
                                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group text-center"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#E50914]/10 flex items-center justify-center transition-colors">
                                                    <Icon size={18} className="text-gray-500 group-hover:text-[#E50914] transition-colors" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">{label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── SUBSCRIPTION ── */}
                        {activeTab === "subscription" && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                                <h3 className="font-black text-base text-gray-900">Subscription Details</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: "Status",   value: isPremium ? "Active" : "Free", color: isPremium ? "text-green-600" : "text-gray-500" },
                                        { label: "Plan",     value: isPremium ? String(sub?.plan || "Premium").toUpperCase() : "—" },
                                        { label: "Expires",  value: expiresAt > 0 ? format(expiresAt, "MMMM dd, yyyy") : "—" },
                                        { label: "Email",    value: email || "—" },
                                        { label: "Username", value: username ? `@${username}` : "Not set" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                            <span className="text-sm text-gray-500 font-medium">{label}</span>
                                            <span className={`text-sm font-bold ${color || "text-gray-900"}`}>{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {isPremium ? (
                                    <Link href="/subscription" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm transition-colors">
                                        <Crown size={16} /> View Full Subscription
                                    </Link>
                                ) : (
                                    <Link href="/pricing" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-black text-sm transition-colors">
                                        <Zap size={16} /> Upgrade to Premium
                                    </Link>
                                )}
                                <Link href="/payments" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors">
                                    <CreditCard size={16} /> Payment History
                                </Link>
                            </div>
                        )}

                        {/* ── SETTINGS ── */}
                        {activeTab === "settings" && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                                <h3 className="font-black text-base text-gray-900">Account Settings</h3>

                                {/* Profile Photo */}
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">Profile Photo</label>
                                    <div className="flex items-center gap-4">
                                        {avatarUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={avatarUrl} alt="" className={`w-16 h-16 rounded-full object-cover border-2 border-gray-200 ${uploadingAvatar ? "opacity-50" : ""}`} />
                                        ) : (
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white ${isPremium ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-[#E50914] to-red-700"}`}>
                                                {avatarLetter}
                                            </div>
                                        )}
                                        <label className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer transition-colors">
                                            {uploadingAvatar ? "Uploading…" : "Change Photo"}
                                            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                                        </label>
                                    </div>
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">Username</label>
                                    {editingUsername ? (
                                        <div className="flex gap-2">
                                            <div className="flex-1 flex items-center border border-gray-300 rounded-xl px-3 bg-gray-50 focus-within:border-[#E50914] transition-colors">
                                                <span className="text-gray-400 mr-1.5">@</span>
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={usernameInput}
                                                    onChange={e => setUsernameInput(e.target.value.replace(/\s/g, ""))}
                                                    placeholder={username || "your_username"}
                                                    maxLength={20}
                                                    className="flex-1 py-2.5 bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>
                                            <button onClick={handleSaveUsername} disabled={savingUsername} className="px-4 py-2.5 rounded-xl bg-[#E50914] text-white font-bold text-sm disabled:opacity-50 hover:bg-red-700 transition-colors">
                                                {savingUsername ? "Saving…" : "Save"}
                                            </button>
                                            <button onClick={() => { setEditingUsername(false); setUsernameFeedback(null); }} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                                            <span className="text-sm text-gray-700 font-medium">{username ? `@${username}` : "Not set"}</span>
                                            <button onClick={() => { setUsernameInput(username || ""); setEditingUsername(true); setUsernameFeedback(null); }} className="text-xs font-bold text-[#E50914] hover:underline">Edit</button>
                                        </div>
                                    )}
                                    {usernameFeedback && (
                                        <p className={`text-xs mt-1.5 font-semibold ${usernameFeedback.ok ? "text-green-600" : "text-red-500"}`}>{usernameFeedback.msg}</p>
                                    )}
                                </div>

                                {/* Email (read-only) */}
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">Email</label>
                                    <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                                        <span className="text-sm text-gray-500">{email || "—"}</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                        className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                    >
                                        <LogOut size={15} />
                                        {loggingOut ? "Logging out…" : "Logout of this device"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
}
