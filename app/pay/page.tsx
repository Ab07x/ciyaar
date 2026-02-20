"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
    ArrowRight,
    Camera,
    Check,
    CheckCircle2,
    Copy,
    CreditCard,
    Crown,
    Download,
    Film,
    Headphones,
    Loader2,
    Lock,
    MessageCircle,
    Monitor,
    Play,
    RefreshCw,
    Shield,
    ShieldCheck,
    Smartphone,
    Star,
    Tv,
    XCircle,
    Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/providers/UserProvider";

type PlanId = "match" | "weekly" | "monthly" | "yearly";
type PlanOption = {
    id: PlanId;
    label: string;
    subtitle: string;
    duration: string;
    priceKey: "priceMatch" | "priceWeekly" | "priceMonthly" | "priceYearly";
    defaultPrice: number;
};

type SettingsResponse = Record<string, unknown>;
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<SettingsResponse>);

const PLAN_OPTIONS: PlanOption[] = [
    { id: "monthly", label: "Monthly", subtitle: "Qorshaha ugu badan", duration: "30 maalmood", priceKey: "priceMonthly", defaultPrice: 3.2 },
    { id: "yearly", label: "Yearly", subtitle: "Qiimo jaban sanadkii", duration: "365 maalmood", priceKey: "priceYearly", defaultPrice: 11.99 },
    { id: "weekly", label: "Weekly", subtitle: "Tijaabo degdeg ah", duration: "7 maalmood", priceKey: "priceWeekly", defaultPrice: 1.0 },
    { id: "match", label: "Single Match", subtitle: "Ciyaar keliya", duration: "1 ciyaar", priceKey: "priceMatch", defaultPrice: 0.2 },
];

// LookMovie-style plan card data
const PLAN_CARDS = [
    {
        id: "match" as PlanId,
        displayName: "Starter",
        durationLabel: "Single Match",
        bonusText: null,
        image: "/planimg/starter.png",
        nameColor: "text-blue-400",
        borderColor: "border-blue-400",
        btnColor: "bg-blue-500 hover:bg-blue-400",
        devices: 1,
        features: ["Single Match", "HD Quality"],
    },
    {
        id: "weekly" as PlanId,
        displayName: "Plus",
        durationLabel: "7-Day Plan",
        bonusText: null,
        image: "/planimg/plus.jpg",
        nameColor: "text-purple-400",
        borderColor: "border-purple-400",
        btnColor: "bg-purple-500 hover:bg-purple-400",
        devices: 2,
        features: ["Unlimited Watching", "Full-Term Payment"],
    },
    {
        id: "monthly" as PlanId,
        displayName: "Pro",
        durationLabel: "30-Day Plan",
        bonusText: null, // set dynamically if bonus days
        image: "/planimg/pro.png",
        nameColor: "text-green-400",
        borderColor: "border-green-400",
        btnColor: "bg-green-500 hover:bg-green-400",
        devices: 3,
        features: ["Unlimited Watching", "Full-Term Payment"],
    },
    {
        id: "yearly" as PlanId,
        displayName: "Elite",
        durationLabel: "365-Day Plan",
        bonusText: "+2 months free",
        image: "/planimg/elite.jpg",
        nameColor: "text-yellow-400",
        borderColor: "border-yellow-400",
        btnColor: "bg-yellow-500 hover:bg-yellow-400",
        devices: 5,
        features: ["Unlimited Watching", "Full-Term Payment"],
    },
];

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

function getPlanPrice(settings: SettingsResponse | undefined, plan: PlanOption): number {
    const raw = Number(settings?.[plan.priceKey]);
    if (Number.isFinite(raw) && raw > 0) return raw;
    return plan.defaultPrice;
}

