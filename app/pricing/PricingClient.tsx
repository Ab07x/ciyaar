"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
    Check, X, Shield, Users, ChevronDown, ChevronUp,
    Star, Clock, Download, Tv, Zap, Play, Lock,
    CreditCard, AlertCircle,
} from "lucide-react";
import { NEW_PLAN_CARDS } from "@/lib/plans";
import type { NewPlanId } from "@/lib/plans";

const fetcher = (url: string) => fetch(url).then(r => r.json());

/** Show $8 not $8.00, but $2.50 stays $2.50 */
function fmt(n: number): string {
    return n % 1 === 0 ? n.toString() : n.toFixed(2);
}

/* ─── Types ─────────────────────────────────────────────────────────── */

type PlanPricing = {
    id: string;
    monthly: { price: number; label: string };
    yearly:  { price: number; label: string; perMonth: number; savePercent: number };
    trialEligible: boolean;
    trialDays: number;
    trialPrice: number;
};

type PricingData = {
    tier: number;
    country: string | null;
    trialEligible: boolean;
    plans: PlanPricing[];
};

/* ─── Plan card config ──────────────────────────────────────────────── */

const PLAN_IMAGES: Record<NewPlanId, string> = {
    starter: "/img/plan-starter.png",
    basic:   "/img/plan-basic.png",
    pro:     "/img/plan-pro.png",
    elite:   "/img/plan-elite.png",
};

const PLAN_COLORS: Record<NewPlanId, string> = {
    starter: "#f472b6",
    basic:   "#60a5fa",
    pro:     "#4ade80",
    elite:   "#facc15",
};

const PLAN_DURATION: Record<NewPlanId, string> = {
    starter: "3-Day Plan",
    basic:   "Weekly Plan",
    pro:     "Monthly Plan",
    elite:   "Yearly Plan",
};

const PLAN_BONUS: Record<NewPlanId, string> = {
    starter: "",
    basic:   "",
    pro:     "+1 month free",
    elite:   "+2 months free",
};

/* ─── Static data ────────────────────────────────────────────────────── */

const TESTIMONIALS = [
    { name: "Abdi H.",    city: "Minneapolis, USA", text: "Fanbroj waa ugu fiicanta streaming platform. Premier League live HD — xataa WiFi xun ayuu ku shaqeeyaa.", rating: 5, plan: "Pro",   since: "3 months" },
    { name: "Faadumo A.", city: "London, UK",        text: "Elite plan waxaan kala wadaagaa 4 qof. Qiimo fiican aad u badan. Mahadsanid!", rating: 5, plan: "Elite", since: "6 months" },
    { name: "Mohamed Y.", city: "Dubai, UAE",         text: "Champions League 4K — meesha kale ma helin. Support degdeg ah. 100% recommended.", rating: 5, plan: "Elite", since: "1 year" },
    { name: "Hodan M.",   city: "Toronto, Canada",    text: "Tried the $1 trial, was hooked instantly. Now on monthly Pro. Worth every cent.", rating: 5, plan: "Pro",   since: "2 months" },
];


