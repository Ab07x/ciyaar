"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Gift, Copy, Check, MessageCircle, Sparkles } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

const GIFT_PLANS = [
    {
        id: "monthly",
        name: "1 Bishiiba",
        durationDays: 30,
        price: "$3.00",
        color: "from-blue-500 to-blue-600",
    },
    {
        id: "3month",
        name: "3 Bilood",
        durationDays: 90,
        price: "$7.50",
        popular: true,
        color: "from-purple-500 to-pink-500",
    },
    {
        id: "yearly",
        name: "Sanad Buuxa",
        durationDays: 365,
        price: "$20.00",
        color: "from-yellow-500 to-orange-500",
    },
];

const OCCASIONS = [
    { id: "general", label: "Hadiyad", emoji: "🎁" },
    { id: "birthday", label: "Dhalasho", emoji: "🎂" },
    { id: "ramadan", label: "Ramadan", emoji: "🌙" },
    { id: "eid", label: "Ciid", emoji: "🎊" },
];

export function GiftSubscriptionCard() {
    const { userId, deviceId } = useUser();
    const settings = useQuery(api.settings.getSettings);

    const [selectedPlan, setSelectedPlan] = useState("3month");
    const [selectedOccasion, setSelectedOccasion] = useState("general");
    const [recipientName, setRecipientName] = useState("");
    const [senderMessage, setSenderMessage] = useState("");
    const [showResult, setShowResult] = useState(false);

    const plan = GIFT_PLANS.find((p) => p.id === selectedPlan);
    const occasion = OCCASIONS.find((o) => o.id === selectedOccasion);

    const getWhatsAppLink = () => {
        const phone = settings?.whatsappNumber?.replace(/\D/g, "") || "252615000000";
        const message = `Salaam! Waxaan rabaa in aan iibsado HADIYAD:

🎁 Gift Plan: ${plan?.name} (${plan?.price})
👤 Loo socdo: ${recipientName || "Saaxiib"}
📝 Fariin: ${senderMessage || "Ku raaxayso Premium!"}
🎉 Occasion: ${occasion?.label}
🆔 Device: ${deviceId?.slice(0, 8) || "new"}

Waan bixiyay lacagta. Fadlan ii soo dir Gift Code-ka.`;

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 opacity-10">
                <Gift size={120} className="text-purple-500" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Gift className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Hadiyad Premium</h3>
                        <p className="text-sm text-purple-300">U dir saaxiib ama qof aad jeceshahay</p>
                    </div>
                </div>

                {/* Plan Selection */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {GIFT_PLANS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPlan(p.id)}
                            className={`relative p-3 rounded-xl border-2 transition-all text-center ${selectedPlan === p.id
                                    ? "border-purple-500 bg-purple-500/20"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                                }`}
                        >
                            {p.popular && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    BEST
                                </span>
                            )}
                            <p className="font-bold text-white text-sm">{p.name}</p>
                            <p className="text-purple-300 text-xs">{p.price}</p>
                        </button>
                    ))}
                </div>

                {/* Occasion Selection */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {OCCASIONS.map((o) => (
                        <button
                            key={o.id}
                            onClick={() => setSelectedOccasion(o.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${selectedOccasion === o.id
                                    ? "border-purple-500 bg-purple-500/20 text-white"
                                    : "border-white/10 text-text-secondary hover:border-white/20"
                                }`}
                        >
                            <span>{o.emoji}</span>
                            <span className="text-sm font-bold">{o.label}</span>
                        </button>
                    ))}
                </div>

                {/* Recipient & Message */}
                <div className="space-y-3 mb-6">
                    <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Magaca qofka (optional)"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:border-purple-500 focus:outline-none"
                    />
                    <textarea
                        value={senderMessage}
                        onChange={(e) => setSenderMessage(e.target.value)}
                        placeholder="Fariintaada (optional)"
                        rows={2}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:border-purple-500 focus:outline-none resize-none"
                    />
                </div>

                {/* WhatsApp CTA */}
                <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:brightness-110 transition-all"
                >
                    <Gift size={20} />
                    <span>Iibso Hadiyad {plan?.price}</span>
                </a>

                <p className="text-center text-xs text-purple-300/60 mt-3">
                    Gift code waxaad u diri kartaa WhatsApp ama ka copy gareyso
                </p>
            </div>
        </div>
    );
}
