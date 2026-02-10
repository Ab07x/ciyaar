"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import {
  Zap,
  Calendar,
  CalendarDays,
  Crown,
  Check,
  Wallet,
  Sparkles,
  Smartphone,
  Tv,
  Monitor,
  Loader2,
  CreditCard,
  ShieldCheck
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
  savings?: string;
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
    features: ["1 ciyaar toos ah", "HD sawir wanaagsan", "Xayeysiis la'aan", "1 qalab"],
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
    features: ["Dhammaan ciyaaraha", "Dhammaan filimada", "HD sawir wanaagsan", "2 qalab"],
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
    features: ["Dhammaan ciyaaraha", "Dhammaan filimada", "HD/4K sawir heer sare", "3 qalab", "Taageero degdeg ah"],
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
    features: ["Dhammaan ciyaaraha", "Dhammaan filimada", "4K sawir heer sare", "5 qalab", "Taageero degdeg ah", "Waxyaabo cusub marka hore"],
    bestValue: true,
    savings: "Qiimo dhimis 45%",
    color: "text-yellow-400",
    bgGradient: "from-yellow-500/20 to-yellow-600/5",
    maxDevices: 5,
  },
];

const planRanks: Record<string, number> = {
  match: 1,
  weekly: 2,
  monthly: 3,
  yearly: 4,
};

