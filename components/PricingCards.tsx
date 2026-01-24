"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/providers/UserProvider";
import {
  Zap,
  Clock,
  Calendar,
  CalendarDays,
  Crown,
  Check,
  MessageCircle,
  Sparkles
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  nameSomali: string;
  priceKey: "priceMatch" | "priceDaily" | "priceWeekly" | "priceMonthly" | "priceYearly";
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
    features: ["1 live match", "HD quality", "No ads during match"],
    color: "text-blue-400",
    bgGradient: "from-blue-500/20 to-blue-600/5",
  },
  {
    id: "daily",
    name: "Day Pass",
    nameSomali: "Maalinta",
    priceKey: "priceDaily",
    defaultPrice: 0.50,
    duration: "24 hours",
    durationSomali: "24 saac",
    icon: Clock,
    features: ["All matches", "All movies", "HD quality", "1 device"],
    color: "text-purple-400",
    bgGradient: "from-purple-500/20 to-purple-600/5",
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
    features: ["All matches", "All movies", "HD quality", "2 devices"],
    color: "text-orange-400",
    bgGradient: "from-orange-500/20 to-orange-600/5",
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
    features: ["All matches", "All movies", "HD/4K quality", "3 devices", "Priority support"],
    popular: true,
    color: "text-green-400",
    bgGradient: "from-green-500/20 to-green-600/5",
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
    features: ["All matches", "All movies", "4K quality", "5 devices", "Priority support", "Early access"],
    bestValue: true,
    savings: "Save 45%",
    color: "text-yellow-400",
    bgGradient: "from-yellow-500/20 to-yellow-600/5",
  },
];

export function PricingCards({ className }: { className?: string }) {
  const settings = useQuery(api.settings.getSettings);
  const { deviceId } = useUser();

  const getPrice = (plan: PricingPlan): number => {
    if (!settings) return plan.defaultPrice;
    const price = (settings as any)[plan.priceKey];
    return price ?? plan.defaultPrice;
  };

  const getWhatsAppLink = (plan: PricingPlan) => {
    const phone = settings?.whatsappNumber?.replace(/\D/g, "") || "252615000000";
    const price = getPrice(plan);
    const message = `Salaam! Waxaan rabaa:

📱 Plan: ${plan.name} ($${price.toFixed(2)})
⏱️ Duration: ${plan.duration}
🆔 Device: ${deviceId?.slice(0, 8) || "new"}

Waan bixiyay lacagta. Fadlan ii soo dir code-kayga.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <section className={`py-8 ${className || ""}`}>
      <div className="px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Qiimaha Ugu Jaban Suuqa! 🔥
          </h2>
          <p className="text-gray-400">
            Bilow $0.25 kaliya — Cheaper than a sambuus!
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-xl ${plan.popular
                    ? "border-green-500/50 ring-2 ring-green-500/20"
                    : plan.bestValue
                      ? "border-yellow-500/50 ring-2 ring-yellow-500/20"
                      : "border-white/10"
                  }`}
              >
                {/* Popular/Best Value Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-black text-xs font-bold text-center py-1 flex items-center justify-center gap-1">
                    <Sparkles size={12} />
                    POPULAR
                  </div>
                )}
                {plan.bestValue && (
                  <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-xs font-bold text-center py-1">
                    ⭐ BEST VALUE
                  </div>
                )}

                {/* Card Content */}
                <div className={`flex-1 flex flex-col p-4 bg-gradient-to-b ${plan.bgGradient} ${(plan.popular || plan.bestValue) ? "pt-8" : ""}`}>
                  {/* Icon & Name */}
                  <div className="text-center mb-3">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/50 ${plan.color} mb-2`}>
                      <Icon size={20} />
                    </div>
                    <h3 className={`font-bold ${plan.color}`}>{plan.nameSomali}</h3>
                    <p className="text-xs text-gray-500">{plan.name}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-3">
                    <span className="text-3xl md:text-4xl font-black text-white">
                      ${price.toFixed(2)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{plan.durationSomali}</p>
                    {plan.savings && (
                      <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full mt-1">
                        {plan.savings}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-1 mb-4 text-xs">
                    {plan.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-gray-300">
                        <Check size={12} className="text-green-500 flex-shrink-0" />
                        <span className="truncate">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* WhatsApp Button */}
                  <a
                    href={getWhatsAppLink(plan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${plan.popular
                        ? "bg-green-500 hover:bg-green-600 text-black"
                        : plan.bestValue
                          ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      }`}
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Instructions */}
        <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl max-w-2xl mx-auto">
          <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
            <MessageCircle size={18} />
            Sida loo bixiyo (How to Pay):
          </h4>
          <ol className="text-sm text-gray-300 space-y-1">
            <li>1️⃣ Dooro plan-kaaga → Click WhatsApp</li>
            <li>2️⃣ Bixi lacagta EVC/Zaad</li>
            <li>3️⃣ Noo soo dir screenshot</li>
            <li>4️⃣ Waxaan kuu soo diraynaa code-kaaga ✅</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
