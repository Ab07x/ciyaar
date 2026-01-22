import Link from "next/link";
import { Check, Play, Download } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PricingPlan {
  id: string;
  name: string;
  nameColor: string;
  priceKey: "priceStarter" | "pricePlus" | "pricePro" | "priceElite";
  defaultPrice: string;
  priceColor: string;
  duration: string;
  bonus?: string;
  subtitle: string;
  movies: number;
  episodes: number;
  buttonText: string;
  buttonStyle: string;
  cardGradient: string;
  borderColor: string;
}

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    nameColor: "text-[var(--color-premium)]",
    priceKey: "priceStarter",
    defaultPrice: "24.99",
    priceColor: "text-white",
    duration: "6-Month Plan",
    subtitle: "One-time Payment",
    movies: 1,
    episodes: 5,
    buttonText: "Get Starter",
    buttonStyle: "bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] text-white border border-[var(--color-premium)]/50",
    cardGradient: "from-[#000] via-[#111] to-[#000]",
    borderColor: "border-[var(--color-premium)]/30",
  },
  {
    id: "plus",
    name: "Plus",
    nameColor: "text-[var(--color-sports)]",
    priceKey: "pricePlus",
    defaultPrice: "34.00",
    priceColor: "text-[var(--color-sports)]",
    duration: "1-Year Plan",
    subtitle: "One-time Payment",
    movies: 3,
    episodes: 10,
    buttonText: "Get Plus",
    buttonStyle: "bg-[var(--color-sports)] hover:brightness-110 text-black font-bold",
    cardGradient: "from-[#000] via-[#051105] to-[#000]",
    borderColor: "border-[var(--color-sports)]/30",
  },
  {
    id: "pro",
    name: "Pro",
    nameColor: "text-[var(--color-cinema)]",
    priceKey: "pricePro",
    defaultPrice: "38.00",
    priceColor: "text-[var(--color-cinema)]",
    duration: "2-Year Plan",
    subtitle: "One-time Payment",
    movies: 5,
    episodes: 15,
    buttonText: "Get Pro",
    buttonStyle: "bg-[var(--color-cinema)] hover:brightness-110 text-white font-bold",
    cardGradient: "from-[#000] via-[#1A0505] to-[#000]",
    borderColor: "border-[var(--color-cinema)]/30",
  },
  {
    id: "elite",
    name: "Elite",
    nameColor: "text-[var(--color-premium)]",
    priceKey: "priceElite",
    defaultPrice: "47.00",
    priceColor: "text-[var(--color-premium)]",
    duration: "3-Year Plan",
    bonus: "+1 months free",
    subtitle: "One-time Payment",
    movies: 10,
    episodes: 30,
    buttonText: "Get Elite",
    buttonStyle: "bg-gradient-to-r from-[var(--color-premium)] to-yellow-600 hover:brightness-110 text-black font-bold",
    cardGradient: "from-[#000] via-[#1A1100] to-[#000]",
    borderColor: "border-[var(--color-premium)]/50",
  },
];

const features = [
  "No Ads",
  "Favorites & Watch Later",
  "Android APP",
  "Watch on 5 Devices",
  "Requests of Movies/Shows",
  "Auto next episode",
  "Watch History",
];

export function PricingCards({ className }: { className?: string }) {
  const settings = useQuery(api.settings.getSettings);

  const getPrice = (plan: PricingPlan) => {
    if (settings && (settings as any)[plan.priceKey]) {
      return `U$ ${(settings as any)[plan.priceKey]}`;
    }
    return `U$ ${plan.defaultPrice}`;
  };

  return (
    <section className={`py-12 ${className || ""}`}>
      <div className="px-4">
        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-10 italic">
          Choose Your Plan
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl overflow-hidden border ${plan.borderColor} bg-gradient-to-b ${plan.cardGradient} transition-all hover:scale-[1.02] hover:shadow-2xl`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className={`font-bold text-lg ${plan.nameColor}`}>{plan.name}</span>
                <span className={`font-bold text-lg ${plan.priceColor}`}>{getPrice(plan)}</span>
              </div>

              {/* Plan Duration */}
              <div className="relative px-4 py-6 min-h-[140px] flex flex-col justify-center">
                {/* Background overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />

                <div className="relative z-10 text-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {plan.duration}
                  </h3>
                  {plan.bonus && (
                    <span className="inline-block text-green-400 text-sm font-semibold mb-1">
                      {plan.bonus}
                    </span>
                  )}
                  <p className="text-gray-400 text-sm">{plan.subtitle}</p>
                </div>
              </div>

              {/* Features List */}
              <div className="flex-1 px-4 py-4 space-y-3">
                {/* Unlimited Watching */}
                <div className="flex items-center gap-2 text-white text-sm">
                  <Play size={14} className="text-blue-400 flex-shrink-0" />
                  <span>Unlimited Watching</span>
                </div>

                {/* Download Limit */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-white text-sm">
                    <Download size={14} className="text-orange-400 flex-shrink-0" />
                    <span>Daily Download Limit:</span>
                  </div>
                  <div className="ml-5 text-sm">
                    <span className="text-blue-400 font-semibold">{plan.movies} Movies</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span className="text-yellow-400 font-semibold">{plan.episodes} Episodes</span>
                  </div>
                </div>

                {/* Other Features */}
                <div className="pt-2 space-y-2">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                      <Check size={14} className="text-gray-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="px-4 pb-4">
                <Link
                  href="/pricing"
                  className={`block w-full text-center py-3 rounded-lg font-bold transition-all ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
