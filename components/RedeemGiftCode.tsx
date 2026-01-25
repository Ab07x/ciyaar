"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Gift, Check, Loader2, Sparkles, PartyPopper } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

export function RedeemGiftCode() {
    const { userId } = useUser();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; giftDetails?: any } | null>(null);

    const redeemGift = useMutation(api.gifts.redeemGiftCode);
    const giftPreview = useQuery(api.gifts.getGiftByCode, code.length >= 8 ? { code } : "skip");

    const handleRedeem = async () => {
        if (!userId || !code.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await redeemGift({
                code: code.trim(),
                recipientId: userId,
            });
            setResult(res);
            if (res.success) {
                setCode("");
            }
        } catch (error) {
            setResult({ success: false, error: "Wax qalad ah ayaa dhacay" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Gift className="text-purple-400" size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white">Haysataa Hadiyad Code?</h3>
                    <p className="text-sm text-text-muted">Geli halkan si aad u hesho Premium</p>
                </div>
            </div>

            {/* Gift Preview */}
            {giftPreview && !giftPreview.isRedeemed && !giftPreview.isExpired && (
                <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-300 mb-2">
                        <Sparkles size={16} />
                        <span className="font-bold text-sm">Hadiyad La Helay!</span>
                    </div>
                    <p className="text-white font-bold">{giftPreview.durationDays} maalmood Premium</p>
                    {giftPreview.senderMessage && (
                        <p className="text-purple-200 text-sm mt-2 italic">&ldquo;{giftPreview.senderMessage}&rdquo;</p>
                    )}
                </div>
            )}

            <div className="flex gap-3">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="GIFT-XXXXXXXX"
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white uppercase tracking-wider focus:border-purple-500 focus:outline-none font-mono"
                />
                <button
                    onClick={handleRedeem}
                    disabled={loading || !code.trim() || !userId}
                    className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Gift size={18} />}
                    Fur
                </button>
            </div>

            {/* Result */}
            {result && (
                <div className={`mt-4 p-4 rounded-xl ${result.success ? "bg-accent-green/20 border border-accent-green/30" : "bg-accent-red/20 border border-accent-red/30"}`}>
                    {result.success ? (
                        <div className="flex items-center gap-3">
                            <PartyPopper className="text-accent-green" size={24} />
                            <div>
                                <p className="font-bold text-accent-green">{result.message}</p>
                                {result.giftDetails?.senderMessage && (
                                    <p className="text-sm text-white/80 mt-1">&ldquo;{result.giftDetails.senderMessage}&rdquo;</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-accent-red">{result.error}</p>
                    )}
                </div>
            )}
        </div>
    );
}