const FAQ_DATA: { so: { q: string; a: string }; en: { q: string; a: string } }[] = [
    {
        so: { q: "Tijaabada $1 sida u shaqaysa?",      a: "Haddaad ka timaado USA, UK, Canada ama Europe — heli kartaa 3 maalmood buuxa $1 kaliya. Ka dib, waxaa kaa go'aa sambabooyinka iyo tafatirka si aad u bilaawdo qorshaha full." },
        en: { q: "How does the $1 trial work?",         a: "If you're in USA, UK, Canada or Europe, you get 3 full days for just $1. After that, you can choose to continue with a full plan. No automatic charges — you decide." },
    },
    {
        so: { q: "Sida lacagta loo bixiyo?",            a: "EVC Plus, Zaad, Sahal (Somalia) · M-Pesa (Kenya) · Kaardhka bangiga ama PayPal (caalamka). Xisaabtu waxay furmaa isla markiiba lacag bixinta ka dib." },
        en: { q: "How do I pay?",                       a: "EVC Plus, Zaad, Sahal (Somalia) · M-Pesa (Kenya) · Debit/credit card or PayPal worldwide. Access activates instantly after payment." },
    },
    {
        so: { q: "Ma heli karaa lacag celinta?",        a: "Haa — 7 maalmood lacag-celis oo buuxa. La xiriir WhatsApp support-ka 24/7. Waa ballantaada." },
        en: { q: "Can I get a refund?",                 a: "Yes — full 7-day money-back guarantee, no questions asked. Contact WhatsApp support anytime." },
    },
    {
        so: { q: "Intee qalab isticmaali karaa isla mar?", a: "Starter: 1 · Basic: 1 · Pro: 3 · Elite: 5 qalab isla mar. Elite waxay ku haboon tahay qoyska oo dhan." },
        en: { q: "How many devices at once?",           a: "Starter: 1 · Basic: 1 · Pro: 3 · Elite: 5 simultaneous devices. Elite is perfect for sharing with family." },
    },
    {
        so: { q: "Ehelkaay Somalia miyuu daawan karaa?", a: "Haa! Elite Plan waxay taageeraysaa 5 shaashadood isla mar — xataa hadday ku jiraan wadamo kala duwan." },
        en: { q: "Can my family in Somalia watch too?", a: "Yes! Elite Plan supports 5 simultaneous screens across different countries — perfect for diaspora families." },
    },
    {
        so: { q: "EVC bixinta sida u shaqaysa?",        a: "1. Dooro qorshahaaga. 2. Geli lambarkaga EVC. 3. Xaqiji ganacsiga telefonkaaga ku. 4. Xisaabtaadu isla markiiba furmaa." },
        en: { q: "How does EVC payment work?",          a: "1. Choose your plan. 2. Enter your EVC number. 3. Confirm the transaction on your phone. 4. Your account opens instantly." },
    },
    {
        so: { q: "Kaardhka bangiga ma loo isticmaali karaa?", a: "Haa. Visa, Mastercard, American Express oo dhan waa la aqbalaa. Lacagta waxaa u maamuli doona Stripe — nidaamka lacag bixinta ee ugu ammaan badan adduunka." },
        en: { q: "Can I pay by card?",                  a: "Yes. Visa, Mastercard, and Amex all accepted. Payments are processed by Stripe — the world's most trusted payment platform." },
    },
];

const PAYMENT_METHODS = [
    { name: "EVC Plus", flag: "🇸🇴", label: "Somalia",  color: "text-yellow-400" },
    { name: "Zaad",     flag: "🇸🇴", label: "Somalia",  color: "text-blue-400"   },
    { name: "Sahal",    flag: "🇸🇴", label: "Somalia",  color: "text-green-400"  },
    { name: "M-Pesa",   flag: "🇰🇪", label: "Kenya",    color: "text-green-500"  },
    { name: "PayPal",   flag: "🌐",  label: "Global",   color: "text-blue-500"   },
    { name: "Card",     flag: "💳",  label: "Global",   color: "text-purple-400" },
];

/* ─── Component ──────────────────────────────────────────────────────── */

