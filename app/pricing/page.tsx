"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Check, Tv, Play, Download, Smartphone, Film, Star, Crown, Monitor, Headphones, Zap } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/providers/UserProvider";
import { PLAN_CARDS, PLAN_OPTIONS, getPlanPrice } from "@/lib/plans";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const WHAT_YOU_GET = [
    { icon: Tv, label: "Unlimited watching" },
    { icon: Play, label: "No quality restrictions" },
    { icon: Download, label: "Direct Downloads" },
    { icon: Smartphone, label: "Android APP" },
    { icon: Film, label: "724+ Films & Musalsal" },
    { icon: Star, label: "Personal Favorites" },
    { icon: Crown, label: "No Ads" },
    { icon: Monitor, label: "Access from 5 devices" },
    { icon: Headphones, label: "VIP Support" },
    { icon: Zap, label: "Instant Activation" },
];

export default function PricingPage() {
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { isPremium } = useUser();
    const router = useRouter();
    const hasTracked = useRef(false);

    // Track page view
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

    const handleSelectPlan = (planId: string) => {
        router.push(`/pay?plan=${planId}&auth=signup`);
    };

    return (
        <div className="min-h-screen relative overflow-hidden text-white font-sans selection:bg-[#3B82F6] selection:text-white pb-32">
            {/* Background */}
            <div className="fixed inset-0 -z-10 bg-[#0a0a12]">
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.07) 40px, rgba(255,255,255,0.07) 80px)",
                    }}
                />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-600/10 via-purple-600/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-green-600/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-14">
                {/* ──────────── CHOOSE YOUR PLAN ──────────── */}
                <div className="text-center mb-10">
                    <Link href="/" className="text-2xl font-black inline-block mb-6 tracking-tighter">FAN<span className="text-[#3B82F6]">BROJ</span></Link>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">Choose Your Plan</h1>
                    <p className="text-gray-400 mt-3 text-lg">Hal account, hal lacag-bixin, daawasho deggan.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mb-16">
                    {/* Plan Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {PLAN_CARDS.map((card) => {
                            const planOption = PLAN_OPTIONS.find((p) => p.id === card.id);
                            if (!planOption) return null;
                            const price = getPlanPrice(settings, planOption);

                            return (
                                <div
                                    key={card.id}
                                    className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-current/20 hover:ring-2 hover:ring-current"
                                    onClick={() => handleSelectPlan(card.id)}
                                >
                                    {/* Background Image */}
                                    <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                                        <Image
                                            src={card.image}
                                            alt={card.displayName}
                                            fill
                                            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, 50vw"
                                        />
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                                        {/* Content Overlay */}
                                        <div className="absolute inset-0 flex flex-col justify-between p-5">
                                            {/* Top — Name & Duration */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className={`text-3xl font-black ${card.nameColor} drop-shadow-lg`}>
                                                        {card.displayName}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white/80 text-sm font-bold">{card.durationLabel}</p>
                                                    {card.bonusText && (
                                                        <p className="text-green-400 text-xs font-bold mt-0.5">{card.bonusText}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom — Price, Features, Select */}
                                            <div>
                                                {/* Price */}
                                                <div className="mb-4">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-white/60 text-lg font-bold">$$</span>
                                                        <span className="text-5xl font-black text-white">{price.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {/* Select Button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSelectPlan(card.id); }}
                                                    type="button"
                                                    className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all text-black ${card.btnColor} group-hover:ring-2 group-hover:ring-white/30`}
                                                >
                                                    SELECT
                                                </button>

                                                {/* Features */}
                                                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-white/60 font-medium">
                                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Monitor size={12} className="text-white/40" />
                                                        {card.devices > 1 ? `${card.devices} Devices` : `${card.devices} Device`}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Check size={12} className="text-green-400" />
                                                        {card.features[0]}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    <span className="flex items-center gap-1.5 whitespace-nowrap text-right">
                                                        <Crown size={12} className="text-yellow-400" />
                                                        {card.features[1] || "VIP"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* WHAT YOU GET Sidebar */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 h-fit lg:sticky lg:top-24">
                        <h2 className="text-xl font-black uppercase tracking-wider mb-6 text-white text-center xl:text-left">What You Get</h2>
                        <div className="space-y-4">
                            {WHAT_YOU_GET.map((item) => (
                                <div key={item.label} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-[#3B82F6]/20">
                                        <item.icon size={18} className="text-gray-400 group-hover:text-[#3B82F6] transition-colors" />
                                    </div>
                                    <p className="text-[14px] text-gray-300 font-medium group-hover:text-white transition-colors">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center pt-8">
                    <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm font-medium">
                        Ku laabo Bogga Hore (Back Home)
                    </Link>
                </div>
            </div>
        </div>
    );
}
