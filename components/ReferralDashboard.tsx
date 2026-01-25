"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import { Share2, Users, TrendingUp, Copy, Check, Gift } from "lucide-react";
import { useState } from "react";

export function ReferralDashboard() {
    const { userId } = useUser();
    const analytics = useQuery(api.referrals.getReferralAnalytics,
        userId ? { userId } : "skip"
    );
    const [copied, setCopied] = useState(false);

    if (!analytics) {
        return (
            <div className="bg-stadium-elevated border border-border-subtle rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-stadium-hover rounded w-1/3 mb-4" />
                <div className="h-20 bg-stadium-hover rounded" />
            </div>
        );
    }

    const referralLink = `https://fanbroj.net/?ref=${analytics.referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Share2 className="text-white" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">Noo Gudbi Saaxiibo</h3>
                    <p className="text-sm text-blue-300">Hel 3 maalmood Premium free per referral</p>
                </div>
            </div>

            {/* Referral Link */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-xs text-text-muted uppercase font-bold mb-2">Link-kaaga</p>
                <div className="flex items-center gap-2">
                    <code className="flex-1 text-white text-sm bg-white/5 px-3 py-2 rounded-lg truncate">
                        {referralLink}
                    </code>
                    <button
                        onClick={handleCopy}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-white">{analytics.totalClicks}</div>
                    <div className="text-xs text-text-muted uppercase">Clicks</div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-accent-green">{analytics.conversions}</div>
                    <div className="text-xs text-text-muted uppercase">Sign-ups</div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-blue-400">{analytics.conversionRate}</div>
                    <div className="text-xs text-text-muted uppercase">Rate</div>
                </div>
            </div>

            {/* Earnings */}
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Gift className="text-accent-green" size={24} />
                    <div>
                        <p className="text-sm text-text-muted">Total Earned</p>
                        <p className="text-xl font-black text-accent-green">{analytics.referralEarnings} maalmood</p>
                    </div>
                </div>
                <TrendingUp className="text-accent-green" size={32} />
            </div>

            {/* Last 7 Days */}
            <div className="mt-4 text-center text-sm text-text-muted">
                <span className="text-white font-bold">{analytics.last7Days.clicks}</span> clicks &
                <span className="text-accent-green font-bold ml-1">{analytics.last7Days.conversions}</span> sign-ups 7-dii maalmood ee la soo dhaafay
            </div>
        </div>
    );
}