export function PricingCards({ className }: { className?: string }) {
  const settings = useQuery(api.settings.getSettings);
  const { deviceId } = useUser();
  const subDetails = useQuery(api.subscriptions.getUserSubscriptionDetails, { deviceId: deviceId || "" });

  const currentPlanId = subDetails?.subscription?.plan;
  const currentRank = currentPlanId ? (planRanks[currentPlanId] || 0) : 0;

  const getPrice = (plan: PricingPlan): number => {
    if (!settings) return plan.defaultPrice;
    const price = (settings as any)[plan.priceKey];
    return price ?? plan.defaultPrice;
  };

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePayment = async (plan: PricingPlan) => {
    if (loadingPlan) return;
    setLoadingPlan(plan.id);

    try {
      const res = await fetch("/api/pay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          deviceId: deviceId || "unknown",
        }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Khalad ayaa dhacay. Fadlan isku day mar kale.");
      }
    } catch (err) {
      alert("Khalad ayaa dhacay. Fadlan hubso internetkaaga.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className={`py-8 ${className || ""}`}>
      <div className="px-4 max-w-7xl mx-auto">
        {/* Current Plan Banner - Only show for active subscriptions */}
        {subDetails?.subscription && (
          <div className="mb-10 p-4 border rounded-2xl flex items-center justify-between group overflow-hidden relative bg-accent-green/10 border-accent-green/20">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-green/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-green/20 text-accent-green">
                <Crown size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white">
                  Adigu hadda waxaad leedahay: <span className="text-accent-green uppercase">{subDetails.subscription.plan}</span>
                </h4>
                <p className="text-sm text-gray-400">
                  Wuxuu dhacayaa: {new Date(subDetails.subscription.expiresAt).toLocaleDateString()} ({Math.ceil((subDetails.subscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))} maalmood ayaa kuu haray)
                </p>
              </div>
            </div>
            <div className="text-right hidden md:block relative z-10">
              <span className="text-xs uppercase tracking-widest font-bold text-accent-green">
                Active
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Dooro Plan-ka Kula Habboon
          </h2>
          <p className="text-gray-400 text-lg">
            Daawasho aan xad lahayn. Qiimo jaban.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const Icon = plan.icon;
            const isCurrent = currentPlanId === plan.id;
            const isUpgrade = !isCurrent && (planRanks[plan.id] || 0) > currentRank;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isCurrent
                  ? "border-accent-green ring-2 ring-accent-green/20 bg-gray-900/90 shadow-accent-green/10 font-bold"
                  : plan.popular
                    ? "border-green-500/50 ring-2 ring-green-500/20 shadow-green-900/20 bg-gray-900/80"
                    : plan.bestValue
                      ? "border-yellow-500/50 ring-2 ring-yellow-500/20 shadow-yellow-900/20 bg-gray-900/60"
                      : "border-white/10 bg-gray-900/40"
                  }`}
              >
                {/* Status Badge */}
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 bg-accent-green text-black text-[10px] font-black text-center py-1 flex items-center justify-center gap-1 uppercase tracking-tighter">
                    <Check size={10} /> Qorshahaaga (Active)
                  </div>
                )}
                {!isCurrent && plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-1 shadow-sm uppercase tracking-wide">
                    <Sparkles size={12} />
                    Most Popular
                  </div>
                )}
                {!isCurrent && plan.bestValue && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold text-center py-1.5 uppercase tracking-wide">
                    ⭐ Best Value
                  </div>
                )}

                {/* Card Content */}
                <div className={`flex-1 flex flex-col p-6 ${(plan.popular || plan.bestValue || isCurrent) ? "pt-10" : ""}`}>

                  {/* Icon & Name */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.bgGradient} border border-white/5 ${plan.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-xl text-white`}>{plan.nameSomali}</h3>
                      <p className="text-sm text-gray-400">{plan.name}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-sm font-medium">/ {plan.duration}</span>
                    </div>
                    {plan.savings && (
                      <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md mt-2">
                        {plan.savings}
                      </span>
                    )}
                  </div>

                  <div className="h-px bg-white/10 mb-6" />

                  {/* Features */}
                  <ul className="flex-1 space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-gray-300 font-medium">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        {plan.maxDevices === 1 ? <Smartphone size={14} className="text-gray-400" /> :
                          plan.maxDevices > 1 ? <Monitor size={14} className="text-blue-400" /> : null}
                      </div>
                      <span>{plan.maxDevices} Device{plan.maxDevices > 1 ? 's' : ''}</span>
                    </li>
                    {plan.features.filter(f => !f.toLowerCase().includes('device')).map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Check size={14} className={`text-green-500 ${isCurrent ? "text-accent-green" : ""}`} />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Pay Button */}
                  <button
                    onClick={() => handlePayment(plan)}
                    disabled={isCurrent || loadingPlan === plan.id}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${isCurrent
                      ? "bg-white/10 text-white border border-white/20"
                      : isUpgrade
                        ? "bg-accent-gold hover:bg-yellow-400 text-black shadow-lg shadow-yellow-900/50"
                        : plan.popular
                          ? "bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-900/50"
                          : "bg-white text-black hover:bg-gray-200"
                      }`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Wallet size={18} />
                    )}
                    <span>
                      {isCurrent ? "✓ Qorshahaaga" : loadingPlan === plan.id ? "Sugayo..." : "💳 Iibso Hadda"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sida Loo Bixiyo - Tilmaamaha */}
        <div className="mt-12 p-6 bg-gradient-to-r from-gray-900 to-gray-800 border border-white/10 rounded-2xl max-w-3xl mx-auto shadow-2xl">
          <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
            <ShieldCheck className="text-green-500" size={20} />
            Sida Loo Bixiyo Lacagta
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold">1</span>
                <p className="text-gray-300 text-sm">Dooro plan-ka aad rabto oo riix <strong className="text-white">&quot;Iibso Hadda&quot;</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold">2</span>
                <p className="text-gray-300 text-sm">Waxaad aadi doontaa bogga lacag bixinta — ku bixi <strong className="text-white">EVC, eDahab, Zaad, ama Card</strong></p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold">3</span>
                <p className="text-gray-300 text-sm">Marka lacagta la bixiyo, Premium-kaaga <strong className="text-green-400">wuu kuu shaqeyn doonaa isla markiiba!</strong> ✅</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold flex-shrink-0">💡</span>
                <p className="text-gray-400 text-xs">Ma u baahnid inaad code sugto — lacagta markay tagto wax walba way kuu furmayaan automatic ahaan.</p>
              </div>
            </div>
          </div>
          {/* Habab Lacag Bixinta */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-500">Habab la aqbalayo:</span>
            <div className="flex flex-wrap gap-2">
              {["EVC Plus", "Zaad", "Sahal", "eDahab", "Card", "Apple Pay"].map((m) => (
                <span key={m} className="text-xs bg-white/5 text-gray-400 px-2.5 py-1 rounded-full border border-white/10">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
