"use client";

/**
 * ReferralWidget
 * Lets premium users share their referral link and see their earnings.
 * Shows: referral link + copy button, count of referred friends, bonus days earned.
 *
 * Usage: <ReferralWidget userId={userId} /> — show in account/profile page
 */

import { useState, useEffect } from "react";
import { Copy, Check, Gift, Users, Share2 } from "lucide-react";

interface Props {
    userId: string;
}

interface ReferralStats {
    code: string | null;
    referralCount: number;
    bonusDaysEarned: number;
}

const SITE_URL = "https://fanbroj.net";

export default function ReferralWidget({ userId }: Props) {
    const [stats, setStats]       = useState<ReferralStats | null>(null);
    const [loading, setLoading]   = useState(true);
    const [copied, setCopied]     = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (!userId) return;
        fetch(`/api/offers/referral?userId=${encodeURIComponent(userId)}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setStats(d); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId]);

    const generateCode = async () => {
        setGenerating(true);
        try {
            const res = await fetch("/api/offers/referral", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate", userId }),
            });
            const data = await res.json();
            if (data.code) setStats(prev => ({ ...(prev ?? { referralCount: 0, bonusDaysEarned: 0 }), code: data.code }));
        } catch {/* */} finally { setGenerating(false); }
    };

    const referralUrl = stats?.code ? `${SITE_URL}?ref=${stats.code}` : null;

    const handleCopy = async () => {
        if (!referralUrl) return;
        await navigator.clipboard.writeText(referralUrl).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!referralUrl) return;
        const shareData = {
            title: "Fanbroj Premium",
            text: "Daawo filimada iyo ciyaarka aduunka Premium-ka Fanbroj! Isticmaal linkigan gaar ah:",
            url: referralUrl,
        };
        if (navigator.share) {
            await navigator.share(shareData).catch(() => {});
        } else {
            handleCopy();
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse h-32" />
        );
    }

    return (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-yellow-400" />
                <div>
                    <p className="font-black text-yellow-400">Referral Program</p>
                    <p className="text-xs text-gray-400">
                        Saaxiib keentid → hel <span className="text-white font-bold">30 maalmood bilaash</span> mid kasta
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-xl p-3 text-center">
                    <Users className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                    <p className="text-2xl font-black text-white">{stats?.referralCount ?? 0}</p>
                    <p className="text-[10px] text-gray-400">Saaxiib la keenay</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center">
                    <Gift className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <p className="text-2xl font-black text-white">{stats?.bonusDaysEarned ?? 0}</p>
                    <p className="text-[10px] text-gray-400">Maalmood la helay</p>
                </div>
            </div>

            {/* Referral link */}
            {stats?.code ? (
                <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-semibold">Linkigaaga gaar ah:</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/40 rounded-xl px-3 py-2.5 text-xs text-gray-300 font-mono truncate border border-white/10">
                            {referralUrl}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex-shrink-0"
                            aria-label="Copy link"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 text-sm transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        U SAAR SAAXIIBADA
                    </button>
                    <p className="text-center text-[10px] text-gray-600">
                        Marka saaxiibku bilaabaa Premium — waxaad helaysaa 30 maalmood bilaash
                    </p>
                </div>
            ) : (
                <button
                    onClick={generateCode}
                    disabled={generating}
                    className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 text-sm transition-colors disabled:opacity-60"
                >
                    {generating ? "La sameynayaa..." : "SAMEE REFERRAL LINK"}
                </button>
            )}
        </div>
    );
}
