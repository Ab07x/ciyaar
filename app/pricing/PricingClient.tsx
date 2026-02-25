"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    Check, X, Shield, Users, ChevronDown, ChevronUp,
    Star, Zap, Clock, Download, Tv, Youtube,
} from "lucide-react";
import { PLAN_OPTIONS, getPlanPrice } from "@/lib/plans";
import QuickCheckout from "@/components/QuickCheckout";
import type { PlanId } from "@/lib/plans";

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ── Static data ───────────────────────────────────────────── */

const PLAN_DISPLAY: {
    id: PlanId;
    color: "blue" | "purple" | "green" | "yellow";
    name: string;
    badge: string | null;
    highlight: boolean;
    features: string[];
    cta: string;
}[] = [
    {
        id: "match",
        color: "blue",
        name: "Starter",
        badge: null,
        highlight: false,
        features: ["1 ciyaar live", "HD quality", "1 screen", "Bilaa subscription"],
        cta: "BILAW",
    },
    {
        id: "weekly",
        color: "purple",
        name: "Plus",
        badge: null,
        highlight: false,
        features: ["7 maalmood buuxa", "HD quality", "2 screens", "Ciyaaro live oo dhan"],
        cta: "TIJAABI",
    },
    {
        id: "monthly",
        color: "green",
        name: "Pro",
        badge: "⭐ MOST POPULAR",
        highlight: true,
        features: ["30 maalmood", "Full HD quality", "3 screens", "Ciyaaro live HD", "Offline downloads"],
        cta: "KU BILOW",
    },
    {
        id: "yearly",
        color: "yellow",
        name: "Elite",
        badge: "💎 BEST VALUE",
        highlight: false,
        features: ["365 + 60 maalmood bonus", "4K Ultra HD", "5 screens", "Ciyaaro live 4K", "Offline downloads", "Priority support"],
        cta: "HELI ELITE",
    },
];

const COLOR_MAP = {
    blue:   { border: "border-blue-500/40",   bg: "bg-blue-500/5",   btn: "bg-blue-500 hover:bg-blue-400 text-white",       text: "text-blue-400",   badge: "bg-blue-500 text-white"  },
    purple: { border: "border-purple-500/40", bg: "bg-purple-500/5", btn: "bg-purple-500 hover:bg-purple-400 text-white",    text: "text-purple-400", badge: "bg-purple-500 text-white" },
    green:  { border: "border-green-500/60",  bg: "bg-green-500/10", btn: "bg-green-500 hover:bg-green-400 text-black",      text: "text-green-400",  badge: "bg-green-500 text-black"  },
    yellow: { border: "border-yellow-400/60", bg: "bg-yellow-400/10",btn: "bg-yellow-400 hover:bg-yellow-300 text-black",    text: "text-yellow-400", badge: "bg-yellow-400 text-black"  },
} as const;

type CompareRow = {
    feature: string;
    match: string | boolean;
    weekly: string | boolean;
    monthly: string | boolean;
    yearly: string | boolean;
};

const PLAN_COMPARE: CompareRow[] = [
    { feature: "Duration",          match: "1 match",  weekly: "7 days",    monthly: "30 days",  yearly: "425 days" },
    { feature: "Quality",           match: "HD",       weekly: "HD",        monthly: "Full HD",  yearly: "4K Ultra HD" },
    { feature: "Screens",           match: "1",        weekly: "2",         monthly: "3",        yearly: "5" },
    { feature: "Live Sports",       match: true,       weekly: true,        monthly: true,       yearly: true },
    { feature: "Offline Downloads", match: false,      weekly: false,       monthly: true,       yearly: true },
    { feature: "+2 Months Free",    match: false,      weekly: false,       monthly: false,      yearly: true },
    { feature: "Ads",               match: false,      weekly: false,       monthly: false,      yearly: false },
];

