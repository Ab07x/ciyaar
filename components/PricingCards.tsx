"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
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
  Monitor,
  Loader2,
  ShieldCheck,
  MessageCircle,
  Star,
  Gift,
  Clock,
  Users,
  Moon,
  Flame,
  Phone,
} from "lucide-react";

// ============================================
// GEO-BASED PRICING TIERS
// ============================================
// Tier 1 (US, UK, EU, Canada, Australia) = Premium pricing
// Tier 2 (Kenya, Uganda, Tanzania) = Mid pricing + M-Pesa
// Tier 3 (Somalia, Djibouti, Ethiopia) = Lowest pricing

type GeoTier = "tier1" | "tier2" | "tier3" | "unknown";
type CountryCode = string;

interface GeoInfo {
  country: CountryCode;
  tier: GeoTier;
  currency: string;
  currencySymbol: string;
  showMpesa: boolean;
}

const TIER1_COUNTRIES = ["US", "GB", "CA", "AU", "DE", "FR", "IT", "NL", "SE", "NO", "DK", "FI", "CH", "AT", "BE", "IE", "NZ", "AE", "SA", "QA", "KW", "BH", "OM"];
const TIER2_COUNTRIES = ["KE", "UG", "TZ", "RW", "BI", "MW", "ZM", "ZW", "MZ"];
const TIER3_COUNTRIES = ["SO", "DJ", "ET", "ER", "SD", "YE"];

function getGeoTier(country: string): GeoTier {
  if (TIER1_COUNTRIES.includes(country)) return "tier1";
  if (TIER2_COUNTRIES.includes(country)) return "tier2";
  if (TIER3_COUNTRIES.includes(country)) return "tier3";
  return "unknown";
}

// Price multipliers by tier
const TIER_MULTIPLIERS: Record<GeoTier, number> = {
  tier1: 2.5,    // $7.50/month instead of $3
  tier2: 1.5,    // $4.50/month
  tier3: 1.0,    // $3/month (base price)
  unknown: 1.2,  // $3.60/month
};

