"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Check, Shield, Zap, ChevronDown, PlayCircle, MessageCircle, Monitor, Crown, Smartphone, Lock } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/providers/UserProvider";
import { PLAN_CARDS, PLAN_OPTIONS, getPlanPrice } from "@/lib/plans";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ── Trimmed FAQ (3 high-impact questions) ── */
const FAQ_ITEMS = [
    {
        q: "Ma ku shaqeeyaa Smart TV?",
        a: "Haa! Fur browser-ka TV-gaaga, gal fanbroj.net, ku gal account-kaaga — kadibna bilaaw daawashada.",
    },
    {
        q: "Premium ma isla markiiba ayuu furmaa?",
        a: "Haa. Marka lacagtu xaqiijanto, Premium si toos ah ayuu kuu shaqeynayaa — code looma baahna.",
    },
    {
        q: "Sidee ayaan lacag ku bixiyaa?",
        a: "EVC Plus, Zaad (eDahab), Sahal, ama Credit Card (Visa/Mastercard). Daawo muuqaalka tutorial-ka hoose.",
    },
];

/* ── Accordion Item ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden transition-colors hover:border-white/20">
            <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="font-bold text-[15px] text-gray-200">{question}</span>
                <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
            {open && <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{answer}</div>}
        </div>
    );
}

/* ════════════════════════════════════════════
   PRICING PAGE — Ramadan Revenue Optimized
   ════════════════════════════════════════════ */