const FAQ_DATA: { so: { q: string; a: string }; en: { q: string; a: string } }[] = [
    {
        so: { q: "Sida lacagta loo bixiyo?",      a: "EVC Plus, Zaad, Sahal (Somalia) · M-Pesa (Kenya) · PayPal ama kaarka baniga (caalamka). Xisaabtu waxay furmaa isla markiiba." },
        en: { q: "How do I pay?",                 a: "EVC Plus, Zaad, Sahal (Somalia) · M-Pesa (Kenya) · PayPal or debit/credit card worldwide. Account activates instantly after payment." },
    },
    {
        so: { q: "Ma heli karaa lacag celinta?",  a: "Haa — 7 maalmood lacag-celis oo buuxa haddaad qanacsan tahay. La xiriir WhatsApp support-ka." },
        en: { q: "Can I get a refund?",           a: "Yes — 7-day full money-back guarantee. Contact WhatsApp support within 7 days." },
    },
    {
        so: { q: "Ma baabi'i karaa mar kasta?",   a: "Haa, waqti kasta. Xilligaaga Premium waxay socon doontaa ilaa dhamaadka mudadaada la bixiyay." },
        en: { q: "Can I cancel anytime?",         a: "Yes, anytime. Your access continues until the end of your paid period. No cancellation fees." },
    },
    {
        so: { q: "Intee jeer qalab isticmaali karaa?", a: "Starter: 1 · Plus: 2 · Pro: 3 · Elite: 5 qalab isla mar." },
        en: { q: "How many devices?",             a: "Starter: 1 · Plus: 2 · Pro: 3 · Elite: 5 simultaneous devices." },
    },
    {
        so: { q: "Ehelkaay Somalia miyuu daawan karaa?", a: "Haa! Elite Plan waxay xidid kartaa 5 qof isla mar — xataa hadday ku jiraan wadamo kala duwan." },
        en: { q: "Can my family in Somalia watch?", a: "Yes! Elite Plan supports 5 simultaneous screens — perfect for diaspora families across countries." },
    },
    {
        so: { q: "Ciyaaraha live miyay HD yihiin?", a: "Haa — Premier League, Champions League, NBA waxaa lagu arki karaa Full HD (Elite = 4K meesha la helo)." },
        en: { q: "Are live sports in HD?",         a: "Yes — Premier League, Champions League, NBA in Full HD. Elite plan gets 4K where available." },
    },
];

const TESTIMONIALS = [
    { name: "Abdi H.",     city: "Minneapolis, USA", text: "Runtii aad baan ugu faraxsanahay. Xataa WiFi xun Premium wuu shaqeeyaa.", rating: 5, plan: "Pro" },
    { name: "Faadumo A.",  city: "London, UK",       text: "Ciyaarka Premier League live HD — meesha kale ma helin!", rating: 5, plan: "Pro" },
    { name: "Mohamed Y.",  city: "Dubai, UAE",        text: "Subscription sax ah, support degdeg ah. Mahadsanid Fanbroj!", rating: 5, plan: "Elite" },
];

/* ── Component ─────────────────────────────────────────────── */