// Ramadan countdown
function getRamadanCountdown(): { days: number; isRamadan: boolean; isPreRamadan: boolean } {
  const now = new Date();
  // Campaign covers full Ramadan month (Feb 16, 2026 - Mar 17, 2026)
  const ramadanStart = new Date("2026-02-16T00:00:00");
  const ramadanEnd = new Date("2026-03-17T23:59:59");

  const isRamadan = now >= ramadanStart && now <= ramadanEnd;
  const daysUntil = Math.ceil((ramadanStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isPreRamadan = daysUntil > 0 && daysUntil <= 30;

  return { days: Math.max(0, daysUntil), isRamadan, isPreRamadan };
}

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
  ramadanBonus?: string;
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
    features: ["1 ciyaar live", "HD quality", "Bilaa xayeysiis inta plan-ku socdo", "1 qalab"],
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
    features: ["Ciyaaro live oo dhan", "Maktabad filimo & musalsal", "HD quality", "2 qalab"],
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
    features: ["Ciyaaro live oo dhan", "724+ filim & musalsal AF Somali", "HD/4K tayo sare", "3 qalab", "Taageero degdeg ah"],
    popular: true,
    ramadanBonus: "Bonus Ramadan: +7 maalmood bilaash",
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
    features: ["Ciyaaro live oo dhan", "724+ filim & musalsal AF Somali", "4K tayo sare", "5 qalab", "VIP WhatsApp support", "Waxyaabaha cusub marka hore"],
    bestValue: true,
    savings: "Qiimo dhimis 45%",
    ramadanBonus: "Bonus Ramadan: +30 maalmood bilaash",
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PricingCardsProps {
  className?: string;
  monthlyBonusDays?: number;
}

export function PricingCards({ className, monthlyBonusDays = 0 }: PricingCardsProps) {
  const { data: settings } = useSWR("/api/settings", fetcher);
  const { deviceId, userId, email } = useUser();
  const { data: subDetails } = useSWR(
    deviceId ? `/api/subscriptions?deviceId=${deviceId}` : null,
    fetcher
  );

  const currentPlanId = subDetails?.subscription?.plan;
  const currentRank = currentPlanId ? (planRanks[currentPlanId] || 0) : 0;

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [conversionSessionId] = useState(() => `pricing-cards:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`);
  const ramadan = getRamadanCountdown();

  // Detect user's country
  useEffect(() => {
    const detectGeo = async () => {
      try {
        // Use free IP geolocation
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        const country = data.country_code || "unknown";
        const tier = getGeoTier(country);
        setGeoInfo({
          country,
          tier,
          currency: tier === "tier2" && country === "KE" ? "KES" : "USD",
          currencySymbol: tier === "tier2" && country === "KE" ? "KSh" : "$",
          showMpesa: country === "KE" || TIER2_COUNTRIES.includes(country),
        });
      } catch {
        setGeoInfo({
          country: "unknown",
          tier: "unknown",
          currency: "USD",
          currencySymbol: "$",
          showMpesa: false,
        });
      }
    };
    detectGeo();
  }, []);

  // Fake live viewer count for social proof
  useEffect(() => {
    setViewerCount(Math.floor(Math.random() * 150) + 320);
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getPrice = useCallback((plan: PricingPlan): number => {
    const basePrice = settings ? ((settings as any)[plan.priceKey] ?? plan.defaultPrice) : plan.defaultPrice;
    const multiplier = geoInfo ? TIER_MULTIPLIERS[geoInfo.tier] : 1;
    return Math.round(basePrice * multiplier * 100) / 100;
  }, [settings, geoInfo]);

  const getOriginalPrice = useCallback((plan: PricingPlan): number => {
    const price = getPrice(plan);
    // Show "original" price as 40% more for urgency
    return Math.round(price * 1.4 * 100) / 100;
  }, [getPrice]);

  const displayPlans = ["monthly", "yearly", "weekly", "match"]
    .map((id) => plans.find((plan) => plan.id === id))
    .filter(Boolean) as PricingPlan[];

  const handlePayment = async (plan: PricingPlan) => {
    if (loadingPlan) return;
    setLoadingPlan(plan.id);

    const appliedBonusDays = plan.id === "monthly" ? Math.max(0, Math.min(7, monthlyBonusDays)) : 0;
    const trackEvent = (eventName: string, metadata?: Record<string, unknown>) => {
      fetch("/api/analytics/conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          userId: userId || undefined,
          deviceId: deviceId || undefined,
          sessionId: conversionSessionId,
          pageType: "pricing",
          plan: plan.id,
          source: "pricing_cards",
          metadata,
          createdAt: Date.now(),
        }),
        keepalive: true,
      }).catch(() => { });
    };

    trackEvent("cta_clicked", {
      ctaType: "pricing_buy_now",
      plan: plan.id,
      amount: getPrice(plan),
      geoTier: geoInfo?.tier || "unknown",
      bonusDays: appliedBonusDays,
    });
    trackEvent("purchase_started", {
      plan: plan.id,
      amount: getPrice(plan),
      geoTier: geoInfo?.tier || "unknown",
      bonusDays: appliedBonusDays,
      exitOfferApplied: appliedBonusDays > 0,
    });

    if (typeof window !== "undefined") {
      const payUrl = new URL("/pay", window.location.origin);
      payUrl.searchParams.set("plan", plan.id);
      payUrl.searchParams.set("src", "pricing");
      if (!email) {
        payUrl.searchParams.set("auth", "signup");
      }
      if (appliedBonusDays > 0) {
        payUrl.searchParams.set("bonusDays", String(appliedBonusDays));
        payUrl.searchParams.set("offerCode", "EXIT_INTENT_MONTHLY_7D");
      }
      window.location.assign(payUrl.toString());
      return;
    }

    setLoadingPlan(null);
  };

  return (
    <section className={`py-8 ${className || ""}`}>
      <div className="px-4 max-w-7xl mx-auto">

        {/* 🌙 RAMADAN BANNER - High CTR */}
        {(ramadan.isPreRamadan || ramadan.isRamadan) && (
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-[#1a0a2e] via-[#0d1b2a] to-[#1a0a2e]">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-[10%] text-4xl animate-pulse">🌙</div>
              <div className="absolute top-4 right-[15%] text-3xl animate-pulse" style={{ animationDelay: "0.5s" }}>⭐</div>
              <div className="absolute bottom-2 left-[30%] text-2xl animate-pulse" style={{ animationDelay: "1s" }}>✨</div>
              <div className="absolute bottom-4 right-[25%] text-3xl animate-pulse" style={{ animationDelay: "1.5s" }}>🌟</div>
            </div>
            <div className="relative z-10 p-6 md:p-8 text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full text-xs font-black mb-3 uppercase tracking-wider">
                <Moon size={14} />
                {ramadan.isRamadan ? "RAMADAN 2026 OFFER LIVE" : `${ramadan.days} maalmood ayaa ka haray (16 Feb 2026)`}
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                {ramadan.isRamadan
                  ? "Ramadan Offer-ka ugu culus wuu socdaa"
                  : "Diyaar-garoowga Ramadan ayaa socda"}
              </h3>
              <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto mb-4">
                Hadda fur qorshahaaga si aad u hesho daawasho joogto ah:
                <span className="text-yellow-400 font-bold"> filim, musalsal iyo sports live bilaa xayeysiis.</span>
              </p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-green-400">
                  <Users size={14} />
                  <span className="font-bold">{viewerCount}+</span> online hadda
                </div>
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <Flame size={14} />
                  <span className="font-bold">80+</span> qof ayaa saacadihii u dambeeyay iibsaday
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Banner */}
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
            {/* WhatsApp Support for Premium Users */}
            <a
              href="https://wa.me/252618274188?text=Asc%2C%20waxaan%20ahay%20macmiil%20Premium%20%E2%9C%85"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold px-4 py-2 rounded-full transition-all relative z-10"
            >
              <MessageCircle size={16} fill="white" />
              WhatsApp Support
            </a>
          </div>
        )}

        {/* Header with social proof */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Dooro qorshe ku habboon adiga
          </h2>
          <p className="text-gray-400 text-lg mb-4">
            Qiime cad, unlock degdeg ah, iyo taageero toos ah.
          </p>
          {geoInfo && geoInfo.tier === "tier3" && (
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
              <Gift size={16} />
              🇸🇴 Qiime loo habeeyay macaamiisha Soomaaliya
            </div>
          )}
          {geoInfo && geoInfo.tier === "tier2" && geoInfo.country === "KE" && (
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
              <Phone size={16} />
              🇰🇪 Kenya: M-Pesa waa diyaar
            </div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {displayPlans.map((plan) => {
            const price = getPrice(plan);
            const originalPrice = getOriginalPrice(plan);
            const Icon = plan.icon;
            const isCurrent = currentPlanId === plan.id;
            const isUpgrade = !isCurrent && (planRanks[plan.id] || 0) > currentRank;
            const isYearlyFocus = !isCurrent && plan.id === "yearly";
            const showRamadanBonus = (ramadan.isPreRamadan || ramadan.isRamadan) && plan.ramadanBonus;
            const monthlyPlanPrice = getPrice(plans.find((p) => p.id === "monthly") || plans[2]);
            const yearlyEquivalentMonthly = plan.id === "yearly" ? price / 12 : 0;
            const yearlySavingsAmount = plan.id === "yearly" ? Math.max(0, monthlyPlanPrice * 12 - price) : 0;
            const yearlySavingsPercent = plan.id === "yearly" && monthlyPlanPrice > 0
              ? Math.max(0, Math.round((yearlySavingsAmount / (monthlyPlanPrice * 12)) * 100))
              : 0;
            const monthlyOfferActive = plan.id === "monthly" && monthlyBonusDays > 0;

            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isCurrent
                  ? "border-accent-green ring-2 ring-accent-green/20 bg-gray-900/90 shadow-accent-green/10 font-bold"
                  : isYearlyFocus
                    ? "border-yellow-300 ring-4 ring-yellow-400/35 bg-gradient-to-b from-yellow-900/30 via-gray-900/90 to-gray-900/90 shadow-yellow-500/20 lg:scale-[1.05] z-20"
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
                    Most Chosen 🔥
                  </div>
                )}
                {!isCurrent && plan.bestValue && !isYearlyFocus && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold text-center py-1.5 uppercase tracking-wide">
                    ⭐ Best Value
                  </div>
                )}
                {isYearlyFocus && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 text-black text-xs font-black text-center py-2 uppercase tracking-wider">
                    Yearly Deal: Save {yearlySavingsPercent}% Now
                  </div>
                )}

                {/* Card Content */}
                <div className={`flex-1 flex flex-col p-6 ${(plan.popular || plan.bestValue || isCurrent) ? "pt-10" : ""}`}>

                  {/* Icon & Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.bgGradient} border border-white/5 ${plan.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">{plan.nameSomali}</h3>
                      <p className="text-sm text-gray-400">{plan.name}</p>
                    </div>
                  </div>

                  {/* Ramadan Bonus */}
                  {showRamadanBonus && (
                    <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                      {plan.ramadanBonus}
                    </div>
                  )}
                  {monthlyOfferActive && (
                    <div className="mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-black">
                      🔥 Exit Offer Active: +{monthlyBonusDays} maalmood BILAASH ah maanta
                    </div>
                  )}

                  {/* Price with crossed-out original */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">
                        {geoInfo?.currencySymbol || "$"}{price.toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-sm font-medium">/ {plan.duration}</span>
                    </div>
                    {(ramadan.isPreRamadan || ramadan.isRamadan) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-500 text-sm line-through">${originalPrice.toFixed(2)}</span>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
                          -30% Ramadan Offer
                        </span>
                      </div>
                    )}
                    {plan.savings && (
                      <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md mt-2">
                        {plan.savings}
                      </span>
                    )}
                    {plan.id === "yearly" && (
                      <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm font-black text-yellow-300">
                          Sanadkii {(geoInfo?.currencySymbol || "$")}{price.toFixed(2)} = {(geoInfo?.currencySymbol || "$")}{yearlyEquivalentMonthly.toFixed(2)} bishii.
                        </p>
                        <p className="text-xs text-yellow-100/80 mt-1">
                          Isbarbardhig: Monthly {(geoInfo?.currencySymbol || "$")}{monthlyPlanPrice.toFixed(2)} x 12 = {(geoInfo?.currencySymbol || "$")}{(monthlyPlanPrice * 12).toFixed(2)}.
                          Badbaadin toos ah: {(geoInfo?.currencySymbol || "$")}{yearlySavingsAmount.toFixed(2)} sanadkii.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-white/10 mb-4" />

                  {/* Features */}
                  <ul className="flex-1 space-y-2.5 mb-6">
                    <li className="flex items-center gap-3 text-gray-300 font-medium">
                      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                        {plan.maxDevices === 1 ? <Smartphone size={12} className="text-gray-400" /> :
                          <Monitor size={12} className="text-blue-400" />}
                      </div>
                      <span className="text-sm">{plan.maxDevices} Device{plan.maxDevices > 1 ? 's' : ''}</span>
                    </li>
                    {plan.features.filter(f => !f.toLowerCase().includes('device')).map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Check size={12} className={`text-green-500 ${isCurrent ? "text-accent-green" : ""}`} />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {/* WhatsApp support badge for monthly/yearly */}
                    {(plan.id === "monthly" || plan.id === "yearly") && (
                      <li className="flex items-center gap-3 text-green-400 font-medium">
                        <div className="w-7 h-7 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                          <MessageCircle size={12} className="text-[#25D366]" />
                        </div>
                        <span className="text-sm">WhatsApp taageero 24/7</span>
                      </li>
                    )}
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
                      {isCurrent
                        ? "✓ Qorshahaaga hadda"
                        : loadingPlan === plan.id
                          ? "Fadlan sug..."
                          : plan.id === "yearly"
                            ? "💎 Iibso Yearly - Save More"
                            : "💳 Iibso Hadda"}
                    </span>
                  </button>

                  {/* Urgency text */}
                  {!isCurrent && plan.popular && (
                    <p className="text-center text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                      <Clock size={10} />
                      <span>Qorshahan dad badan ayaa maanta doortay</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 🇰🇪 M-PESA SECTION — Kenya Users */}
        {geoInfo?.showMpesa && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-900/40 to-green-800/20 border border-green-500/30 rounded-2xl max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Phone size={24} className="text-green-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg flex items-center gap-2">
                  🇰🇪 M-Pesa Payment
                </h4>
                <p className="text-green-400 text-sm">Bixi si toos ah, activation degdeg ah.</p>
              </div>
            </div>
            <div className="bg-black/40 rounded-xl p-4 mb-4">
              <p className="text-gray-300 text-sm mb-2">Lacagta ku dir:</p>
              <div className="flex items-center justify-between bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                <div>
                  <p className="text-green-400 font-bold text-xl tracking-wider">0797415296</p>
                  <p className="text-gray-400 text-xs">M-Pesa / Airtel Money</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText("0797415296");
                    alert("Number copied! 📋");
                  }}
                  className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-400 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>1. Lambarka kore ku dir lacagta M-Pesa/Airtel Money.</p>
              <p>2. Caddeynta lacag-bixinta ku soo dir WhatsApp: <a href="https://wa.me/252618274188" className="text-green-400 font-bold hover:underline">+252 618 274 188</a></p>
              <p>3. Premium-kaaga waxaa la furi doonaa 5 daqiiqo gudahood. ✅</p>
            </div>
          </div>
        )}

        {/* How to Pay Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 border border-white/10 rounded-2xl max-w-3xl mx-auto shadow-2xl">
          <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
            <ShieldCheck className="text-green-500" size={20} />
            Sida Lacag-bixintu u Shaqeyso
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold">1</span>
                <p className="text-gray-300 text-sm">Dooro qorshaha aad rabto oo riix <strong className="text-white">&quot;Iibso Hadda&quot;</strong>.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold">2</span>
                <p className="text-gray-300 text-sm">Bogga lacag-bixinta ka dooro habka aad rabto: <strong className="text-white">EVC, eDahab, Zaad, Sahal, Card, Apple Pay</strong>.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-sm font-bold">3</span>
                <p className="text-gray-300 text-sm">Marka lacagtu gasho, Premium-kaaga <strong className="text-green-400">si toos ah ayuu u shaqeynayaa!</strong> ✅</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold flex-shrink-0">💡</span>
                <p className="text-gray-400 text-xs">Badanaa code looma baahna; unlock-ku waa automatic marka lacagtu xaqiijanto.</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Support CTA */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                  <MessageCircle size={20} className="text-[#25D366]" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Macaamiisha Premium waxay helaan taageero WhatsApp 24/7</p>
                  <p className="text-gray-400 text-xs">Su'aal ku saabsan lacag-bixin ama activation? Halkaan naga soo qor.</p>
                </div>
              </div>
              <a
                href="https://wa.me/252618274188?text=Asc%2C%20waxaan%20rabaa%20Premium%20%F0%9F%8C%99"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all transform hover:scale-105 whitespace-nowrap"
              >
                <MessageCircle size={16} fill="white" />
                WhatsApp Support
              </a>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-500">Habab la aqbalayo:</span>
            <div className="flex flex-wrap gap-2">
              {["EVC Plus", "Zaad", "Sahal", "eDahab", "Card", "Apple Pay", ...(geoInfo?.showMpesa ? ["M-Pesa", "Airtel Money"] : [])].map((m) => (
                <span key={m} className="text-xs bg-white/5 text-gray-400 px-2.5 py-1 rounded-full border border-white/10">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Social Proof Banner */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 bg-black/40 rounded-full px-6 py-3 border border-white/5">
            <div className="flex -space-x-2">
              {["🇸🇴", "🇰🇪", "🇬🇧", "🇺🇸", "🇨🇦"].map((flag, i) => (
                <span key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-sm">
                  {flag}
                </span>
              ))}
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-bold">{viewerCount}+ users online today</p>
              <p className="text-gray-500 text-xs">active from multiple countries</p>
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="text-yellow-400" fill="currentColor" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
