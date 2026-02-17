"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import {
    Zap,
    Calendar,
    CalendarDays,
    Crown,
    Check,
    Wallet,
    Loader2,
    ShieldCheck,
    MessageCircle,
    Smartphone,
    Monitor,
} from "lucide-react";

interface PricingPlan {
    id: string;
    name: string;
    nameSomali: string;
    priceKey: "priceMatch" | "priceWeekly" | "priceMonthly" | "priceYearly";
    defaultPrice: number;
    duration: string;
    durationSomali: string;
    icon: React.ElementType;
    features: string[];
    popular?: boolean;
    bestValue?: boolean;
    color: string;
    bgGradient: string;
    maxDevices: number;
}

const plans: PricingPlan[] = [
    {
        id: "match",
        name: "Single Match",
        nameSomali: "Ciyaar Keliya",
        priceKey: "priceMatch",
        defaultPrice: 0.25,
        duration: "1 match",
        durationSomali: "Ciyaar 1",
        icon: Zap,
        features: ["1 ciyaar live", "HD quality", "Bilaa xayeysiis"],
        color: "text-blue-400",
        bgGradient: "from-blue-500/20 to-blue-600/5",
        maxDevices: 1,
    },
    {
        id: "weekly",
        name: "Weekly",
        nameSomali: "Usbuuclaha",
        priceKey: "priceWeekly",
        defaultPrice: 1.50,
        duration: "7 days",
        durationSomali: "7 maalmood",
        icon: Calendar,
        features: ["Ciyaaro live oo dhan", "Maktabad filimo & musalsal", "HD quality"],
        color: "text-orange-400",
        bgGradient: "from-orange-500/20 to-orange-600/5",
        maxDevices: 2,
    },
    {
        id: "monthly",
        name: "Monthly",
        nameSomali: "Bishiiba",
        priceKey: "priceMonthly",
        defaultPrice: 3.00,
        duration: "30 days",
        durationSomali: "30 maalmood",
        icon: CalendarDays,
        features: ["Ciyaaro live oo dhan", "724+ filim & musalsal AF Somali", "HD/4K tayo sare", "Taageero degdeg ah"],
        popular: true,
        color: "text-green-400",
        bgGradient: "from-green-500/20 to-green-600/5",
        maxDevices: 3,
    },
    {
        id: "yearly",
        name: "Yearly",
        nameSomali: "Sannadkiiba",
        priceKey: "priceYearly",
        defaultPrice: 20.00,
        duration: "365 days",
        durationSomali: "Sanad buuxa",
        icon: Crown,
        features: ["Ciyaaro live oo dhan", "724+ filim & musalsal AF Somali", "4K tayo sare", "VIP WhatsApp support", "Waxyaabaha cusub marka hore"],
        bestValue: true,
        color: "text-yellow-400",
        bgGradient: "from-yellow-500/20 to-yellow-600/5",
        maxDevices: 5,
    },
];

const planRanks: Record<string, number> = { match: 1, weekly: 2, monthly: 3, yearly: 4 };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PricingCardsProps {
    className?: string;
    monthlyBonusDays?: number;
}