export default function PricingClient() {
    const [faqLang,      setFaqLang]      = useState<"so" | "en">("so");
    const [openFaq,      setOpenFaq]      = useState<number | null>(null);

    const { data: pricing } = useSWR<PricingData>("/api/pricing", fetcher);
    const trialEligible = pricing?.trialEligible ?? false;

    /** Fixed prices — match Stripe plan prices */
    const FIXED_CARD_PRICES: Record<NewPlanId, number> = {
        starter: 1.50,
        basic:   3.00,
        pro:     6.00,
        elite:   80.00,
    };

    const getCardPrice = (planId: NewPlanId): number => FIXED_CARD_PRICES[planId];


    /** Build signup URL for a plan */
    const planUrl = (legacyId: string) => `/pay?plan=${legacyId}&auth=signup`;

    return (
        <div className="min-h-screen text-white" style={{ background: "transparent" }}>
            {/* Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/slider-bg.webp" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#071222]/92" />
            </div>

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <section className="px-4 pt-10 pb-4 max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                    <span className="text-green-400 text-xs font-semibold">39,246+ users active this month</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight"
                    style={{ background: "linear-gradient(90deg,#facc15,#fb923c,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Choose Your Plan
                </h1>
                <p className="text-gray-400 text-base md:text-lg mb-6 max-w-xl mx-auto">
                    12,000+ film &middot; Live sports HD/4K &middot; Bilaa xayeysiis<br />
                    <span className="text-green-400 font-semibold">Isla markiiba furmaa</span>
                </p>

                {/* Trust row */}
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400 mb-6">
                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-green-400" /> 7-day money-back</span>
                    <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blue-400" /> SSL encrypted</span>
                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" /> Instant access</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-purple-400" /> Cancel anytime</span>
                </div>

                {trialEligible && (
                    <p className="text-sm text-gray-500 mb-2">
                        Try 3 days for <span className="text-yellow-400 font-bold">$1</span> &mdash; New users only
                    </p>
                )}
            </section>

            {/* ── PLAN CARDS — 2x2 grid with images ──────────────────────── */}
            <section className="px-4 pb-12 max-w-5xl mx-auto">
                <style>{`
                    .plan-grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
                    @media (max-width: 640px) { .plan-grid-4 { grid-template-columns: 1fr; } }
                `}</style>

                <div className="plan-grid-4">
                    {NEW_PLAN_CARDS.map((plan) => {
                        const price = getCardPrice(plan.id);
                        const color = PLAN_COLORS[plan.id];
                        const image = PLAN_IMAGES[plan.id];
                        const duration = PLAN_DURATION[plan.id];
                        const bonus = PLAN_BONUS[plan.id];

                        return (
                            <div
                                key={plan.id}
                                style={{
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: `1px solid ${plan.highlight ? "rgba(74,222,128,0.35)" : "rgba(100,200,220,0.15)"}`,
                                    background: "#111827",
                                }}
                            >
                                {/* ── Image section ── */}
                                <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image}
                                        alt={plan.displayName}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
                                    />
                                    {/* Right-side dark gradient */}
                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 25%, rgba(11,17,32,0.75) 100%)" }} />
                                    {/* Bottom gradient */}
                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, #111827, transparent)" }} />

                                    {/* Plan name — top left (italic) */}
                                    <div style={{ position: "absolute", top: 14, left: 16 }}>
                                        <span style={{ fontStyle: "italic", fontSize: 22, fontWeight: 800, color }}>
                                            {plan.displayName}
                                        </span>
                                    </div>

                                    {/* Duration — top right */}
                                    <div style={{ position: "absolute", top: 14, right: 16, textAlign: "right" }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb" }}>
                                            {duration}
                                        </span>
                                        {bonus && (
                                            <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 2 }}>
                                                {bonus}
                                            </div>
                                        )}
                                    </div>

                                    {/* Price — bottom left */}
                                    <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "baseline", gap: 2 }}>
                                        <span style={{ fontSize: 14, fontWeight: 500, color: "#9ca3af" }}>$</span>
                                        {price > 0
                                            ? <span style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{fmt(price)}</span>
                                            : <span style={{ display: "inline-block", width: 60, height: 30, background: "rgba(255,255,255,0.1)", borderRadius: 6 }} />
                                        }
                                    </div>

                                    {/* SELECT button — bottom right */}
                                    <Link
                                        href={planUrl(plan.legacyId)}
                                        style={{
                                            position: "absolute",
                                            bottom: 16,
                                            right: 16,
                                            background: plan.highlight ? "#4ade80" : "#0d6efd",
                                            color: plan.highlight ? "#000" : "#fff",
                                            fontWeight: 800,
                                            fontSize: 13,
                                            padding: "8px 22px",
                                            borderRadius: 6,
                                            textDecoration: "none",
                                            letterSpacing: "0.1em",
                                            textTransform: "uppercase" as const,
                                        }}
                                    >
                                        {trialEligible && plan.trialLabel ? "START TRIAL" : "SELECT"}
                                    </Link>
                                </div>

                                {/* ── Features below image ── */}
                                <div style={{ padding: "12px 16px 14px", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                                    {plan.features.slice(0, 4).map(f => (
                                        <span key={f} style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ color: "#4ade80", fontSize: 9 }}>&#10003;</span> {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <p className="text-center text-xs text-gray-600 mt-5">
                    7-day money-back guarantee &middot; Cancel anytime &middot; No hidden fees
                    {trialEligible && " \u00b7 $1 trial for new users"}
                </p>
            </section>

            {/* ── PAYMENT METHODS ──────────────────────────────────────────── */}
            <section className="px-4 pb-16 max-w-4xl mx-auto">
                <h2 className="text-2xl font-black text-white text-center mb-2">Ku Bixi Sida Aad Jeceshahay</h2>
                <p className="text-gray-500 text-sm text-center mb-8">All payment methods accepted worldwide</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {PAYMENT_METHODS.map(m => (
                        <div key={m.name} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                            <div className="text-2xl mb-1.5">{m.flag}</div>
                            <p className={`font-black text-xs ${m.color}`}>{m.name}</p>
                            <p className="text-gray-600 text-[10px] mt-0.5">{m.label}</p>
                        </div>
                    ))}
                </div>

                {/* Security badges */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-green-500" />
                        PCI-DSS Compliant
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        256-bit SSL
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                        Powered by Stripe
                    </span>
                    <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                        No card stored locally
                    </span>
                </div>
            </section>

            {/* ── VIDEO TUTORIAL ───────────────────────────────────────────── */}
            <section className="px-4 pb-16 max-w-3xl mx-auto">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1a2b] to-[#0c1e35] overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">Sida Loo Iibsado & Daawado</h3>
                            <p className="text-gray-500 text-[11px]">How to buy and watch &middot; Tutorial video</p>
                        </div>
                    </div>
                    <div className="relative w-full aspect-video">
                        <iframe
                            src="https://www.youtube.com/embed/5h1a8fQJ0JA"
                            title="Sida loo iibsado Premium - Fanbroj Tutorial"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="absolute inset-0 w-full h-full"
                        />
                    </div>
                    <div className="px-5 py-3 flex flex-wrap gap-x-4 gap-y-1">
                        {["EVC Plus bixinta", "Kaardhka bangiga", "Code-ka gelin", "Daawashada HD/4K"].map(tag => (
                            <span key={tag} className="text-[10px] text-gray-500 flex items-center gap-1">
                                <span className="w-1 h-1 bg-green-500 rounded-full inline-block" />
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SOCIAL PROOF ─────────────────────────────────────────────── */}
            <section className="px-4 pb-16 max-w-4xl mx-auto">
                <h2 className="text-2xl font-black text-white text-center mb-1">Maxay Yiraahdeen Users-ka?</h2>
                <p className="text-gray-500 text-sm text-center mb-8">What our subscribers say &middot; Verified reviews</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                            <div className="flex gap-0.5 mb-2">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-300 text-xs leading-relaxed flex-1 mb-3">&ldquo;{t.text}&rdquo;</p>
                            <div className="border-t border-white/5 pt-3">
                                <p className="text-white font-bold text-xs">{t.name}</p>
                                <p className="text-gray-500 text-[10px]">{t.city}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                        t.plan === "Elite" ? "bg-yellow-400/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                                    }`}>{t.plan}</span>
                                    <span className="text-gray-600 text-[9px]">{t.since}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats strip */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { value: "39K+",  label: "Monthly users",      icon: <Users className="w-4 h-4 text-purple-400" /> },
                        { value: "12K+",  label: "Movies & shows",     icon: <Tv className="w-4 h-4 text-blue-400" /> },
                        { value: "4.9\u2605",  label: "Avg rating",    icon: <Star className="w-4 h-4 text-yellow-400" /> },
                        { value: "< 30s", label: "Activation time",    icon: <Zap className="w-4 h-4 text-green-400" /> },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                            <div className="flex justify-center mb-1">{stat.icon}</div>
                            <p className="text-white font-black text-lg">{stat.value}</p>
                            <p className="text-gray-500 text-[10px]">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────────────────────────── */}
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
                        const isOpen = openFaq === i;
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

        </div>
    );
}
