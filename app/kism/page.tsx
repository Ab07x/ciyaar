"use client";

import { useState } from "react";
import useSWR from "swr";
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
    ArrowUp,
    ArrowDown,
    BarChart3,
    Clock,
    Layers,
    Image as ImageIcon,
    RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { StatsCard } from "@/components/admin/StatsCard";
import { ViewsChart, TopContentChart, SubscriptionChart } from "@/components/admin/ViewsChart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SkeletonCard() {
    return (
        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-16 bg-stadium-hover rounded" />
                <div className="h-4 w-4 bg-stadium-hover rounded" />
            </div>
            <div className="h-8 w-20 bg-stadium-hover rounded" />
        </div>
    );
}

function SkeletonTable() {
    return (
        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 animate-pulse">
            <div className="h-5 w-40 bg-stadium-hover rounded mb-4" />
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 items-center">
                        <div className="h-4 w-8 bg-stadium-hover rounded" />
                        <div className="h-4 flex-1 bg-stadium-hover rounded" />
                        <div className="h-4 w-16 bg-stadium-hover rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Top Movies Section Component
function TopMoviesSection() {
    const { data: topMovies } = useSWR("/api/movies?isPublished=true&limit=10&sort=views", fetcher);

    if (!topMovies) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Film size={18} className="text-accent-gold" />
                    <h3 className="font-bold">Top Movies By Views</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-8 w-8 border-4 border-text-muted border-t-accent-green rounded-full"
                    />
                </div>
            </motion.div>
        );
    }

    const movieList = topMovies?.movies || topMovies || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-stadium-elevated border border-border-strong rounded-xl p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Film size={18} className="text-accent-gold" />
                    <h3 className="font-bold">Top Movies By Views</h3>
                </div>
                <Link
                    href="/kism/movies"
                    className="text-sm text-accent-green hover:underline"
                >
                    View All
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-text-muted text-xs uppercase border-b border-border-subtle">
                            <th className="pb-3 font-semibold">Rank</th>
                            <th className="pb-3 font-semibold">Movie</th>
                            <th className="pb-3 font-semibold">Views</th>
                            <th className="pb-3 font-semibold">Category</th>
                            <th className="pb-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {movieList.slice(0, 10).map((movie: any, index: number) => (
                            <tr key={movie._id} className="hover:bg-white/5">
                                <td className="py-3">
                                    <span className={`font-bold ${index < 3 ? 'text-accent-gold' : 'text-text-muted'}`}>
                                        #{index + 1}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <Link href={`/kism/movies/${movie._id}`} className="flex items-center gap-3 hover:text-accent-green transition-colors">
                                        {movie.posterUrl && (
                                            <img
                                                src={movie.posterUrl}
                                                alt={movie.title}
                                                className="w-10 h-14 object-cover rounded"
                                            />
                                        )}
                                        <div>
                                            <div className="font-semibold line-clamp-1">{movie.title}</div>
                                            <div className="text-xs text-text-muted">{movie.releaseDate?.split("-")[0]}</div>
                                        </div>
                                    </Link>
                                </td>
                                <td className="py-3">
                                    <span className="flex items-center gap-1 text-accent-green font-bold">
                                        <Eye size={14} />
                                        {(movie.views || 0).toLocaleString()}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <span className="text-xs text-text-secondary capitalize">
                                        {movie.category?.replace(/-/g, ' ') || 'Uncategorized'}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${movie.isPublished ? "bg-accent-green/20 text-accent-green" : "bg-text-muted/20 text-text-muted"}`}>
                                        {movie.isPublished ? "Published" : "Draft"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {movieList.length === 0 && (
                    <div className="text-center py-8 text-text-muted">
                        <Film size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No movies yet</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}


export default function AdminDashboard() {
    const { data: matchData, mutate: mutateMatches } = useSWR("/api/matches", fetcher);
    const { data: postData, mutate: mutatePosts } = useSWR("/api/posts", fetcher);
    const { data: codeStats, mutate: mutateCodes } = useSWR("/api/redemptions?stats=true", fetcher);
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { data: analyticsStats, mutate: mutateAnalytics } = useSWR("/api/analytics/dashboard", fetcher);
    const { data: moviesData, mutate: mutateMovies } = useSWR("/api/movies?isPublished=true&pageSize=1000", fetcher);
    const { data: seriesData, mutate: mutateSeries } = useSWR("/api/series", fetcher);
    const { data: pushStats, mutate: mutatePush } = useSWR("/api/push/subscriptions", fetcher);

    const [refreshing, setRefreshing] = useState(false);

    const isLoading = !matchData && !postData && !codeStats;
    const matches = matchData || [];
    const posts = Array.isArray(postData) ? postData : postData?.posts || [];
    const moviesList = moviesData?.movies || moviesData || [];
    const seriesList = Array.isArray(seriesData) ? seriesData : seriesData?.series || [];

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            mutateMatches(),
            mutatePosts(),
            mutateCodes(),
            mutateAnalytics(),
            mutateMovies(),
            mutateSeries(),
            mutatePush(),
        ]);
        setRefreshing(false);
    };

    // Include movie views in total
    const matchViews = matches.reduce((acc: number, m: any) => acc + (m.views || 0), 0);
    const postViews = posts.reduce((acc: number, p: any) => acc + (p.views || 0), 0);
    const movieViews = moviesList.reduce((acc: number, m: any) => acc + (m.views || 0), 0);
    const totalViews = matchViews + postViews + movieViews;

    const stats = [
        { label: "Movies", value: moviesData ? moviesList.length : "-", icon: Film, color: "text-accent-gold" },
        { label: "Series", value: seriesData ? seriesList.length : "-", icon: Tv, color: "text-purple-400" },
        { label: "Total Views", value: (matchData || moviesData) ? totalViews : "-", icon: Eye, color: "text-accent-green" },
        { label: "Matches", value: matchData ? matches.length : "-", icon: PlayCircle, color: "text-accent-blue" },
        { label: "Live Now", value: matchData ? matches.filter((m: any) => m.status === "live").length : "-", icon: PlayCircle, color: "text-accent-red" },
        { label: "Blog Posts", value: postData ? posts.length : "-", icon: FileText, color: "text-pink-400" },
        { label: "Push Subs", value: pushStats ? (pushStats.activeCount || 0) : "-", icon: Users, color: "text-blue-400" },
    ];

    // Use real analytics data or fallback to zeros (not fake data)
    const viewsData = analyticsStats?.dailyBreakdown?.map((d: any) => {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const date = new Date(d.date);
        return {
            date: dayNames[date.getDay()],
            views: d.views,
            users: Math.floor(d.views * 0.15),
        };
    }) || [
            { date: "Mon", views: 0, users: 0 },
            { date: "Tue", views: 0, users: 0 },
            { date: "Wed", views: 0, users: 0 },
            { date: "Thu", views: 0, users: 0 },
            { date: "Fri", views: 0, users: 0 },
            { date: "Sat", views: 0, users: 0 },
            { date: "Sun", views: 0, users: 0 },
        ];

    const topContent = analyticsStats?.topPageTypes?.map((p: any) => ({
        name: p.type.charAt(0).toUpperCase() + p.type.slice(1),
        views: p.views,
    })) || [
            { name: "Home", views: 0 },
            { name: "Movie", views: movieViews },
            { name: "Series", views: 0 },
            { name: "Match", views: matchViews },
            { name: "Live", views: 0 },
        ];

    const subscriptionData = [
        { name: "Premium (Redeemed)", value: codeStats?.used || 0, color: "#F59E0B" },
        { name: "Codes Available", value: codeStats?.available || 0, color: "#22C55E" },
        { name: "Push Subscribers", value: pushStats?.activeCount || 0, color: "#3B82F6" },
        { name: "Push Inactive", value: pushStats?.inactiveCount || 0, color: "#6B7280" },
    ];

    // Calculate percentage change
    const getPercentChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const todayVsYesterday = analyticsStats ? getPercentChange(analyticsStats.today, analyticsStats.yesterday) : 0;

    const handleSeedAnalytics = async () => {
        await fetch("/api/analytics/seed", { method: "POST" });
        mutateAnalytics();
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-black text-white">DASHBOARD</h1>
                    <p className="text-text-muted">Aragtida guud ee Fanbroj</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-stadium-elevated border border-border-strong rounded-lg text-sm font-semibold hover:bg-stadium-hover transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing..." : "Refresh Data"}
                </button>
            </motion.div>

            {/* Page Views Analytics Cards */}
            {!analyticsStats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-stadium-elevated border border-border-strong rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-muted text-sm">Today</span>
                            <Clock size={16} className="text-accent-green" />
                        </div>
                        <div className="text-2xl font-black text-white">
                            {(analyticsStats.today || 0).toLocaleString()}
                        </div>
                        {todayVsYesterday !== 0 && (
                            <div className={`flex items-center gap-1 text-xs mt-1 ${todayVsYesterday >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                                {todayVsYesterday >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                {Math.abs(todayVsYesterday)}% vs yesterday
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-stadium-elevated border border-border-strong rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-muted text-sm">Yesterday</span>
                            <Calendar size={16} className="text-accent-blue" />
                        </div>
                        <div className="text-2xl font-black text-white">
                            {(analyticsStats.yesterday || 0).toLocaleString()}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-stadium-elevated border border-border-strong rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-muted text-sm">Last 7 Days</span>
                            <BarChart3 size={16} className="text-purple-400" />
                        </div>
                        <div className="text-2xl font-black text-white">
                            {(analyticsStats.lastWeek || 0).toLocaleString()}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-stadium-elevated border border-border-strong rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-muted text-sm">This Month</span>
                            <TrendingUp size={16} className="text-accent-gold" />
                        </div>
                        <div className="text-2xl font-black text-white">
                            {(analyticsStats.thisMonth || 0).toLocaleString()}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-stadium-elevated border border-border-strong rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-muted text-sm">Last Month</span>
                            <Layers size={16} className="text-accent-red" />
                        </div>
                        <div className="text-2xl font-black text-white">
                            {(analyticsStats.lastMonth || 0).toLocaleString()}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Stats Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    {stats.map((stat, i) => (
                        <StatsCard key={i} {...stat} index={i} />
                    ))}
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ViewsChart data={viewsData} title="Views This Week" />
                <TopContentChart data={topContent} title="Top Page Types" />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subscription Stats */}
                <SubscriptionChart data={subscriptionData} title="Users & Subscriptions" />

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
                            { href: "/kism/hero", icon: ImageIcon, label: "Hero Slider", iconClass: "text-accent-gold", hoverClass: "hover:bg-yellow-500/20" },
                            { href: "/kism/matches/new", icon: PlayCircle, label: "Add Match", iconClass: "text-accent-green", hoverClass: "hover:bg-green-500/20" },
                            { href: "/kism/movies/new", icon: Film, label: "Add Movie", iconClass: "text-accent-blue", hoverClass: "hover:bg-blue-500/20" },
                            { href: "/kism/series/new", icon: Tv, label: "Add Series", iconClass: "text-purple-400", hoverClass: "hover:bg-purple-500/20" },
                            { href: "/kism/shorts", icon: PlayCircle, label: "Shorts", iconClass: "text-accent-red", hoverClass: "hover:bg-red-500/20" },
                            { href: "/kism/codes", icon: Ticket, label: "Codes", iconClass: "text-blue-400", hoverClass: "hover:bg-blue-400/20" },
                        ].map((action) => (
                            <motion.div
                                key={action.href}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link
                                    href={action.href}
                                    className={`p-4 bg-stadium-hover rounded-xl text-center ${action.hoverClass} transition-colors block`}
                                >
                                    <action.icon size={24} className={`mx-auto mb-2 ${action.iconClass}`} />
                                    <span className="text-sm font-semibold">{action.label}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                    {/* Seed Analytics Button */}
                    {(!analyticsStats || analyticsStats.today === 0) && (
                        <button
                            onClick={handleSeedAnalytics}
                            className="w-full mt-4 py-2 bg-accent-green/20 text-accent-green rounded-lg text-sm font-semibold hover:bg-accent-green/30 transition-colors"
                        >
                            Generate Sample Analytics Data
                        </button>
                    )}
                </motion.div>
            </div>

            {/* Top Movies By Views */}
            <TopMoviesSection />

            {/* Recent Blog Posts */}
            {!postData ? (
                <SkeletonTable />
            ) : (
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
                            href="/kism/blog"
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
                                            {new Date(post.createdAt || post._creationTime).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