export default function PricingClient() {
    const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
    const [showCheckout,  setShowCheckout] = useState(false);
    const [faqLang,  setFaqLang]  = useState<"so" | "en">("so");
    const [openFaq,  setOpenFaq]  = useState<number | null>(null);

    const { data: settings } = useSWR("/api/settings", fetcher);
    const { data: geo }      = useSWR("/api/geo",      fetcher);
    const geoMultiplier: number = (geo as { multiplier?: number })?.multiplier ?? 1;

    const getPrice = (planId: PlanId): number => {
        const plan = PLAN_OPTIONS.find(p => p.id === planId)!;
        return Math.round(getPlanPrice(settings, plan) * geoMultiplier * 100) / 100;
    };

    const monthlyPrice = getPrice("monthly");
    const yearlyPrice  = getPrice("yearly");
    const yearlySave   = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

    const handleSelect = (planId: PlanId) => {
        setSelectedPlan(planId);
        setShowCheckout(true);
    };

    return (
        <div className="min-h-screen text-white" style={{background: 'transparent'}}>
            {/* Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/background2.jpg" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/85" />
            </div>
            <QuickCheckout
                isOpen={showCheckout}
                onClose={() => setShowCheckout(false)}
                defaultPlan={selectedPlan}
            />

            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-16 pb-12 px-4">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(34,197,94,0.10),transparent)]" />

                <div className="relative max-w-4xl mx-auto text-center">
                    {/* Live social proof pill */}
                    <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-6">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                        <span className="text-green-400 text-sm font-semibold">39,246+ users watching this month</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                        Daawo wax kasta.<br />
                        <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                            Bilaa Xayeysiis.
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl mb-2">
                        12,000+ filim · Ciyaaro Live HD · Apps kasta
                    </p>
                    <p className="text-gray-600 text-sm mb-10">
                        Watch Somali content anywhere — movies, sports, series.
                    </p>

                    {/* Trust row */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-green-500" />SSL Secure</span>
                        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" />Isla markiiba furmaa</span>
                        <span className="flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-red-400" />Bilaa xayeysiis</span>
                        <span className="flex items-center gap-1.5">↩ 7-day money-back</span>
                    </div>
                </div>
            </section>

            {/* ── Plan Cards ── */}
            <section className="px-4 pb-16 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {PLAN_DISPLAY.map((plan) => {
                        const price  = getPrice(plan.id);
                        const colors = COLOR_MAP[plan.color];
                        const suffix =
                            plan.id === "match"   ? "/match" :
                            plan.id === "weekly"  ? "/week"  :
                            plan.id === "monthly" ? "/month" : "/year";

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-5 flex flex-col ${
                                    plan.highlight
                                        ? "ring-2 ring-green-500/30 shadow-2xl shadow-green-500/10 lg:-translate-y-2"
                                        : ""
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${colors.badge}`}>
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Price */}
                                <div className="mb-4 mt-1">
                                    <p className={`text-xs font-black uppercase tracking-widest ${colors.text} mb-1`}>
                                        {plan.name}
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-white">${price.toFixed(2)}</span>
                                        <span className="text-gray-500 text-xs">{suffix}</span>
                                    </div>
                                    {plan.id === "yearly" && (
                                        <>
                                            <p className="text-xs text-yellow-400 font-bold mt-1">Save {yearlySave}% vs monthly</p>
                                            <p className="text-xs text-gray-600 line-through">
                                                ${(monthlyPrice * 12).toFixed(2)}/year
                                            </p>
                                        </>
                                    )}
                                    {plan.id === "monthly" && (
                                        <p className="text-xs text-green-400 mt-1">Ugu badan ee la doortaa</p>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 flex-1 mb-5">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-gray-300">
                                            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSelect(plan.id)}
                                    className={`w-full py-3 rounded-xl font-black text-sm transition-colors ${colors.btn}`}
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <p className="text-center text-xs text-gray-600 mt-6">
                    ↩ 7-day money-back guarantee · Cancel anytime · No hidden fees
                </p>
            </section>

            {/* ── Comparison Table ── */}
            <section className="px-4 pb-16 max-w-4xl mx-auto">
                <h2 className="text-2xl font-black text-white text-center mb-8">Compare Plans</h2>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-left py-3 px-4 text-gray-500 font-semibold">Feature</th>
                                <th className="text-center py-3 px-4 text-blue-400 font-black">Starter</th>
                                <th className="text-center py-3 px-4 text-purple-400 font-black">Plus</th>
                                <th className="text-center py-3 px-4 text-green-400 font-black">Pro ⭐</th>
                                <th className="text-center py-3 px-4 text-yellow-400 font-black">Elite 💎</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PLAN_COMPARE.map((row, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 text-gray-300 font-medium">{row.feature}</td>
                                    {(["match", "weekly", "monthly", "yearly"] as PlanId[]).map(planId => {
                                        const val = row[planId];
                                        return (
                                            <td key={planId} className="py-3 px-4 text-center">
                                                {typeof val === "boolean" ? (
                                                    val
                                                        ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                                                        : <X className="w-4 h-4 text-gray-700 mx-auto" />
                                                ) : (
                                                    <span className={
                                                        planId === "monthly" ? "text-green-400 font-semibold" :
                                                        planId === "yearly"  ? "text-yellow-400 font-semibold" :
                                                        "text-gray-400"
                                                    }>
                                                        {val}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {/* Price row */}
                            <tr className="bg-white/5">
                                <td className="py-4 px-4 text-white font-bold">Price</td>
                                {(["match", "weekly", "monthly", "yearly"] as PlanId[]).map(planId => (
                                    <td key={planId} className="py-4 px-4 text-center">
                                        <span className={
                                            planId === "monthly" ? "text-green-400 font-black" :
                                            planId === "yearly"  ? "text-yellow-400 font-black" :
                                            "text-white font-bold"
                                        }>
                                            ${getPrice(planId).toFixed(2)}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                            {/* CTA row */}
                            <tr>
                                <td className="py-4 px-4" />
                                {PLAN_DISPLAY.map(plan => {
                                    const colors = COLOR_MAP[plan.color];
                                    return (
                                        <td key={plan.id} className="py-4 px-4 text-center">
                                            <button
                                                onClick={() => handleSelect(plan.id)}
                                                className={`px-3 py-2 rounded-lg text-xs font-black transition-colors ${colors.btn}`}
                                            >
                                                {plan.cta}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── Payment Methods ── */}
            <section className="px-4 pb-16 max-w-4xl mx-auto">
                <h2 className="text-2xl font-black text-white text-center mb-2">Pay Your Way</h2>
                <p className="text-gray-500 text-sm text-center mb-8">
                    Ku bixi dariiqada aad jeceshahay · All methods accepted
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                        { name: "EVC Plus", flag: "🇸🇴", label: "Somalia" },
                        { name: "Zaad",     flag: "🇸🇴", label: "Somalia" },
                        { name: "Sahal",    flag: "🇸🇴", label: "Somalia" },
                        { name: "M-Pesa",   flag: "🇰🇪", label: "Kenya"   },
                        { name: "PayPal",   flag: "🌐",  label: "Global"  },
                        { name: "Card",     flag: "💳",  label: "Global"  },
                    ].map(m => (
                        <div key={m.name} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                            <div className="text-2xl mb-1">{m.flag}</div>
                            <p className="text-white font-bold text-xs">{m.name}</p>
                            <p className="text-gray-600 text-[10px]">{m.label}</p>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-5 text-xs text-gray-600">
                    <Shield className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span>PCI-compliant · SSL encrypted · Bank-level security</span>
                </div>
            </section>

            {/* ── Video Tutorial ── */}
            <section className="px-4 pb-16 max-w-3xl mx-auto">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0a1a2b] to-[#0f1e30] p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Youtube size={20} className="text-red-500" />
                        <h3 className="text-sm md:text-base font-bold text-white uppercase">Sida Loo Iibsado & Daawado VIP</h3>
                    </div>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                        <iframe
                            src="https://www.youtube.com/embed/5h1a8fQJ0JA"
                            title="Sida loo iibsado Premium - Fanbroj Tutorial"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="absolute inset-0 w-full h-full"
                        />
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="px-4 pb-16 max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-white">FAQ</h2>
                    <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
                        {(["so", "en"] as const).map(lang => (
                            <button
                                key={lang}
                                onClick={() => setFaqLang(lang)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                    faqLang === lang ? "bg-white text-black" : "text-gray-400 hover:text-white"
                                }`}
                            >
                                {lang === "so" ? "Af Soomaali" : "English"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    {FAQ_DATA.map((item, i) => {
                        const { q, a } = item[faqLang];
                        const isOpen   = openFaq === i;
                        return (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(isOpen ? null : i)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                                >
                                    <span className="font-semibold text-white text-sm pr-4">{q}</span>
                                    {isOpen
                                        ? <ChevronUp   className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                                        {a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="px-4 pb-16 max-w-4xl mx-auto">
                <h2 className="text-2xl font-black text-white text-center mb-2">
                    Ma og tahay waxa users kale yiraahdeen?
                </h2>
                <p className="text-gray-500 text-sm text-center mb-8">What our subscribers say</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <div className="flex mb-3">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-300 text-sm mb-4 leading-relaxed">"{t.text}"</p>
                            <div>
                                <p className="text-white font-bold text-sm">{t.name}</p>
                                <p className="text-gray-500 text-xs">{t.city} · {t.plan} plan</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Feature highlights ── */}
            <section className="px-4 pb-16 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: <Tv className="w-6 h-6 text-green-400" />,       title: "12,000+ Films",    sub: "Somali & International"   },
                        { icon: <Clock className="w-6 h-6 text-blue-400" />,     title: "Live Sports",      sub: "PL, UCL, NBA live HD"     },
                        { icon: <Download className="w-6 h-6 text-yellow-400" />,title: "Offline Mode",     sub: "Download & watch anywhere" },
                        { icon: <Users className="w-6 h-6 text-purple-400" />,   title: "Multi-screen",     sub: "Share with family"         },
                    ].map((f, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                            <div className="flex justify-center mb-3">{f.icon}</div>
                            <p className="text-white font-bold text-sm">{f.title}</p>
                            <p className="text-gray-500 text-xs mt-1">{f.sub}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="px-4 pb-24 max-w-2xl mx-auto text-center">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-3xl p-8">
                    {/* Guarantee badge */}
                    <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-6">
                        <Shield className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 text-xs font-bold">7-Day Money-Back Guarantee</span>
                    </div>

                    <h2 className="text-3xl font-black text-white mb-3">
                        Bilaaw Maanta
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                        Premium furan — bilaa xayeysiis, 12,000+ filim, ciyaaro live HD.<br />
                        <span className="text-green-400 font-semibold">Isla markiiba furmaa.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <button
                            onClick={() => handleSelect("monthly")}
                            className="flex-1 py-4 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black text-base transition-colors"
                        >
                            Pro — ${monthlyPrice.toFixed(2)}/bishii
                        </button>
                        <button
                            onClick={() => handleSelect("yearly")}
                            className="flex-1 py-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-base transition-colors"
                        >
                            Elite — ${yearlyPrice.toFixed(2)}/sanad ✦ save {yearlySave}%
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-500">
                        <span>↩ 7-day money-back</span>
                        <span>🔒 SSL Secure</span>
                        <span>⚡ Instant access</span>
                        <span>Cancel anytime</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
