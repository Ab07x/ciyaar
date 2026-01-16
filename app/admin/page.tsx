"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlayCircle, Calendar, Lock, Users, FileText, Ticket, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
    const matches = useQuery(api.matches.listMatches, {});
    const posts = useQuery(api.posts.listPosts, {});
    const codeStats = useQuery(api.redemptions.getCodeStats);
    const settings = useQuery(api.settings.getSettings);

    if (!matches || !posts || !codeStats) {
        return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div></div>;
    }

    const stats = [
        { label: "Total Matches", value: matches.length, icon: PlayCircle, color: "text-blue-500" },
        { label: "Live Now", value: matches.filter(m => m.status === "live").length, icon: PlayCircle, color: "text-accent-red" },
        { label: "Upcoming", value: matches.filter(m => m.status === "upcoming").length, icon: Calendar, color: "text-accent-green" },
        { label: "Premium", value: matches.filter(m => m.isPremium).length, icon: Lock, color: "text-accent-gold" },
        { label: "Total Views", value: matches.reduce((acc, m) => acc + (m.views || 0), 0) + posts.reduce((acc, p) => acc + (p.views || 0), 0), icon: TrendingUp, color: "text-accent-green" },
        { label: "Blog Posts", value: posts.length, icon: FileText, color: "text-purple-400" },
        { label: "Active Codes", value: codeStats.available, icon: Ticket, color: "text-blue-400" },
    ];

    return (
        <div className="space-y-8">
            <div><h1 className="text-3xl font-black">DASHBOARD</h1><p className="text-text-muted">Aragtida guud ee Fanbroj</p></div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-stadium-elevated border border-border-strong p-4 rounded-xl">
                        <div className={`p-2 rounded-lg bg-stadium-hover ${stat.color} inline-block mb-2`}><stat.icon size={20} /></div>
                        <div className="text-2xl font-black">{stat.value}</div>
                        <div className="text-xs text-text-muted uppercase">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><PlayCircle size={18} className="text-accent-red" />Live Now</h3>
                    <div className="space-y-3">
                        {matches.filter(m => m.status === "live").length > 0 ? (
                            matches.filter(m => m.status === "live").slice(0, 5).map((m: any) => (
                                <div key={m._id} className="flex items-center justify-between p-3 bg-stadium-hover rounded-xl">
                                    <div><div className="font-bold text-sm">{m.title}</div><div className="text-xs text-text-muted">{m.leagueName}</div></div>
                                    <span className="px-2 py-1 bg-accent-red/20 text-accent-red text-xs font-bold rounded">LIVE</span>
                                </div>
                            ))
                        ) : <p className="text-text-muted text-sm">Ma jiraan ciyaaro live ah</p>}
                    </div>
                </div>

                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h3 className="font-bold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/admin/matches/new" className="p-4 bg-stadium-hover rounded-xl text-center hover:bg-accent-green/20">
                            <PlayCircle size={24} className="mx-auto mb-2 text-accent-green" /><span className="text-sm">Add Match</span>
                        </Link>
                        <Link href="/admin/import" className="p-4 bg-stadium-hover rounded-xl text-center hover:bg-blue-500/20">
                            <TrendingUp size={24} className="mx-auto mb-2 text-blue-400" /><span className="text-sm">Import</span>
                        </Link>
                        <Link href="/admin/codes" className="p-4 bg-stadium-hover rounded-xl text-center hover:bg-purple-500/20">
                            <Ticket size={24} className="mx-auto mb-2 text-purple-400" /><span className="text-sm">Codes</span>
                        </Link>
                        <Link href="/admin/blog/new" className="p-4 bg-stadium-hover rounded-xl text-center hover:bg-accent-gold/20">
                            <FileText size={24} className="mx-auto mb-2 text-accent-gold" /><span className="text-sm">New Post</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
