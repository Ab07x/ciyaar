"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import { Check, X, MessageSquare, Sparkles, Shield, Zap, Crown } from "lucide-react";
import Link from "next/link";
import { PricingCards } from "@/components/PricingCards";

const plans = [
    {
        id: "match",
        name: "Ciyaar Keliya",
        description: "Ciyaar hal mar",
        icon: Zap,
        color: "text-blue-400",
        features: ["Ciyaar 1 kaliya", "Ad-free experience", "HD streaming"],
    },
    {
        id: "weekly",
        name: "Usbuuclaha",
        description: "7 maalmood",
        icon: Sparkles,
        color: "text-purple-400",
        features: ["Dhammaan ciyaaraha", "Ad-free experience", "HD streaming", "2 qalabood"],
        popular: false,
    },
    {
        id: "monthly",
        name: "Bishiiba",
        description: "30 maalmood",
        icon: Crown,
        color: "text-accent-gold",
        features: ["Dhammaan ciyaaraha", "Ad-free experience", "HD streaming", "3 qalabood", "Priority support"],
        popular: true,
    },
    {
        id: "yearly",
        name: "Sannadkiiba",
        description: "365 maalmood",
        icon: Shield,
        color: "text-accent-green",
        features: ["Dhammaan ciyaaraha", "Ad-free experience", "4K streaming", "5 qalabood", "Priority support", "Best value!"],
    },
];

const freeVsPremium = [
    { feature: "Ads", free: "Aad u badan", premium: "Maya" },
    { feature: "Ciyaaraha Premium", free: "Maya", premium: "Haa" },
    { feature: "HD Quality", free: "720p", premium: "1080p/4K" },
    { feature: "Buffer time", free: "Dheer", premium: "Gaaban" },
    { feature: "Support", free: "Basic", premium: "Priority" },
];

export default function PricingPage() {
    const settings = useQuery(api.settings.getSettings);
    const { deviceId, redeemCode } = useUser();
    const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
    const [code, setCode] = useState("");
    const [redemptionResult, setRedemptionResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const getPriceDisplay = (planId: string) => {
        if (!settings) return "...";
        switch (planId) {
            case "match": return `$${settings.priceMatch}`;
            case "weekly": return `$${settings.priceWeekly}`;
            case "monthly": return `$${settings.priceMonthly}`;
            case "yearly": return `$${settings.priceYearly}`;
            default: return "...";
        }
    };

    const getWhatsAppLink = () => {
        if (!settings) return "#";
        const plan = plans.find(p => p.id === selectedPlan);
        const message = `Waxaan rabaa inaan iibsado ${plan?.name} (${getPriceDisplay(selectedPlan)}). Device ID: ${deviceId}`;
        return `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    };

    const handleRedeem = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setRedemptionResult(null);

        try {
            const result = await redeemCode(code.trim());
            setRedemptionResult(result);
            if (result.success) {
                setCode("");
            }
        } catch (error) {
            setRedemptionResult({ success: false, error: "Wax qalad ah ayaa dhacay" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stadium-dark">
            {/* Hero */}
            <section className="py-16 md:py-24 text-center">
                <div className="container mx-auto px-4">
                    <div className="inline-flex items-center gap-2 bg-accent-gold/20 text-accent-gold px-4 py-2 rounded-full text-sm font-bold mb-6">
                        <Crown size={16} />
                        PREMIUM
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6">
                        Ku Raaxayso <span className="text-accent-green">Ad-Free</span>
                    </h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Ciyaaraha ugu xiisaha badan dunida, bilaa xayeysiis, HD quality
                    </p>
                </div>
            </section>

            {/* Plans Grid */}
            <PricingCards />

            {/* CTA Section */}
            <section className="py-16 bg-stadium-elevated border-y border-border-strong">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        {/* WhatsApp CTA */}
                        <div className="bg-green-600/20 border border-green-600/30 rounded-2xl p-8 text-center mb-8">
                            <MessageSquare size={48} className="text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Iibso WhatsApp-ka</h3>
                            <p className="text-text-secondary mb-6">
                                Nala soo xiriir si aad u hesho code-kaaga premium
                            </p>
                            <a
                                href={getWhatsAppLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors"
                            >
                                <MessageSquare size={24} />
                                WhatsApp
                            </a>
                        </div>

                        {/* EVC Instructions */}
                        <div className="bg-stadium-dark border border-border-subtle rounded-2xl p-8 mb-8">
                            <h3 className="text-xl font-bold mb-4">Sida loo bixiyo EVC</h3>
                            <ol className="space-y-3 text-text-secondary">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-accent-green text-black rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                    <span>Fur EVC Plus app-kaaga</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-accent-green text-black rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                    <span>Dooro &ldquo;Send Money&rdquo;</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-accent-green text-black rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                    <span>Gali lambarka: <strong className="text-accent-green">{settings?.whatsappNumber || "..."}</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-accent-green text-black rounded-full flex items-center justify-center text-sm font-bold">4</span>
                                    <span>Noo soo dir screenshot-ka WhatsApp</span>
                                </li>
                            </ol>
                        </div>

                        {/* Redeem Code */}
                        <div className="bg-stadium-dark border border-border-subtle rounded-2xl p-8">
                            <h3 className="text-xl font-bold mb-4">Haysataa Code?</h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="ABCD1234"
                                    className="flex-1 bg-stadium-elevated border border-border-subtle rounded-xl px-4 py-3 text-white uppercase tracking-wider focus:outline-none focus:border-accent-green"
                                />
                                <button
                                    onClick={handleRedeem}
                                    disabled={loading || !code.trim()}
                                    className="bg-accent-green text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                                >
                                    {loading ? "..." : "Redeem"}
                                </button>
                            </div>

                            {redemptionResult && (
                                <div className={`mt-4 p-4 rounded-xl ${redemptionResult.success
                                    ? "bg-accent-green/20 text-accent-green"
                                    : "bg-accent-red/20 text-accent-red"
                                    }`}>
                                    {redemptionResult.success ? redemptionResult.message : redemptionResult.error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Free vs Premium Comparison */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-black text-center mb-12">FREE vs PREMIUM</h2>

                    <div className="max-w-2xl mx-auto overflow-hidden rounded-2xl border border-border-strong">
                        <div className="grid grid-cols-3 bg-stadium-elevated border-b border-border-strong">
                            <div className="p-4 font-bold">Feature</div>
                            <div className="p-4 font-bold text-center border-x border-border-strong">Free</div>
                            <div className="p-4 font-bold text-center text-accent-gold">Premium</div>
                        </div>

                        {freeVsPremium.map((row, i) => (
                            <div key={i} className="grid grid-cols-3 border-b border-border-subtle last:border-0">
                                <div className="p-4 text-text-secondary">{row.feature}</div>
                                <div className="p-4 text-center border-x border-border-subtle">
                                    {row.free === "Maya" ? (
                                        <X size={18} className="text-accent-red mx-auto" />
                                    ) : (
                                        <span className="text-text-muted">{row.free}</span>
                                    )}
                                </div>
                                <div className="p-4 text-center">
                                    {row.premium === "Haa" ? (
                                        <Check size={18} className="text-accent-green mx-auto" />
                                    ) : (
                                        <span className="text-accent-green font-bold">{row.premium}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Back to Home */}
            <section className="py-8 text-center">
                <Link
                    href="/"
                    className="text-text-muted hover:text-white transition-colors"
                >
                    ← Ku laabo TV Guide
                </Link>
            </section>
        </div>
    );
}