/* ────────────────────────────────────────────── */
/*  PaymentVerifier                               */
/* ────────────────────────────────────────────── */
function PaymentVerifier({ sid, orderId, stripeSession }: { sid: string | null; orderId: string | null; stripeSession: string | null }) {
    const [status, setStatus] = useState<"verifying" | "success" | "failed" | "pending" | "error">("verifying");
    const [message, setMessage] = useState("");
    const [plan, setPlan] = useState("");
    const [accessCode, setAccessCode] = useState("");
    const [isCodeCopied, setIsCodeCopied] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [autoPollCount, setAutoPollCount] = useState(0);
    const MAX_AUTO_POLLS = 10;
    const hasQueryToken = Boolean(sid || orderId || stripeSession);

    const verifyPayment = useCallback(async () => {
        try {
            setStatus("verifying");
            const deviceId = localStorage.getItem("fanbroj_device_id");
            if (!deviceId) { setStatus("error"); setMessage("Device ID lama helin. Fadlan la xiriir taageerada."); return; }
            const res = await fetch("/api/pay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sid, orderId, stripeSession, deviceId }) });
            const data = await res.json();
            if (data.success) { setStatus("success"); setMessage(data.message || "Premium wuu kuu shaqeynayaa!"); setPlan(data.plan || ""); if (data.code) { setAccessCode(String(data.code)); localStorage.setItem("fanbroj_last_payment_code", String(data.code)); } }
            else if (data.status === "pending") { setStatus("pending"); setMessage("Lacagta wali way socotaa..."); }
            else { setStatus("failed"); setMessage(data.message || data.error || "Xaqiijinta lacagtu way fashilmatay."); }
        } catch { setStatus("error"); setMessage("Khalad ayaa dhacay. Fadlan isku day mar kale."); }
    }, [sid, orderId, stripeSession]);

    useEffect(() => { if (!hasQueryToken) return; const t = window.setTimeout(() => { void verifyPayment(); }, 0); return () => window.clearTimeout(t); }, [hasQueryToken, retryCount, verifyPayment]);
    useEffect(() => { if (status !== "pending" || autoPollCount >= MAX_AUTO_POLLS) return; const t = window.setTimeout(() => { setAutoPollCount(c => c + 1); setRetryCount(c => c + 1); }, 4000); return () => window.clearTimeout(t); }, [status, autoPollCount]);
    const handleRetry = () => { setAutoPollCount(0); setRetryCount(c => c + 1); };
    const handleCopyCode = async () => { if (!accessCode) return; try { await navigator.clipboard.writeText(accessCode); setIsCodeCopied(true); window.setTimeout(() => setIsCodeCopied(false), 1800); } catch { setIsCodeCopied(false); } };
    const displayStatus = hasQueryToken ? status : "error";
    const displayMessage = hasQueryToken ? message : "Macluumaad lacag bixin ah lama helin.";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black via-gray-950 to-black">
            <div className="max-w-md w-full">
                {displayStatus === "verifying" && (
                    <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-8"><div className="absolute inset-0 rounded-full border-4 border-white/10" /><div className="absolute inset-0 rounded-full border-4 border-t-accent-green animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><Crown className="text-accent-gold" size={32} /></div></div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta la xaqiijinayaa...</h1>
                        <p className="text-gray-400">Fadlan sug ilaa lacagta la xaqiijiyo</p>
                    </div>
                )}
                {displayStatus === "success" && (
                    <div className="text-center animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-accent-green/30"><CheckCircle2 className="text-accent-green" size={48} /></div>
                        <h1 className="text-3xl font-black text-white mb-2">Waad ku guulaysatay!</h1>
                        <p className="text-accent-green text-lg font-bold mb-2">{displayMessage}</p>
                        {plan && <div className="inline-block bg-accent-gold/20 text-accent-gold px-4 py-2 rounded-full text-sm font-bold uppercase mb-8">{plan} wuu kuu shaqeynayaa</div>}
                        {accessCode && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Auto Premium Code</p>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-mono text-lg text-white tracking-wider">{accessCode}</p>
                                    <button onClick={handleCopyCode} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center gap-1">
                                        {isCodeCopied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}{isCodeCopied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3 mt-6">
                            <Link href="/" className="flex items-center justify-center gap-2 w-full bg-accent-green text-black font-bold py-4 rounded-xl hover:brightness-110 transition-all text-lg">Bilow Daawashada <ArrowRight size={20} /></Link>
                            <Link href="/subscription" className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all">Arag Subscription-kaaga</Link>
                        </div>
                    </div>
                )}
                {displayStatus === "pending" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Loader2 className="text-yellow-400 animate-spin" size={48} /></div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta wali ma dhammaanin</h1>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <p className="text-sm text-gray-500 mb-6">Haddii aad lacagta bixisay, fadlan sug daqiiqado yar oo ku dhufo &quot;Isku day mar kale&quot;</p>
                        <p className="text-xs text-gray-500 mb-6">Auto-check: {Math.min(autoPollCount, MAX_AUTO_POLLS)} / {MAX_AUTO_POLLS}</p>
                        <button onClick={handleRetry} className="flex items-center justify-center gap-2 w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"><RefreshCw size={18} />Isku day mar kale</button>
                    </div>
                )}
                {displayStatus === "failed" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle className="text-red-400" size={48} /></div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta ma shaqeyn</h1>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <div className="space-y-3">
                            <Link href="/pricing" className="flex items-center justify-center gap-2 w-full bg-accent-green text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all">Isku day mar kale</Link>
                            <button onClick={handleRetry} className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"><RefreshCw size={18} />Xaqiiji mar kale</button>
                        </div>
                    </div>
                )}
                {displayStatus === "error" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle className="text-red-400" size={48} /></div>
                        <h1 className="text-2xl font-black text-white mb-2">Khalad ayaa dhacay</h1>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <Link href="/pricing" className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all">Ku laabo Qiimaha</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  CheckoutHub — LookMovie-style design          */
/* ────────────────────────────────────────────── */
function CheckoutHub({
    initialPlanId = "monthly",
    initialAuthMode = "signup",
    initialBonusDays = 0,
    initialOfferCode = "",
}: {
    initialPlanId?: PlanId;
    initialAuthMode?: "signup" | "login";
    initialBonusDays?: number;
    initialOfferCode?: string;
}) {
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { deviceId, email, profile, signupWithEmail, loginWithEmail, updateAvatar } = useUser();

    const [authMode, setAuthMode] = useState<"signup" | "login">(initialAuthMode);
    const [formEmail, setFormEmail] = useState(email || "");
    const [displayName, setDisplayName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initialPlanId);
    const [paymentMethod, setPaymentMethod] = useState<"sifalo" | "stripe">("sifalo");
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [authCompleted, setAuthCompleted] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusError, setStatusError] = useState("");
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const checkoutRef = useRef<HTMLDivElement>(null);
    const canProceedToPayment = Boolean(email || authCompleted);

    const selectedPlan = useMemo(
        () => PLAN_OPTIONS.find((p) => p.id === selectedPlanId) || PLAN_OPTIONS[0],
        [selectedPlanId]
    );
    const selectedPlanPrice = useMemo(
        () => getPlanPrice(settings, selectedPlan),
        [settings, selectedPlan]
    );

    const handleSelectPlan = (planId: PlanId) => {
        setSelectedPlanId(planId);
        // Smooth scroll to checkout section
        window.setTimeout(() => {
            checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    const handleAuth = async () => {
        setStatusError(""); setStatusMessage("");
        const emailInput = (formEmail || email || "").trim();
        if (!emailInput) { setStatusError("Email geli."); return; }
        if (!password.trim()) { setStatusError("Password geli."); return; }
        if (authMode === "signup") {
            if (password.length < 6) { setStatusError("Password-ku waa inuu noqdaa ugu yaraan 6 xaraf."); return; }
            if (password !== confirmPassword) { setStatusError("Password iyo Confirm Password ma is waafaqaan."); return; }
        }
        setIsAuthLoading(true);
        const result = authMode === "signup"
            ? await signupWithEmail(emailInput, password, displayName.trim(), phoneNumber.trim())
            : await loginWithEmail(emailInput, password);
        setIsAuthLoading(false);
        if (!result.success) { setStatusError(result.error || "Auth failed"); return; }
        setAuthCompleted(true);
        setStatusMessage(authMode === "signup" ? "Account created. Choose payment below." : "Logged in. Choose payment below.");
        setPassword(""); setConfirmPassword("");
    };

    const startSifaloCheckout = async (forcePlanId?: PlanId) => {
        const planToPay = forcePlanId || selectedPlan.id;
        setStatusError(""); setStatusMessage(""); setIsPaying(true);
        const bonusDays = planToPay === "monthly" ? Math.min(7, Math.max(0, Number(initialBonusDays) || 0)) : 0;
        const offerCode = bonusDays > 0 ? (String(initialOfferCode || "PAY_MONTHLY_BONUS").trim() || "PAY_MONTHLY_BONUS") : undefined;
        try {
            const res = await fetch("/api/pay/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planToPay, deviceId: deviceId || "unknown", offerBonusDays: bonusDays, offerCode }) });
            const data = await res.json();
            if (!res.ok || !data?.checkoutUrl) { setStatusError(data?.error || "Checkout lama bilaabi karo hadda."); setIsPaying(false); return; }
            window.location.href = String(data.checkoutUrl);
        } catch { setStatusError("Checkout error. Fadlan isku day mar kale."); setIsPaying(false); }
    };

    const startStripeCheckout = async (forcePlanId?: PlanId) => {
        const planToPay = forcePlanId || selectedPlan.id;
        setStatusError(""); setStatusMessage(""); setIsPaying(true);
        const bonusDays = planToPay === "monthly" ? Math.min(7, Math.max(0, Number(initialBonusDays) || 0)) : 0;
        const offerCode = bonusDays > 0 ? (String(initialOfferCode || "PAY_MONTHLY_BONUS").trim() || "PAY_MONTHLY_BONUS") : undefined;
        try {
            const res = await fetch("/api/pay/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planToPay, deviceId: deviceId || "unknown", offerBonusDays: bonusDays, offerCode }) });
            const data = await res.json();
            if (!res.ok || !data?.checkoutUrl) { setStatusError(data?.error || "Stripe checkout could not be started."); setIsPaying(false); return; }
            window.location.href = String(data.checkoutUrl);
        } catch { setStatusError("Checkout error. Please try again."); setIsPaying(false); }
    };

    const handlePay = async () => {
        if (!canProceedToPayment) { setStatusError("Marka hore samee Sign Up ama Login."); return; }
        if (paymentMethod === "stripe") {
            await startStripeCheckout();
        } else {
            await startSifaloCheckout();
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await updateAvatar(file);
    };

    const avatarUrl = (profile as Record<string, unknown>)?.avatarUrl as string | null;

    return (
        <div className="min-h-screen relative overflow-hidden text-white">
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
                    <Link href="/" className="text-2xl font-black inline-block mb-6">FAN<span className="text-[#3B82F6]">BROJ</span></Link>
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
                            const isSelected = card.id === selectedPlanId;
                            const bonusText = card.id === "monthly" && initialBonusDays > 0
                                ? `+${initialBonusDays} days free`
                                : card.bonusText;

                            return (
                                <div
                                    key={card.id}
                                    className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group ${
                                        isSelected
                                            ? `ring-2 ${card.borderColor} ring-offset-2 ring-offset-[#0a0a12] scale-[1.02]`
                                            : "hover:scale-[1.02]"
                                    }`}
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
                                                    {bonusText && (
                                                        <p className="text-green-400 text-xs font-bold mt-0.5">{bonusText}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom — Price, Features, Select */}
                                            <div>
                                                {/* Price */}
                                                <div className="mb-4">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-white/60 text-lg font-bold">$</span>
                                                        <span className="text-5xl font-black text-white">{price.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {/* Select Button */}
                                                <button
                                                    type="button"
                                                    className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all text-black ${card.btnColor} ${
                                                        isSelected ? "ring-2 ring-white/30" : ""
                                                    }`}
                                                >
                                                    {isSelected ? "SELECTED" : "SELECT"}
                                                </button>

                                                {/* Features */}
                                                <div className="mt-3 flex items-center gap-4 text-xs text-white/60">
                                                    <span className="flex items-center gap-1">
                                                        {card.devices === 1 ? <Smartphone size={10} /> : <Monitor size={10} />}
                                                        {card.devices > 1 ? `${card.devices} Devices` : `${card.devices} Device`}
                                                    </span>
                                                    {card.features.map((f) => (
                                                        <span key={f} className="flex items-center gap-1">
                                                            <Check size={10} className="text-green-400" /> {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                                                <Check size={16} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* WHAT YOU GET Sidebar */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 h-fit lg:sticky lg:top-8">
                        <h2 className="text-xl font-black uppercase tracking-wider mb-6">What You Get</h2>
                        <div className="space-y-4">
                            {WHAT_YOU_GET.map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                        <item.icon size={16} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-300 font-medium">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ──────────── CHECKOUT SECTION ──────────── */}
                <div ref={checkoutRef} className="max-w-5xl mx-auto scroll-mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT — Account */}
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500 text-white text-sm font-black">01</span>
                                    <h2 className="text-xl font-black">{canProceedToPayment ? "Account Ready" : "Create Account"}</h2>
                                </div>

                                {canProceedToPayment ? (
                                    <div className="flex items-center gap-4">
                                        <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                            <div className="w-16 h-16 rounded-full bg-[#1a2236] border-2 border-green-500/40 overflow-hidden flex items-center justify-center">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl font-black text-gray-500">{(email || "U")[0].toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera size={16} className="text-white" />
                                            </div>
                                            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-green-400" />
                                                <p className="text-green-400 font-bold text-sm">Logged In</p>
                                            </div>
                                            <p className="text-gray-300 text-sm mt-0.5 break-all">{email || formEmail || "—"}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="inline-flex rounded-lg bg-white/5 p-1 mb-5">
                                            <button type="button" onClick={() => setAuthMode("signup")} className={`px-5 py-2 rounded-md text-sm font-bold transition-colors ${authMode === "signup" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"}`}>Sign Up</button>
                                            <button type="button" onClick={() => setAuthMode("login")} className={`px-5 py-2 rounded-md text-sm font-bold transition-colors ${authMode === "login" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"}`}>Login</button>
                                        </div>

                                        <div className="space-y-3">
                                            <input type="email" value={formEmail || email || ""} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email address" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6] transition-colors" />
                                            {authMode === "signup" && (
                                                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6] transition-colors" />
                                            )}
                                            {authMode === "signup" && (
                                                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone number (e.g. 0612345678)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6] transition-colors" />
                                            )}
                                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6] transition-colors" />
                                            {authMode === "signup" && (
                                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6] transition-colors" />
                                            )}
                                            <button type="button" onClick={handleAuth} disabled={isAuthLoading} className="w-full bg-[#3B82F6] hover:bg-[#2563eb] disabled:opacity-60 rounded-xl py-3.5 font-black text-white transition-colors">
                                                {isAuthLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : authMode === "signup" ? "Create Account" : "Login"}
                                            </button>
                                        </div>

                                        <p className="text-center text-xs text-gray-500 mt-3">
                                            {authMode === "signup" ? "Account hore ma leedahay?" : "Account cusub?"}{" "}
                                            <button type="button" onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")} className="text-[#3B82F6] font-bold hover:underline">
                                                {authMode === "signup" ? "Login" : "Sign Up"}
                                            </button>
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* RIGHT — Payment Method + Pay */}
                        <div className="space-y-6">
                            {/* Step 02 — Payment Method */}
                            <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 transition-opacity ${canProceedToPayment ? "" : "opacity-50 pointer-events-none"}`}>
                                <div className="flex items-center gap-3 mb-5">
                                    <span className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-black ${canProceedToPayment ? "bg-red-500 text-white" : "bg-gray-700 text-gray-400"}`}>02</span>
                                    <h2 className="text-xl font-black">Payment Method</h2>
                                    {!canProceedToPayment && <Lock size={14} className="text-gray-500" />}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Sifalo Checkout */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("sifalo")}
                                        className={`relative rounded-2xl border-2 p-5 text-center transition-all ${
                                            paymentMethod === "sifalo"
                                                ? "border-green-400 bg-green-500/5"
                                                : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                        }`}
                                    >
                                        {paymentMethod === "sifalo" && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                                                <Check size={14} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                        <Shield size={32} className="text-green-400 mx-auto mb-3" />
                                        <p className="font-black text-sm uppercase tracking-wider">Sifalo</p>
                                        <p className="font-black text-sm uppercase tracking-wider">Checkout</p>
                                        <p className="text-[10px] text-gray-500 mt-2">EVC / eDahab / Zaad / Sahal</p>
                                    </button>

                                    {/* Credit Card (Stripe) */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("stripe")}
                                        className={`relative rounded-2xl border-2 p-5 text-center transition-all ${
                                            paymentMethod === "stripe"
                                                ? "border-blue-400 bg-blue-500/5"
                                                : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                        }`}
                                    >
                                        {paymentMethod === "stripe" && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                                                <Check size={14} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                        <CreditCard size={32} className="text-blue-400 mx-auto mb-3" />
                                        <p className="font-black text-sm uppercase tracking-wider">Credit Card</p>
                                        <p className="text-[10px] text-gray-500 mt-2">Mastercard, Visa and more.</p>
                                    </button>
                                </div>
                            </div>

                            {/* Step 03 — Pay */}
                            <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 transition-opacity ${canProceedToPayment ? "" : "opacity-50 pointer-events-none"}`}>
                                <div className="flex items-center gap-3 mb-5">
                                    <span className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-black ${canProceedToPayment ? "bg-red-500 text-white" : "bg-gray-700 text-gray-400"}`}>03</span>
                                    <h2 className="text-xl font-black">Pay</h2>
                                </div>

                                {/* Summary */}
                                <div className="rounded-xl bg-white/5 border border-white/10 p-5 mb-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">{selectedPlan.label}</span>
                                        <span className="text-white font-black text-lg">${selectedPlanPrice.toFixed(2)}</span>
                                    </div>
                                    {initialBonusDays > 0 && selectedPlan.id === "monthly" && (
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-green-400 text-sm">+{initialBonusDays} bonus days</span>
                                            <span className="text-green-400 text-sm font-bold">FREE</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/10 my-3" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-bold">Total</span>
                                        <span className="text-3xl font-black text-white">${selectedPlanPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 text-center mb-4">
                                    {paymentMethod === "stripe"
                                        ? "You'll be redirected to Stripe secure checkout"
                                        : "You'll be redirected to Sifalo Pay checkout"}
                                </p>

                                {/* Pay Button */}
                                <button
                                    type="button"
                                    onClick={handlePay}
                                    disabled={isPaying || !canProceedToPayment}
                                    className="w-full bg-[#2196F3] hover:bg-[#1e88e5] disabled:opacity-50 rounded-xl py-4 font-black text-xl transition-colors flex items-center justify-center gap-3"
                                >
                                    {isPaying ? <Loader2 size={22} className="animate-spin" /> : null}
                                    {!canProceedToPayment ? "Create Account First" : isPaying ? "Processing..." : `PAY $${selectedPlanPrice.toFixed(2)}`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {(statusMessage || statusError) && (
                        <div className={`mt-6 rounded-xl border p-4 text-center text-sm ${statusError ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-green-500/30 bg-green-500/10 text-green-300"}`}>
                            {statusError || statusMessage}
                        </div>
                    )}

                    {/* Trust Badges */}
                    <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
                        {[
                            { icon: ShieldCheck, label: "Secure Payment", color: "text-green-400" },
                            { icon: Zap, label: "Instant Activation", color: "text-yellow-400" },
                            { icon: MessageCircle, label: "WhatsApp 24/7", color: "text-[#25D366]" },
                        ].map((badge) => (
                            <div key={badge.label} className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                                <badge.icon size={20} className={badge.color} />
                                <p className="text-xs text-gray-400 text-center font-medium">{badge.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Payment methods footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500 mb-2">Accepted Payment Methods</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {["EVC Plus", "Zaad", "Sahal", "eDahab", "Visa", "Mastercard", "Apple Pay"].map((m) => (
                                <span key={m} className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-full border border-white/5">{m}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PayPageContent() {
    const searchParams = useSearchParams();
    const sid = searchParams.get("sid");
    const orderId = searchParams.get("order_id");
    const stripeSession = searchParams.get("stripe_session");
    const planParam = (searchParams.get("plan") || "").trim().toLowerCase();
    const authParam = (searchParams.get("auth") || "").trim().toLowerCase();
    const bonusDaysParam = Number(searchParams.get("bonusDays") || "0");
    const offerCodeParam = String(searchParams.get("offerCode") || "").trim();
    const initialPlanId: PlanId = ["match", "weekly", "monthly", "yearly"].includes(planParam) ? (planParam as PlanId) : "monthly";
    const initialAuthMode: "signup" | "login" = authParam === "login" ? "login" : "signup";
    const initialBonusDays = Number.isFinite(bonusDaysParam) ? Math.min(7, Math.max(0, Math.floor(bonusDaysParam))) : 0;

    if (sid || orderId || stripeSession) return <PaymentVerifier sid={sid} orderId={orderId} stripeSession={stripeSession} />;
    return <CheckoutHub initialPlanId={initialPlanId} initialAuthMode={initialAuthMode} initialBonusDays={initialBonusDays} initialOfferCode={offerCodeParam} />;
}

export default function PayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a12]"><Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" /></div>}>
            <PayPageContent />
        </Suspense>
    );
}
