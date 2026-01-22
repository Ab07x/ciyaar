"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import {
    PlayCircle,
    Calendar,
    Lock,
    Users,
    FileText,
    Ticket,
    TrendingUp,
    Film,
    Tv,
    Eye,
    Crown,
} from "lucide-react";
import Link from "next/link";
import { StatsCard } from "@/components/admin/StatsCard";
import { ViewsChart, TopContentChart, SubscriptionChart } from "@/components/admin/ViewsChart";

export default function AdminDashboard() {
    const matches = useQuery(api.matches.listMatches, {});
    const posts = useQuery(api.posts.listPosts, {});
    const codeStats = useQuery(api.redemptions.getCodeStats);
    const settings = useQuery(api.settings.getSettings);

    if (!matches || !posts || !codeStats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-12 w-12 border-4 border-text-muted border-t-accent-green rounded-full"
                />
            </div>
        );
    }

    const totalViews = matches.reduce((acc, m) => acc + (m.views || 0), 0) + posts.reduce((acc, p) => acc + (p.views || 0), 0);

    const stats = [
        { label: "Total Matches", value: matches.length, icon: PlayCircle, color: "text-accent-blue" },
        { label: "Live Now", value: matches.filter(m => m.status === "live").length, icon: PlayCircle, color: "text-accent-red", trend: { value: 12, isPositive: true } },
        { label: "Upcoming", value: matches.filter(m => m.status === "upcoming").length, icon: Calendar, color: "text-accent-green" },
        { label: "Premium", value: matches.filter(m => m.isPremium).length, icon: Lock, color: "text-accent-gold" },
        { label: "Total Views", value: totalViews, icon: Eye, color: "text-accent-green", trend: { value: 23, isPositive: true } },
        { label: "Blog Posts", value: posts.length, icon: FileText, color: "text-purple-400" },
        { label: "Active Codes", value: codeStats.available, icon: Ticket, color: "text-accent-blue" },
    ];

    // Mock data for charts (in production, this would come from your analytics API)
    const viewsData = [
        { date: "Mon", views: 2400, users: 400 },
        { date: "Tue", views: 1398, users: 300 },
        { date: "Wed", views: 9800, users: 800 },
        { date: "Thu", views: 3908, users: 500 },
        { date: "Fri", views: 4800, users: 600 },
        { date: "Sat", views: 8800, users: 1200 },
        { date: "Sun", views: 4300, users: 700 },
    ];

    const topContent = [
        { name: "Liverpool vs Chelsea", views: 45000 },
        { name: "Real Madrid vs Barca", views: 38000 },
        { name: "Man City vs Arsenal", views: 32000 },
        { name: "Bayern vs Dortmund", views: 28000 },
        { name: "PSG vs Marseille", views: 22000 },
    ];

    const subscriptionData = [
        { name: "Premium", value: codeStats.redeemed || 156, color: "#F59E0B" },
        { name: "Free", value: 1200, color: "#6B7280" },
        { name: "Trial", value: 89, color: "#22C55E" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-black text-white">DASHBOARD</h1>
                <p className="text-text-muted">Aragtida guud ee Fanbroj</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                {stats.map((stat, i) => (
                    <StatsCard key={i} {...stat} index={i} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ViewsChart data={viewsData} title="Views This Week" />
                <TopContentChart data={topContent} title="Top Performing Content" />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Subscription Stats */}
                <SubscriptionChart data={subscriptionData} title="User Subscriptions" />

                {/* Live Now Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
                >
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <PlayCircle size={18} className="text-accent-red" />
                        Live Now
                    </h3>
                    <div className="space-y-3">
                        {matches.filter(m => m.status === "live").length > 0 ? (
                            matches.filter(m => m.status === "live").slice(0, 5).map((m: any) => (
                                <motion.div
                                    key={m._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-3 bg-stadium-hover rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <div>
                                        <div className="font-bold text-sm">{m.title}</div>
                                        <div className="text-xs text-text-muted">{m.leagueName}</div>
                                    </div>
                                    <span className="px-2 py-1 bg-accent-red/20 text-accent-red text-xs font-bold rounded flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-accent-red rounded-full animate-pulse" />
                                        LIVE
                                    </span>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <PlayCircle size={40} className="mx-auto text-text-muted mb-2" />
                                <p className="text-text-muted text-sm">Ma jiraan ciyaaro live ah</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
                >
                    <h3 className="font-bold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { href: "/admin/matches/new", icon: PlayCircle, label: "Add Match", color: "accent-green" },
                            { href: "/admin/channels/new", icon: Tv, label: "Add Channel", color: "accent-red" },
                            { href: "/admin/movies/new", icon: Film, label: "Add Movie", color: "accent-blue" },
                            { href: "/admin/series/new", icon: Tv, label: "Add Series", color: "purple-400" },
                            { href: "/admin/shorts", icon: PlayCircle, label: "Shorts", color: "accent-gold" },
                            { href: "/admin/codes", icon: Ticket, label: "Codes", color: "blue-400" },
                        ].map((action, i) => (
                            <motion.div
                                key={action.href}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link
                                    href={action.href}
                                    className={`p-4 bg-stadium-hover rounded-xl text-center hover:bg-${action.color}/20 transition-colors block`}
                                >
                                    <action.icon size={24} className={`mx-auto mb-2 text-${action.color}`} />
                                    <span className="text-sm font-semibold">{action.label}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Recent Blog Posts */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <FileText size={18} className="text-purple-400" />
                        Recent Posts
                    </h3>
                    <Link
                        href="/admin/blog"
                        className="text-sm text-accent-green hover:underline"
                    >
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-text-muted text-xs uppercase border-b border-border-subtle">
                                <th className="pb-3 font-semibold">Title</th>
                                <th className="pb-3 font-semibold">Views</th>
                                <th className="pb-3 font-semibold">Status</th>
                                <th className="pb-3 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {posts.slice(0, 5).map((post: any) => (
                                <tr key={post._id} className="hover:bg-white/5">
                                    <td className="py-3 font-semibold">{post.title}</td>
                                    <td className="py-3 text-text-secondary">{(post.views || 0).toLocaleString()}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${post.isPublished ? "bg-accent-green/20 text-accent-green" : "bg-text-muted/20 text-text-muted"}`}>
                                            {post.isPublished ? "Published" : "Draft"}
                                        </span>
                                    </td>
                                    <td className="py-3 text-text-secondary text-sm">
                                        {new Date(post._creationTime).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