export default function PricingPage() {
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { data: geo, isLoading: geoLoading } = useSWR<{ country: string | null; multiplier: number }>("/api/geo", fetcher);
    const geoReady = !geoLoading && geo !== undefined;
    const geoMultiplier = geo?.multiplier ?? 1;
    const { isPremium } = useUser();
    const router = useRouter();
    const hasTracked = useRef(false);

    useEffect(() => {
        if (!hasTracked.current) {
            hasTracked.current = true;
            fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "pageview", pageType: "pricing", date: new Date().toISOString().split("T")[0] }),
            }).catch(() => {});
        }
    }, []);

    const handleSelectPlan = (planId: string) => {
        router.push(`/pay?plan=${planId}&auth=signup`);
    };

    /* ── Compute prices ── */
    const yearlyOption = PLAN_OPTIONS.find((p) => p.id === "yearly")!;
    const monthlyOption = PLAN_OPTIONS.find((p) => p.id === "monthly")!;
    const yearlyBase = getPlanPrice(settings, yearlyOption);
    const monthlyBase = getPlanPrice(settings, monthlyOption);
    const yearlyPrice = Math.round(yearlyBase * geoMultiplier * 100) / 100;
    const monthlyPrice = Math.round(monthlyBase * geoMultiplier * 100) / 100;
    const yearlyPerMonth = Math.round((yearlyPrice / 14) * 100) / 100; // 14 months (12+2 bonus)
    const monthlyAnnualCost = Math.round(monthlyPrice * 12 * 100) / 100;
    const savingsAmount = Math.round((monthlyAnnualCost - yearlyPrice) * 100) / 100;
    const savingsPercent = Math.round((1 - yearlyPrice / monthlyAnnualCost) * 100);

    return (
        <div className="min-h-screen relative overflow-hidden text-white font-sans selection:bg-yellow-400 selection:text-black pb-24">
            {/* Background */}
            <div className="fixed inset-0 -z-10 bg-[#0a0a12]">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,0.06) 40px, rgba(255,255,255,0.06) 80px)" }} />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-yellow-600/8 via-amber-600/4 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-green-600/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">

                {/* ══════════ 1. RAMADAN HERO ══════════ */}
                <div className="text-center mb-12">
                    <Link href="/" className="text-2xl font-black inline-block mb-5 tracking-tighter">FAN<span className="text-yellow-400">BROJ</span></Link>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-5">
                        Ramadan Special
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                        Daawo Filim & Sports Live<br className="hidden sm:block" />
                        <span className="text-yellow-400">Bilaa Xayeysiis</span>
                    </h1>
                    <p className="text-gray-400 mt-4 text-base sm:text-lg max-w-xl mx-auto">
                        724+ Filim AF Somali &bull; Ciyaaro Live &bull; HD/4K &bull; Smart TV &bull; 5 Device
                    </p>

                    {/* Dual CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                        <button
                            onClick={() => handleSelectPlan("yearly")}
                            className="w-full sm:w-auto px-8 py-4 bg-yellow-400 text-black font-black rounded-xl text-base uppercase tracking-wide hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20"
                        >
                            Save {savingsPercent}% — Iibso Yearly
                        </button>
                        <button
                            onClick={() => handleSelectPlan("monthly")}
                            className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold rounded-xl text-base hover:bg-white/15 transition-all border border-white/10"
                        >
                            {geoReady ? `Iibso Monthly — $${monthlyPrice.toFixed(2)}` : "Iibso Monthly..."}
                        </button>
                    </div>

                    {/* Trust micro-line — wraps nicely on mobile */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-5 text-[11px] sm:text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Lock size={11} /> Ammaan</span>
                        <span className="flex items-center gap-1"><Zap size={11} /> Isla markiiba</span>
                        <span className="flex items-center gap-1"><MessageCircle size={11} /> WhatsApp 24/7</span>
                        <span className="flex items-center gap-1"><Monitor size={11} /> Smart TV</span>
                    </div>
                </div>

                {/* ══════════ 2. YEARLY vs MONTHLY — Yearly Dominant ══════════ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-12">
                    {/* YEARLY — Dominant */}
                    <div
                        className="relative rounded-2xl overflow-hidden cursor-pointer ring-2 ring-yellow-400 shadow-xl shadow-yellow-500/15 transition-all hover:-translate-y-1 hover:shadow-2xl group"
                        onClick={() => handleSelectPlan("yearly")}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500" />
                        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-black uppercase tracking-wide">
                            Best Value Ramadan
                        </div>
                        <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                            <Image src="/planimg/elite.jpg" alt="Elite" fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                            <div className="absolute inset-0 flex flex-col justify-between p-5">
                                <div>
                                    <h3 className="text-3xl font-black text-yellow-400 drop-shadow-lg">Elite</h3>
                                    <p className="text-white/70 text-sm font-bold mt-1">365 maalmood + 2 bilood FREE</p>
                                </div>
                                <div>
                                    {/* Price */}
                                    <div className="mb-1">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-white/50 text-base font-bold">$</span>
                                            {geoReady
                                                ? <span className="text-5xl font-black text-white">{yearlyPrice.toFixed(2)}</span>
                                                : <span className="w-28 h-12 rounded bg-white/10 animate-pulse inline-block" />
                                            }
                                        </div>
                                        {geoReady && <p className="text-yellow-400/80 text-sm font-bold mt-1">= ${yearlyPerMonth.toFixed(2)} bishii</p>}
                                    </div>
                                    {/* Savings comparison */}
                                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 mb-4">
                                        {geoReady ? (
                                            <>
                                                <p className="text-xs text-gray-400">Monthly × 12 = <span className="line-through text-gray-500">${monthlyAnnualCost.toFixed(2)}</span></p>
                                                <p className="text-sm font-black text-green-400">Waxaad badbaadisaa ${savingsAmount.toFixed(2)}</p>
                                            </>
                                        ) : (
                                            <div className="h-8 rounded bg-white/10 animate-pulse" />
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSelectPlan("yearly"); }}
                                        type="button"
                                        className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg shadow-yellow-400/20"
                                    >
                                        IIBSO YEARLY
                                    </button>
                                    <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-white/50 font-medium">
                                        <span className="flex items-center gap-1"><Monitor size={10} /> 5 Devices</span>
                                        <span className="flex items-center gap-1"><Check size={10} className="text-green-400" /> Unlimited</span>
                                        <span className="flex items-center gap-1"><Crown size={10} className="text-yellow-400" /> No Ads</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MONTHLY */}
                    <div
                        className="relative rounded-2xl overflow-hidden cursor-pointer border border-white/10 transition-all hover:-translate-y-1 hover:shadow-2xl hover:ring-2 hover:ring-green-400 group"
                        onClick={() => handleSelectPlan("monthly")}
                    >
                        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-white/90 text-black text-xs font-black uppercase tracking-wide">
                            Most Popular
                        </div>
                        <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                            <Image src="/planimg/pro.png" alt="Pro" fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                            <div className="absolute inset-0 flex flex-col justify-between p-5">
                                <div>
                                    <h3 className="text-3xl font-black text-green-400 drop-shadow-lg">Pro</h3>
                                    <p className="text-white/70 text-sm font-bold mt-1">30 maalmood</p>
                                </div>
                                <div>
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-white/50 text-base font-bold">$</span>
                                            {geoReady
                                                ? <span className="text-5xl font-black text-white">{monthlyPrice.toFixed(2)}</span>
                                                : <span className="w-24 h-12 rounded bg-white/10 animate-pulse inline-block" />
                                            }
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSelectPlan("monthly"); }}
                                        type="button"
                                        className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all bg-green-500 text-black hover:bg-green-400"
                                    >
                                        IIBSO MONTHLY
                                    </button>
                                    <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-white/50 font-medium">
                                        <span className="flex items-center gap-1"><Monitor size={10} /> 3 Devices</span>
                                        <span className="flex items-center gap-1"><Check size={10} className="text-green-400" /> Unlimited</span>
                                        <span className="flex items-center gap-1"><Crown size={10} className="text-yellow-400" /> No Ads</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* More plans (weekly / match) — collapsed, lower emphasis */}
                <div className="max-w-3xl mx-auto mb-16">
                    <details className="group">
                        <summary className="cursor-pointer text-center text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2">
                            <span>Arag qorsheeyaha kale (Weekly &amp; Single Match)</span>
                            <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                            {PLAN_CARDS.filter((c) => !c.promoted).map((card) => {
                                const planOption = PLAN_OPTIONS.find((p) => p.id === card.id);
                                if (!planOption) return null;
                                const basePrice = getPlanPrice(settings, planOption);
                                const price = Math.round(basePrice * geoMultiplier * 100) / 100;
                                return (
                                    <div
                                        key={card.id}
                                        onClick={() => handleSelectPlan(card.id)}
                                        className="rounded-xl border border-white/10 bg-white/[0.03] p-5 cursor-pointer hover:border-white/20 transition-all flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <h4 className={`text-lg font-black ${card.nameColor}`}>{card.displayName}</h4>
                                            <p className="text-xs text-gray-500">{card.durationLabel} &bull; {card.devices} Device{card.devices > 1 ? "s" : ""}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white">${price.toFixed(2)}</p>
                                            <button type="button" className={`mt-1 px-4 py-1.5 rounded-lg text-xs font-bold text-black ${card.btnColor}`}>SELECT</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </details>
                </div>

                {/* ══════════ 3. SIDA LOO IIBSADO (How to Buy) — 3 Steps ══════════ */}
                <div className="max-w-3xl mx-auto mb-16">
                    <h2 className="text-2xl sm:text-3xl font-black text-center uppercase tracking-tight mb-8">
                        Sida Loo <span className="text-yellow-400">Iibsado</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {[
                            { step: "1", title: "Dooro Qorshe", desc: "Dooro Monthly ama Yearly.", icon: "📋" },
                            { step: "2", title: "Lacag Bixi", desc: "EVC, Zaad, Sahal, ama Card.", icon: "💳" },
                            { step: "3", title: "Bilaaw Daawashada", desc: "Premium isla markiiba furmaa!", icon: "🎬" },
                        ].map((s) => (
                            <div key={s.step} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center">
                                <div className="text-3xl mb-3">{s.icon}</div>
                                <div className="text-xs text-yellow-400 font-black mb-1">STEP {s.step}</div>
                                <h3 className="font-black text-white text-base mb-1">{s.title}</h3>
                                <p className="text-sm text-gray-400">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════ 4. TRUST STRIP ══════════ */}
                <div className="max-w-3xl mx-auto rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-16">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        {[
                            { icon: <Lock size={20} />, label: "Lacag-bixin ammaan ah" },
                            { icon: <Zap size={20} />, label: "Isla markiiba furmaa" },
                            { icon: <Smartphone size={20} />, label: "Smart TV + Mobile" },
                            { icon: <Shield size={20} />, label: "WhatsApp 24/7" },
                        ].map((t) => (
                            <div key={t.label} className="flex flex-col items-center gap-2">
                                <div className="text-yellow-400">{t.icon}</div>
                                <p className="text-xs text-gray-400 font-medium leading-tight">{t.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════ 5. VIDEO TUTORIAL ══════════ */}
                <div className="max-w-3xl mx-auto mb-16">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                            Sidee Loo <span className="text-yellow-400">Daawadaa</span> & Loo <span className="text-green-400">Bixiyaa</span>
                        </h2>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] shadow-2xl">
                        <div className="aspect-video">
                            <iframe
                                src="https://www.youtube.com/embed/5h1a8fQJ0JA"
                                title="Sidee loo daawadaa & loo bixiyaa - Fanproj Tutorial"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
                        <PlayCircle size={14} className="text-yellow-400" />
                        <span>Tutorial: Sida lacagta loo bixiyo iyo sida loo daawado</span>
                    </div>
                </div>

                {/* ══════════ 6. FAQ (3 Questions) ══════════ */}
                <div className="max-w-3xl mx-auto mb-16">
                    <h2 className="text-2xl sm:text-3xl font-black text-center uppercase tracking-tight mb-6">
                        Su&apos;aalaha <span className="text-yellow-400">Badanaa</span>
                    </h2>
                    <div className="space-y-3">
                        {FAQ_ITEMS.map((item, i) => (
                            <FaqItem key={i} question={item.q} answer={item.a} />
                        ))}
                    </div>
                </div>

                {/* ══════════ 7. WHATSAPP SUPPORT ══════════ */}
                <div className="max-w-3xl mx-auto mb-12">
                    <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-6 sm:p-8 text-center">
                        <MessageCircle size={28} className="text-[#25D366] mx-auto mb-2" />
                        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Caawimaad u baahan tahay?</h2>
                        <p className="text-gray-400 mb-5 text-sm">Nala soo xiriir WhatsApp — waan kaa caawin doonaa.</p>
                        <a
                            href={`https://wa.me/${String(settings?.whatsappNumber || "+252618274188").replace(/\D/g, "")}?text=${encodeURIComponent("Salaan, waxaan rabaa inaan wax ka ogaado Fanproj Premium.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#25D366] text-white font-black rounded-xl hover:bg-[#1fb855] transition-colors text-sm uppercase tracking-wide"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            +252 618 274 188
                        </a>
                        <p className="text-gray-600 text-xs mt-3">24/7 — Somali & English</p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center">
                    <Link href="/" className="text-gray-600 hover:text-white transition-colors text-sm font-medium">
                        Ku laabo Bogga Hore
                    </Link>
                </div>
            </div>
        </div>
    );
}
