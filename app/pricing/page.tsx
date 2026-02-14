"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { Check, X, Sparkles, Shield, Zap, Crown, ShieldCheck, Moon, Star, MessageCircle, Gift, Film, Tv, Users, Play, Flame } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PricingCards } from "@/components/PricingCards";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const freeVsPremium = [
    { feature: "Xayeysiis (Ads)", free: "Aad u badan ❌", premium: "Maya ✅", premiumGood: true },
    { feature: "Filimada AF Somali", free: "5 kaliya", premium: "724+ dhammaan", premiumGood: true },
    { feature: "Ciyaaraha Premium", free: "Maya", premium: "Haa ✅", premiumGood: true },
    { feature: "Sawirka (Quality)", free: "480p", premium: "1080p / 4K", premiumGood: true },
    { feature: "Sugitaan (Buffer)", free: "Dheer", premium: "Degdeg", premiumGood: true },
    { feature: "Qalab (Devices)", free: "1 kaliya", premium: "Ilaa 5 qalab", premiumGood: true },
    { feature: "WhatsApp Taageero", free: "Maya", premium: "24/7 ✅", premiumGood: true },
    { feature: "Filimada cusub", free: "Sugitaan", premium: "Marka hore", premiumGood: true },
];

function RamadanCountdown() {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const ramadanStart = new Date("2026-02-28T00:00:00").getTime();

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const diff = ramadanStart - now;
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const isRamadan = Date.now() >= ramadanStart;

    return (
        <div className="bg-gradient-to-r from-emerald-900/40 via-green-800/30 to-emerald-900/40 border border-emerald-500/20 rounded-2xl p-6 md:p-8 text-center backdrop-blur-sm mb-8">
            <div className="text-3xl mb-2">🌙</div>
            <h3 className="text-xl md:text-2xl font-black text-yellow-400 mb-1">
                {isRamadan ? "RAMADAN KARIIM!" : "ISU DIYAARI RAMADAN!"}
            </h3>
            <p className="text-sm text-emerald-300 mb-4">
                {isRamadan
                    ? "Ku raaxayso 724+ filim AF Somali — Qiimo yaab leh!"
                    : "Iibso Premium si aad Ramadan ugu raaxaysto 724+ filim AF Somali"}
            </p>
            {!isRamadan && (
                <div className="flex items-center justify-center gap-3 md:gap-5">
                    {[
                        { value: timeLeft.days, label: "Maalmood" },
                        { value: timeLeft.hours, label: "Saacadood" },
                        { value: timeLeft.minutes, label: "Daqiiqo" },
                        { value: timeLeft.seconds, label: "Ilbiriqsi" },
                    ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-black/50 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                                <span className="text-2xl md:text-3xl font-black text-white tabular-nums">
                                    {String(item.value).padStart(2, "0")}
                                </span>
                            </div>
                            <span className="text-[10px] md:text-xs text-emerald-400 mt-1 font-bold uppercase">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PricingPage() {
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { deviceId, redeemCode, isPremium } = useUser();
    const [code, setCode] = useState("");
    const [redemptionResult, setRedemptionResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const hasTracked = useRef(false);
    const [showNotification, setShowNotification] = useState(true);
    const [showExitOffer, setShowExitOffer] = useState(false);
    const [exitOfferAccepted, setExitOfferAccepted] = useState(false);
    const [exitOfferSeen, setExitOfferSeen] = useState(false);

    useEffect(() => {
        if (!hasTracked.current) {
            hasTracked.current = true;
            fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "pageview", pageType: "pricing", date: new Date().toISOString().split("T")[0] }),
            }).catch(() => { });
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const seen = window.sessionStorage.getItem("fanbroj_exit_offer_seen") === "1";
        const accepted = window.sessionStorage.getItem("fanbroj_exit_offer_accepted") === "1";
        setExitOfferSeen(seen);
        setExitOfferAccepted(accepted);
    }, []);

    useEffect(() => {
        if (isPremium || exitOfferSeen) return;

        const onMouseOut = (event: MouseEvent) => {
            const leavingFromTop = event.clientY <= 0;
            if (!leavingFromTop) return;
            setShowExitOffer(true);
            setExitOfferSeen(true);
            if (typeof window !== "undefined") {
                window.sessionStorage.setItem("fanbroj_exit_offer_seen", "1");
            }
        };

        window.addEventListener("mouseout", onMouseOut);
        return () => window.removeEventListener("mouseout", onMouseOut);
    }, [isPremium, exitOfferSeen]);

    const activateExitOffer = () => {
        setExitOfferAccepted(true);
        setShowExitOffer(false);
        if (typeof window !== "undefined") {
            window.sessionStorage.setItem("fanbroj_exit_offer_accepted", "1");
        }
        const monthlyCard = document.getElementById("plan-card-monthly");
        monthlyCard?.scrollIntoView({ behavior: "smooth", block: "center" });
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
        <div className="min-h-screen relative">
            {/* Exit Intent Offer Modal */}
            {showExitOffer && !isPremium && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-yellow-500/40 bg-[#101723] p-6 shadow-2xl">
                        <p className="text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">Special Offer</p>
                        <h2 className="text-2xl font-black text-white mb-2">Sug daqiiqad!</h2>
                        <p className="text-gray-300 mb-5">
                            Hel <span className="text-green-400 font-black">+7 maalmood bilaash</span> marka aad iibsato Monthly maanta 🌙
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={activateExitOffer}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-black font-black hover:brightness-110 transition-all"
                            >
                                Haa, i sii offer-ka
                            </button>
                            <button
                                onClick={() => setShowExitOffer(false)}
                                className="w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                            >
                                Maya, waan ka gudbayaa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Page Background */}
            <div className="fixed inset-0 -z-10">
                <Image
                    src="/img/lm-bg.jpg"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/90 to-black" />
            </div>

            {/* 🔔 STICKY NOTIFICATION BAR - High CTR */}
            {showNotification && !isPremium && (
                <div className="sticky top-0 z-50 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 text-black">
                    <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 justify-center">
                            <Moon size={16} className="animate-pulse" />
                            <p className="text-sm font-bold text-center">
                                🌙 Isu Diyaari Ramadan! Iibso Premium — <span className="underline">724+ filim AF Somali</span> • WhatsApp Support • Xayeysiis la&apos;aan
                            </p>
                            <Flame size={16} className="animate-pulse" />
                        </div>
                        <button
                            onClick={() => setShowNotification(false)}
                            className="ml-2 p-1 hover:bg-black/10 rounded text-black/60 hover:text-black"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Hero */}
            <section className="py-12 md:py-20 text-center relative overflow-hidden">
                {/* Floating Ramadan elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-10 left-[5%] text-5xl opacity-20 animate-pulse">🌙</div>
                    <div className="absolute top-20 right-[10%] text-4xl opacity-15 animate-pulse" style={{ animationDelay: "1s" }}>⭐</div>
                    <div className="absolute bottom-10 left-[20%] text-3xl opacity-10 animate-pulse" style={{ animationDelay: "2s" }}>✨</div>
                    <div className="absolute top-32 left-[60%] text-2xl opacity-10 animate-pulse" style={{ animationDelay: "0.5s" }}>🕌</div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    {/* Ramadan Badge */}
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/30 to-amber-500/20 text-yellow-400 px-5 py-2 rounded-full text-sm font-black mb-6 border border-yellow-500/20 animate-pulse">
                        <Moon size={16} />
                        RAMADAN 2026 SPECIAL
                        <Sparkles size={16} />
                    </div>

                    <h1 className="text-4xl md:text-5xl xl:text-6xl font-black mb-4 leading-tight">
                        <span className="text-yellow-400">🌙 Ramadan</span> ku Raaxayso<br />
                        <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">724+ Filim AF Somali</span>
                    </h1>

                    <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
                        Qoyska oo dhan wada daawashada filimada iyo ciyaaraha —{" "}
                        <span className="text-green-400 font-bold">bilaa xayeysiis</span>,{" "}
                        <span className="text-blue-400 font-bold">HD/4K quality</span>,{" "}
                        <span className="text-yellow-400 font-bold">qiimo yaab leh</span>
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-8">
                        <div className="flex items-center gap-2 text-center">
                            <Film size={20} className="text-green-400" />
                            <div>
                                <p className="text-2xl font-black text-white">724+</p>
                                <p className="text-xs text-gray-400">Filimad</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-center">
                            <Tv size={20} className="text-blue-400" />
                            <div>
                                <p className="text-2xl font-black text-white">100+</p>
                                <p className="text-xs text-gray-400">Ciyaaraha toos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-center">
                            <Users size={20} className="text-yellow-400" />
                            <div>
                                <p className="text-2xl font-black text-white">5000+</p>
                                <p className="text-xs text-gray-400">Macaamiil</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-center">
                            <Star size={20} className="text-yellow-400" fill="currentColor" />
                            <div>
                                <p className="text-2xl font-black text-white">4.8</p>
                                <p className="text-xs text-gray-400">Rating</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ramadan Countdown */}
            <section className="container mx-auto px-4">
                <RamadanCountdown />
            </section>

            {/* Plans Grid */}
            <PricingCards monthlyBonusDays={exitOfferAccepted ? 7 : 0} />

            {/* CTA Section */}
            <section className="py-12 bg-black/60 backdrop-blur-sm border-y border-white/10">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        {/* Secure Payment Badge */}
                        <div className="bg-green-600/10 border border-green-600/20 rounded-2xl p-8 text-center mb-8 backdrop-blur-sm">
                            <ShieldCheck size={48} className="text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Lacag bixin ammaan ah 🔒</h3>
                            <p className="text-text-secondary mb-4">
                                Ku bixi EVC Plus, eDahab, Zaad, Sahal, Card, Apple Pay, ama M-Pesa
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["EVC Plus", "Zaad", "Sahal", "eDahab", "Card", "Apple Pay", "M-Pesa"].map((m) => (
                                    <span key={m} className="text-xs bg-white/10 text-gray-300 px-3 py-1.5 rounded-full">
                                        {m}
                                    </span>
                                ))}
                            </div>
                            {/* M-Pesa Direct Payment */}
                            <div className="mt-4 p-4 bg-green-600/10 border border-green-600/20 rounded-xl text-center">
                                <p className="text-sm text-green-400 font-bold mb-1">📱 M-Pesa Direct</p>
                                <p className="text-lg font-black text-white tracking-wider">0797415296</p>
                                <p className="text-xs text-gray-400 mt-1">Lacagta u dir numbarkaan, kadib naga soo wac WhatsApp</p>
                            </div>
                        </div>

                        {/* Redeem Code - Hidden for premium users */}
                        {!isPremium && (
                            <div className="bg-black/60 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Gift size={20} className="text-yellow-400" />
                                    Haysataa Code?
                                </h3>
                                <p className="text-gray-400 text-sm mb-4">Isticmaal code-kaaga si aad Premium u hesho bilaash!</p>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        placeholder="ABCD1234"
                                        className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white uppercase tracking-wider focus:outline-none focus:border-accent-green"
                                    />
                                    <button
                                        onClick={handleRedeem}
                                        disabled={loading || !code.trim()}
                                        className="bg-accent-green text-black px-6 py-3 rounded-xl font-bold hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? "..." : "Isticmaal"}
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
                        )}
                    </div>
                </div>
            </section>

            {/* Free vs Premium Comparison */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black mb-2">
                            FREE vs <span className="text-yellow-400">PREMIUM</span>
                        </h2>
                        <p className="text-gray-400">Maxaa ku jira Premium? Wax badan!</p>
                    </div>

                    <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm">
                        <div className="grid grid-cols-3 bg-black/80 border-b border-white/10">
                            <div className="p-4 font-bold text-gray-400">Feature</div>
                            <div className="p-4 font-bold text-center border-x border-white/10 text-red-400">
                                <span className="flex items-center justify-center gap-1">
                                    <X size={14} /> Bilaash
                                </span>
                            </div>
                            <div className="p-4 font-bold text-center text-yellow-400">
                                <span className="flex items-center justify-center gap-1">
                                    <Crown size={14} /> Premium
                                </span>
                            </div>
                        </div>

                        {freeVsPremium.map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                                <div className="p-4 text-gray-300 text-sm font-medium">{row.feature}</div>
                                <div className="p-4 text-center border-x border-white/5">
                                    <span className="text-gray-500 text-sm">{row.free}</span>
                                </div>
                                <div className="p-4 text-center">
                                    <span className="text-green-400 font-bold text-sm">{row.premium}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WhatsApp CTA — Only for non-premium */}
            {!isPremium && (
                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-2xl mx-auto bg-gradient-to-r from-[#25D366]/20 to-[#128C7E]/10 border border-[#25D366]/30 rounded-2xl p-8 text-center">
                            <MessageCircle size={40} className="text-[#25D366] mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Su&apos;aalo? Naga soo wac WhatsApp!
                            </h3>
                            <p className="text-gray-300 mb-4">
                                Iibso Premium si aad u hesho <span className="text-[#25D366] font-bold">24/7 WhatsApp taageero degdeg ah</span>
                            </p>
                            <a
                                href="https://wa.me/252618274188?text=Asc%2C%20waxaan%20rabaa%20macluumaad%20ku%20saabsan%20Premium%20%F0%9F%8C%99"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold px-8 py-3 rounded-full text-lg transition-all transform hover:scale-105"
                            >
                                <MessageCircle size={20} fill="white" />
                                WhatsApp — Naga Weydiiso
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* Motivational Section */}
            <section className="py-12 text-center">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        🌙 Ramadan waa waqtiga ugu fiican ee la daawado filimaha qoyska
                    </h2>
                    <p className="text-lg md:text-xl text-gray-300 mb-4">
                        <span className="text-green-400 font-bold italic">724+ filim AF Somali</span> iyo{" "}
                        <span className="text-blue-400 font-bold italic">100+ ciyaaraha toos</span> — Sanad buuxa ku raaxee qoyskaaga
                    </p>
                    <p className="text-xl md:text-2xl text-white font-medium mt-8">
                        Waa ku mahadsan tahay taageeradaada. 💚
                    </p>
                </div>
            </section>

            {/* Back to Home */}
            <section className="py-8 text-center">
                <Link
                    href="/"
                    className="text-text-muted hover:text-white transition-colors inline-flex items-center gap-2"
                >
                    <Play size={14} className="rotate-180" />
                    Ku laabo Bogga Hore
                </Link>
            </section>
        </div>
    );
}
