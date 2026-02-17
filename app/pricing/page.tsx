"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { Shield, Crown, MessageCircle, Gift, Film, Tv, Users, Star, Check, ShieldCheck, Zap, Smartphone, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PricingCards } from "@/components/PricingCards";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const FAQ_ITEMS = [
    {
        q: "Sidee ayaan lacagta u bixiyaa?",
        a: "Waxaad ku bixi kartaa EVC Plus, eDahab, Zaad, Sahal, Card, ama Apple Pay. Lacag-bixintu waa degdeg oo ammaan ah.",
    },
    {
        q: "Goorma ayuu Premium-ku ii shaqeynayaa?",
        a: "Isla markiiba marka lacagta la xaqiijiyo. Badanaa waa 1-2 daqiiqo gudahood.",
    },
    {
        q: "Ma isticmaali karaa qalab ka badan mid?",
        a: "Haa! Monthly waxaad ku isticmaali kartaa 3 qalab, Yearly-na 5 qalab. Weekly 2, Single Match 1.",
    },
];

export default function PricingPage() {
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { deviceId, userId, redeemCode, isPremium } = useUser();
    const [code, setCode] = useState("");
    const [redemptionResult, setRedemptionResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const hasTracked = useRef(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Track page view
    useEffect(() => {
        if (!hasTracked.current) {
            hasTracked.current = true;
            fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "pageview", pageType: "pricing", date: new Date().toISOString().split("T")[0] }),
            }).catch(() => {});
        }
    }, []);

    const handleRedeem = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setRedemptionResult(null);
        try {
            const result = await redeemCode(code.trim());
            setRedemptionResult(result);
            if (result.success) {
                setCode("");
                setTimeout(() => window.location.assign("/"), 800);
            }
        } catch {
            setRedemptionResult({ success: false, error: "Wax qalad ah ayaa dhacay" });
        } finally {
            setLoading(false);
        }
    };

    const monthlyPrice = Number(settings?.priceMonthly) || 3.2;
    const yearlyPrice = Number(settings?.priceYearly) || 11.99;
    const yearlyPerMonth = (yearlyPrice / 12).toFixed(2);
    const yearlySaving = (monthlyPrice * 12 - yearlyPrice).toFixed(2);

    return (
        <div className="min-h-screen relative">
            {/* Background */}
            <div className="fixed inset-0 -z-10 bg-[#0a0e17]">
                <Image src="/img/icons/background.png" alt="" fill className="object-cover opacity-30" priority />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17]/50 via-[#0a0e17]/80 to-[#0a0e17]" />
            </div>

            {/* Hero */}
            <section className="py-16 md:py-24 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl xl:text-6xl font-black mb-4 leading-tight">
                        Daawo Filim & Sports Live<br />
                        <span className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">Bilaa Xayeysiis</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                        724+ filim AF Somali | Sports Live | HD/4K | Smart TV
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                        <Link
                            href="/pay?plan=monthly&auth=signup"
                            className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563eb] text-white font-black px-8 py-4 rounded-xl transition-all text-lg"
                        >
                            <Shield size={20} />
                            Iibso Monthly
                        </Link>
                        <Link
                            href="/pay?plan=yearly&auth=signup"
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all text-lg"
                        >
                            <Crown size={20} className="text-yellow-400" />
                            Iibso Yearly — Save 69%
                        </Link>
                    </div>

                    {/* Social Proof */}
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-[#3B82F6]" />
                            <span className="text-white font-bold">5,000+</span>
                            <span className="text-gray-500 text-sm">isticmaale</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Film size={18} className="text-green-400" />
                            <span className="text-white font-bold">15+</span>
                            <span className="text-gray-500 text-sm">dal</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className="text-yellow-400" fill="currentColor" />
                            ))}
                            <span className="text-white font-bold ml-1">4.8</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Plan Cards */}
            <PricingCards />

            {/* Yearly Psychology Block */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-8 text-center">
                        <Crown size={32} className="text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-white mb-4">Maxaa Yearly u fiican?</h3>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="text-center">
                                <p className="text-gray-500 text-sm">Yearly</p>
                                <p className="text-3xl font-black text-yellow-400">${yearlyPrice}</p>
                                <p className="text-xs text-gray-400">= ${yearlyPerMonth}/bishii</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-500 text-sm">Monthly x 12</p>
                                <p className="text-3xl font-black text-gray-500">${(monthlyPrice * 12).toFixed(2)}</p>
                                <p className="text-xs text-gray-400">= ${monthlyPrice.toFixed(2)}/bishii</p>
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-6 py-2 rounded-full font-black">
                            <Check size={16} />
                            Badbaadin: ${yearlySaving} sanadkii
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Block */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: ShieldCheck, label: "Lacag-bixin ammaan ah", color: "text-green-400" },
                            { icon: Zap, label: "Activation degdeg ah", color: "text-yellow-400" },
                            { icon: MessageCircle, label: "WhatsApp 24/7", color: "text-[#25D366]" },
                            { icon: Tv, label: "Smart TV + Mobile", color: "text-blue-400" },
                        ].map((item) => (
                            <div key={item.label} className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
                                <item.icon size={28} className={item.color} />
                                <p className="text-sm text-gray-300 font-medium">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How to Buy */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <h3 className="text-2xl font-black text-white text-center mb-8">Sida Loo Iibsado</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { step: "1", title: "Samee Account", desc: "Email + password geli, verification ma jiro." },
                                { step: "2", title: "Dooro Payment", desc: "EVC, eDahab, Zaad, Sahal, Card, Apple Pay." },
                                { step: "3", title: "Bilow Daawashada", desc: "Premium si toos ah ayuu u shaqeeyaa!" },
                            ].map((item) => (
                                <div key={item.step} className="flex flex-col items-center text-center rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                                    <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-black mb-4">{item.step}</div>
                                    <h4 className="font-bold text-white mb-2">{item.title}</h4>
                                    <p className="text-sm text-gray-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-2xl font-black text-white text-center mb-8">Su'aalaha Badanaa La Isweydiiyo</h3>
                        <div className="space-y-3">
                            {FAQ_ITEMS.map((item, i) => (
                                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                                        <span className="font-bold text-white text-sm">{item.q}</span>
                                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                                    </button>
                                    {openFaq === i && (
                                        <div className="px-5 pb-4">
                                            <p className="text-sm text-gray-400">{item.a}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Code Redemption */}
            {!isPremium && (
                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <Gift size={20} className="text-yellow-400" />
                                Haysataa code hadiyad ah?
                            </h3>
                            <p className="text-gray-400 text-sm mb-4">Halkan ku geli code-ka si Premium-ku isla markiiba kuu furmo.</p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="ABCD1234"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white uppercase tracking-wider focus:outline-none focus:border-[#3B82F6]"
                                />
                                <button
                                    onClick={handleRedeem}
                                    disabled={loading || !code.trim()}
                                    className="bg-[#3B82F6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                                >
                                    {loading ? "..." : "Isticmaal"}
                                </button>
                            </div>
                            {redemptionResult && (
                                <div className={`mt-4 p-4 rounded-xl ${redemptionResult.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                    {redemptionResult.success ? redemptionResult.message : redemptionResult.error}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Back to Home */}
            <section className="py-8 text-center">
                <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm">
                    Ku laabo Bogga Hore
                </Link>
            </section>
        </div>
    );
}