export function PricingCards({ className, monthlyBonusDays = 0 }: PricingCardsProps) {
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { deviceId, email } = useUser();
    const { data: subDetails } = useSWR(
        deviceId ? `/api/subscriptions?deviceId=${deviceId}` : null,
        fetcher
    );

    const currentPlanId = subDetails?.subscription?.plan;
    const currentRank = currentPlanId ? (planRanks[currentPlanId] || 0) : 0;
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const getPrice = useCallback((plan: PricingPlan): number => {
        const basePrice = settings ? ((settings as any)[plan.priceKey] ?? plan.defaultPrice) : plan.defaultPrice;
        return Math.round(basePrice * 100) / 100;
    }, [settings]);

    // Display order: monthly, yearly, weekly, match
    const displayPlans = ["monthly", "yearly", "weekly", "match"]
        .map((id) => plans.find((p) => p.id === id))
        .filter(Boolean) as PricingPlan[];

    const handlePayment = async (plan: PricingPlan) => {
        if (loadingPlan) return;
        setLoadingPlan(plan.id);

        const appliedBonusDays = plan.id === "monthly" ? Math.max(0, Math.min(7, monthlyBonusDays)) : 0;

        if (typeof window !== "undefined") {
            const payUrl = new URL("/pay", window.location.origin);
            payUrl.searchParams.set("plan", plan.id);
            payUrl.searchParams.set("src", "pricing");
            if (!email) payUrl.searchParams.set("auth", "signup");
            if (appliedBonusDays > 0) {
                payUrl.searchParams.set("bonusDays", String(appliedBonusDays));
                payUrl.searchParams.set("offerCode", "EXIT_INTENT_MONTHLY_7D");
            }
            window.location.assign(payUrl.toString());
            return;
        }
        setLoadingPlan(null);
    };

    const monthlyPrice = getPrice(plans.find((p) => p.id === "monthly") || plans[2]);

    return (
        <section className={`py-8 ${className || ""}`}>
            <div className="px-4 max-w-6xl mx-auto">
                {/* Current Plan Banner */}
                {subDetails?.subscription && (
                    <div className="mb-8 p-4 border rounded-2xl flex items-center justify-between bg-green-500/5 border-green-500/20">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
                                <Crown size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">
                                    Qorshahaaga: <span className="text-green-400 uppercase">{subDetails.subscription.plan}</span>
                                </h4>
                                <p className="text-sm text-gray-400">
                                    {Math.ceil((subDetails.subscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))} maalmood ayaa kuu haray
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Dooro qorshe ku habboon</h2>
                    <p className="text-gray-400">Qiime cad, unlock degdeg ah, taageero toos ah.</p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {displayPlans.map((plan) => {
                        const price = getPrice(plan);
                        const Icon = plan.icon;
                        const isCurrent = currentPlanId === plan.id;
                        const isUpgrade = !isCurrent && (planRanks[plan.id] || 0) > currentRank;
                        const isYearly = plan.id === "yearly" && !isCurrent;
                        const yearlyEquivalentMonthly = plan.id === "yearly" ? price / 12 : 0;

                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] ${
                                    isCurrent
                                        ? "border-green-500 ring-2 ring-green-500/20 bg-gray-900/90"
                                        : isYearly
                                        ? "border-yellow-400 ring-2 ring-yellow-400/20 bg-gray-900/80 lg:scale-[1.03]"
                                        : plan.popular
                                        ? "border-green-500/40 bg-gray-900/70"
                                        : "border-white/10 bg-gray-900/50"
                                }`}
                            >
                                {/* Badge */}
                                {isCurrent && (
                                    <div className="bg-green-500 text-black text-[10px] font-black text-center py-1 uppercase tracking-wider flex items-center justify-center gap-1">
                                        <Check size={10} /> Active
                                    </div>
                                )}
                                {!isCurrent && isYearly && (
                                    <div className="bg-gradient-to-r from-yellow-400 to-amber-400 text-black text-xs font-black text-center py-1.5 uppercase tracking-wider">
                                        BEST VALUE
                                    </div>
                                )}
                                {!isCurrent && plan.popular && !isYearly && (
                                    <div className="bg-green-500 text-black text-xs font-bold text-center py-1.5 uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`flex-1 flex flex-col p-5 ${(isCurrent || plan.popular || plan.bestValue) ? "pt-5" : ""}`}>
                                    {/* Icon + Name */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${plan.bgGradient} border border-white/5 ${plan.color}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{plan.nameSomali}</h3>
                                            <p className="text-xs text-gray-500">{plan.name}</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-white">${price.toFixed(2)}</span>
                                            <span className="text-gray-500 text-sm">/ {plan.duration}</span>
                                        </div>
                                        {plan.id === "yearly" && (
                                            <p className="text-xs text-yellow-400 mt-1 font-bold">
                                                = ${yearlyEquivalentMonthly.toFixed(2)}/bishii
                                            </p>
                                        )}
                                    </div>

                                    <div className="h-px bg-white/10 mb-4" />

                                    {/* Features */}
                                    <ul className="flex-1 space-y-2 mb-5">
                                        <li className="flex items-center gap-2.5 text-gray-300 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                                {plan.maxDevices === 1 ? <Smartphone size={10} className="text-gray-400" /> : <Monitor size={10} className="text-blue-400" />}
                                            </div>
                                            {plan.maxDevices} Device{plan.maxDevices > 1 ? "s" : ""}
                                        </li>
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2.5 text-gray-300 text-sm">
                                                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                                    <Check size={10} className="text-green-500" />
                                                </div>
                                                {f}
                                            </li>
                                        ))}
                                        {(plan.id === "monthly" || plan.id === "yearly") && (
                                            <li className="flex items-center gap-2.5 text-green-400 text-sm font-medium">
                                                <div className="w-5 h-5 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                                                    <MessageCircle size={10} className="text-[#25D366]" />
                                                </div>
                                                WhatsApp 24/7
                                            </li>
                                        )}
                                    </ul>

                                    {/* Pay Button */}
                                    <button
                                        onClick={() => handlePayment(plan)}
                                        disabled={isCurrent || loadingPlan === plan.id}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isCurrent
                                                ? "bg-white/10 text-white border border-white/20"
                                                : isYearly
                                                ? "bg-yellow-400 hover:bg-yellow-300 text-black"
                                                : plan.popular
                                                ? "bg-green-500 hover:bg-green-400 text-black"
                                                : "bg-white hover:bg-gray-200 text-black"
                                        }`}
                                    >
                                        {loadingPlan === plan.id ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                                        {isCurrent ? "Qorshahaaga hadda" : loadingPlan === plan.id ? "Fadlan sug..." : "Iibso Hadda"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* How to Pay */}
                <div className="mt-8 p-6 bg-white/[0.02] border border-white/10 rounded-2xl max-w-3xl mx-auto">
                    <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-green-500" size={20} />
                        Sida Lacag-bixintu u Shaqeyso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { step: "1", text: 'Dooro qorshaha oo riix "Iibso Hadda"' },
                            { step: "2", text: "Ka dooro: EVC, eDahab, Zaad, Sahal, Card, Apple Pay" },
                            { step: "3", text: "Premium si toos ah ayuu u shaqeynayaa!" },
                        ].map((item) => (
                            <div key={item.step} className="flex gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold flex-shrink-0">{item.step}</span>
                                <p className="text-gray-300 text-sm">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Payment Methods */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                        <span className="text-xs text-gray-500">Habab la aqbalayo:</span>
                        <div className="flex flex-wrap gap-2">
                            {["EVC Plus", "Zaad", "Sahal", "eDahab", "Card", "Apple Pay"].map((m) => (
                                <span key={m} className="text-xs bg-white/5 text-gray-400 px-2.5 py-1 rounded-full border border-white/10">{m}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
