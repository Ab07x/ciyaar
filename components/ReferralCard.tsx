"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import { Copy, Gift, MessageCircle, Share2, Users, Check, AlertCircle, Loader2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ReferralCard() {
    const { userId } = useUser();
    const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
    const stats = useQuery(api.referrals.getStats, userId ? { userId } : "skip");
    const leaderboard = useQuery(api.referrals.getLeaderboard, { limit: 5 });
    const createCode = useMutation(api.referrals.createReferralCode);
    const redeemReferral = useMutation(api.referrals.redeemReferral);

    const [isCreating, setIsCreating] = useState(false);
    const [copied, setCopied] = useState(false);

    // Redeem State
    const [redeemCode, setRedeemCode] = useState("");
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemStatus, setRedeemStatus] = useState<{ success: boolean; message: string } | null>(null);

    // Initial Create Code
    const handleCreateCode = async () => {
        if (!user) return;
        setIsCreating(true);
        try {
            await createCode({ userId: user._id });
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopy = () => {
        if (!stats?.code) return;
        navigator.clipboard.writeText(stats.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        if (!stats?.code) return;
        const text = `🎉 Ku hel FREE Premium Fanbroj! 
        
Isticmaal code-kayga: *${stats.code}*
        
Markaad is-diiwaangeliso waxaad helaysaa 3 maalmood oo bilaash ah! 🎁
        
Ku biir halkan: https://fanbroj.net/login`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const handleRedeem = async () => {
        if (!user || !redeemCode) return;
        setIsRedeeming(true);
        setRedeemStatus(null);

        try {
            // Get device ID from local storage or identifier
            let deviceId = localStorage.getItem("deviceId");
            if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem("deviceId", deviceId);
            }

            const result = await redeemReferral({
                userId: user._id,
                code: redeemCode,
                deviceId
            });

            setRedeemStatus(result);
        } catch (error) {
            setRedeemStatus({ success: false, message: "Server error occurred" });
        } finally {
            setIsRedeeming(false);
        }
    };

    if (!user) return null;

    return (
        <div className="bg-gradient-to-br from-green-900/40 to-black border border-green-500/20 rounded-xl p-6 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Gift size={120} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Casuun Saaxiibadaa</h3>
                        <p className="text-sm text-gray-400">U hel 7 casho oo bilaash ah saaxiib kasta!</p>
                    </div>
                </div>

                {/* Main Content */}
                {stats?.code ? (
                    <div className="space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                                <div className="text-2xl font-black text-white">{stats.count || 0}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold">Saaxiibada ku soo biiray</div>
                            </div>
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                                <div className="text-2xl font-black text-green-400">{stats.earnings || 0}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold">Maalmaha aad heshay</div>
                            </div>
                        </div>

                        {/* Code Display */}
                        <div className="bg-black/60 rounded-xl p-4 border border-green-500/30 flex items-center justify-between group">
                            <div>
                                <div className="text-xs text-green-500 font-bold mb-1 uppercase tracking-wider">Code-kaaga Casuumaadda</div>
                                <div className="text-2xl font-mono font-black text-white tracking-widest">{stats.code}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                >
                                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                </button>
                                <button
                                    onClick={handleShareWhatsApp}
                                    className="p-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors shadow-lg shadow-green-900/20"
                                >
                                    <MessageCircle size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Share Button (Mobile friendly) */}
                        <button
                            onClick={handleShareWhatsApp}
                            className="w-full py-3 bg-green-600 font-bold text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Share2 size={18} />
                            Kula wadaag WhatsApp
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-gray-400 mb-6 text-sm">
                            Abuur code-kaaga casuumaadda oo bilow inaad hesho maalmo premium ah oo bilaash ah hadda!
                        </p>
                        <button
                            onClick={handleCreateCode}
                            disabled={isCreating}
                            className="w-full py-3 bg-green-600 font-bold text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {isCreating ? <Loader2 className="animate-spin" /> : "Bilow inaad hesho abaalmarino"}
                        </button>
                    </div>
                )}



                {/* Leaderboard Section */}
                <div className="mt-8 pt-6 border-t border-white/10">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                        <Trophy size={14} className="text-yellow-500" />
                        Kuwa ugu guulaha badan
                    </h4>
                    {leaderboard ? (
                        <div className="space-y-2">
                            {leaderboard.map((u: any, i: number) => (
                                <div key={u.userId} className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-black w-5 text-center ${i === 0 ? 'text-yellow-500 text-lg' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-700' : 'text-gray-600'}`}>
                                            {i + 1}
                                        </span>
                                        <span className="text-white font-medium">{u.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} className="text-gray-500" />
                                        <span className="text-green-400 font-bold">{u.count}</span>
                                    </div>
                                </div>
                            ))}
                            {leaderboard.length === 0 && (
                                <p className="text-xs text-gray-500 italic text-center py-2">
                                    Noqo qofka ugu horeeya ee halkan ka soo muuqda!
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="h-20 animate-pulse bg-white/5 rounded-lg" />
                    )}
                </div>

                {/* Redeem Section (Only if not referred) */}
                {!user.referredBy && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h4 className="text-sm font-bold text-white mb-3">Ma haysataa code saaxiibkaa kuu soo diray?</h4>
                        <div className="flex gap-2">
                            <input
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                                placeholder="GALI CODE-KA"
                                className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 font-mono text-white placeholder:text-gray-600 focus:border-green-500 outline-none"
                            />
                            <button
                                onClick={handleRedeem}
                                disabled={!redeemCode || isRedeeming}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg disabled:opacity-50"
                            >
                                {isRedeeming ? <Loader2 size={18} className="animate-spin" /> : "Isticmaal"}
                            </button>
                        </div>

                        {/* Status Message */}
                        <AnimatePresence>
                            {redeemStatus && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-3 p-3 rounded-lg text-sm font-bold flex items-center gap-2 ${redeemStatus.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                        }`}
                                >
                                    {redeemStatus.success ? <Check size={16} /> : <AlertCircle size={16} />}
                                    {redeemStatus.message}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
