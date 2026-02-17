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
    Crown,
    Loader2,
    Lock,
    MessageCircle,
    RefreshCw,
    Shield,
    ShieldCheck,
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

function getPlanPrice(settings: SettingsResponse | undefined, plan: PlanOption): number {
    const raw = Number(settings?.[plan.priceKey]);
    if (Number.isFinite(raw) && raw > 0) return raw;
    return plan.defaultPrice;
}

/* ────────────────────────────────────────────── */
/*  PaymentVerifier (unchanged)                   */
/* ────────────────────────────────────────────── */
function PaymentVerifier({ sid, orderId }: { sid: string | null; orderId: string | null }) {
    const [status, setStatus] = useState<"verifying" | "success" | "failed" | "pending" | "error">("verifying");
    const [message, setMessage] = useState("");
    const [plan, setPlan] = useState("");
    const [accessCode, setAccessCode] = useState("");
    const [isCodeCopied, setIsCodeCopied] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [autoPollCount, setAutoPollCount] = useState(0);
    const MAX_AUTO_POLLS = 10;
    const hasQueryToken = Boolean(sid || orderId);

    const verifyPayment = useCallback(async () => {
        try {
            setStatus("verifying");
            const deviceId = localStorage.getItem("fanbroj_device_id");
            if (!deviceId) { setStatus("error"); setMessage("Device ID lama helin. Fadlan la xiriir taageerada."); return; }
            const res = await fetch("/api/pay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sid, orderId, deviceId }) });
            const data = await res.json();
            if (data.success) { setStatus("success"); setMessage(data.message || "Premium wuu kuu shaqeynayaa!"); setPlan(data.plan || ""); if (data.code) { setAccessCode(String(data.code)); localStorage.setItem("fanbroj_last_payment_code", String(data.code)); } }
            else if (data.status === "pending") { setStatus("pending"); setMessage("Lacagta wali way socotaa..."); }
            else { setStatus("failed"); setMessage(data.message || data.error || "Xaqiijinta lacagtu way fashilmatay."); }
        } catch { setStatus("error"); setMessage("Khalad ayaa dhacay. Fadlan isku day mar kale."); }
    }, [sid, orderId]);

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
/*  CheckoutHub — NEW lookmovie-style design      */
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
    const { deviceId, userId, email, profile, signupWithEmail, loginWithEmail, updateAvatar } = useUser();

    const [authMode, setAuthMode] = useState<"signup" | "login">(initialAuthMode);
    const [formEmail, setFormEmail] = useState(email || "");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initialPlanId);
    const [paymentMethod, setPaymentMethod] = useState<"sifalo" | "store">("sifalo");
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [authCompleted, setAuthCompleted] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusError, setStatusError] = useState("");
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const canProceedToPayment = Boolean(email || authCompleted);

    const selectedPlan = useMemo(
        () => PLAN_OPTIONS.find((p) => p.id === selectedPlanId) || PLAN_OPTIONS[0],
        [selectedPlanId]
    );
    const selectedPlanPrice = useMemo(
        () => getPlanPrice(settings, selectedPlan),
        [settings, selectedPlan]
    );
    const storeUrl = String(process.env.NEXT_PUBLIC_STORE_CHECKOUT_URL || "https://somaliwebsite.com");

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
            ? await signupWithEmail(emailInput, password, displayName.trim())
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

    const handlePay = async () => {
        if (!canProceedToPayment) { setStatusError("Marka hore samee Sign Up ama Login."); return; }
        if (paymentMethod === "store") {
            const params = new URLSearchParams();
            params.set("plan", selectedPlan.id); params.set("amount", selectedPlanPrice.toFixed(2)); params.set("src", "fanbroj_pay");
            if (email) params.set("email", email);
            window.open(`${storeUrl}${storeUrl.includes("?") ? "&" : "?"}${params}`, "_blank", "noopener,noreferrer");
            setStatusMessage("Waxaan kuu furnay SomaliWebsite store si aad Stripe/PayPal uga bixiso.");
            return;
        }
        await startSifaloCheckout();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await updateAvatar(file);
    };

    const avatarUrl = (profile as any)?.avatarUrl || null;

    return (
        <div className="min-h-screen relative overflow-hidden text-white">
            {/* Background */}
            <div className="fixed inset-0 -z-10 bg-[#0a0e17]">
                <Image src="/img/icons/background.png" alt="" fill className="object-cover opacity-40" priority />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17]/60 via-[#0a0e17]/80 to-[#0a0e17]" />
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 md:py-14">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="text-2xl font-black">FAN<span className="text-[#3B82F6]">BROJ</span></Link>
                    <h1 className="text-3xl md:text-4xl font-black mt-4">Premium Checkout</h1>
                    <p className="text-gray-400 mt-2">Hal account, hal lacag-bixin, daawasho deggan.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN — Account */}
                    <div className="space-y-6">
                        {/* Step 01 — Account */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B82F6] text-white text-sm font-black">01</span>
                                <h2 className="text-lg font-black">{canProceedToPayment ? "Account Ready" : "Create Account"}</h2>
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
                                        <div className="relative">
                                            <input type="email" value={formEmail || email || ""} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email address" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6] transition-colors" />
                                        </div>
                                        {authMode === "signup" && (
                                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6] transition-colors" />
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

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-3">
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
                    </div>

                    {/* RIGHT COLUMN — Payment + Plan */}
                    <div className="space-y-6">
                        {/* Step 02 — Payment Method */}
                        <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 transition-opacity ${canProceedToPayment ? "" : "opacity-50 pointer-events-none"}`}>
                            <div className="flex items-center gap-3 mb-5">
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${canProceedToPayment ? "bg-[#3B82F6] text-white" : "bg-gray-700 text-gray-400"}`}>02</span>
                                <h2 className="text-lg font-black">Payment Method</h2>
                                {!canProceedToPayment && <Lock size={14} className="text-gray-500" />}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setPaymentMethod("sifalo")} className={`relative rounded-xl border-2 p-4 text-left transition-all ${paymentMethod === "sifalo" ? "border-green-400 bg-green-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                                    {paymentMethod === "sifalo" && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                                    <Shield size={24} className="text-green-400 mb-2" />
                                    <p className="font-bold text-sm">Sifalo Checkout</p>
                                    <p className="text-xs text-gray-500 mt-1">EVC / eDahab / Zaad / Sahal</p>
                                </button>
                                <button type="button" onClick={() => setPaymentMethod("store")} className={`relative rounded-xl border-2 p-4 text-left transition-all ${paymentMethod === "store" ? "border-blue-400 bg-blue-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                                    {paymentMethod === "store" && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>}
                                    <Crown size={24} className="text-blue-400 mb-2" />
                                    <p className="font-bold text-sm">Stripe / PayPal</p>
                                    <p className="text-xs text-gray-500 mt-1">SomaliWebsite Store</p>
                                </button>
                            </div>
                        </div>

                        {/* Step 03 — Plan & Pay */}
                        <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 transition-opacity ${canProceedToPayment ? "" : "opacity-50 pointer-events-none"}`}>
                            <div className="flex items-center gap-3 mb-5">
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${canProceedToPayment ? "bg-[#3B82F6] text-white" : "bg-gray-700 text-gray-400"}`}>03</span>
                                <h2 className="text-lg font-black">Choose Plan & Pay</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-5">
                                {PLAN_OPTIONS.map((plan) => {
                                    const price = getPlanPrice(settings, plan);
                                    const active = plan.id === selectedPlanId;
                                    return (
                                        <button key={plan.id} type="button" onClick={() => setSelectedPlanId(plan.id)} className={`rounded-xl border-2 p-3 text-left transition-all ${active ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                                            <p className="font-bold text-sm">{plan.label}</p>
                                            <p className="text-[10px] text-gray-500">{plan.duration}</p>
                                            <p className="text-lg font-black mt-1">${price.toFixed(2)}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {initialBonusDays > 0 && selectedPlan.id === "monthly" && (
                                <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center">
                                    <p className="text-sm font-bold text-green-300">+{initialBonusDays} maalmood bilaash</p>
                                </div>
                            )}

                            {/* Summary + Pay Button */}
                            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Plan</p>
                                        <p className="text-white font-bold">{selectedPlan.label} — {selectedPlan.duration}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                                        <p className="text-2xl font-black text-white">${selectedPlanPrice.toFixed(2)}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={handlePay} disabled={isPaying || !canProceedToPayment} className="w-full bg-[#3B82F6] hover:bg-[#2563eb] disabled:opacity-50 rounded-xl py-4 font-black text-lg transition-colors flex items-center justify-center gap-2">
                                    {isPaying ? <Loader2 size={20} className="animate-spin" /> : null}
                                    {!canProceedToPayment ? "Create Account First" : isPaying ? "Processing..." : `PAY $${selectedPlanPrice.toFixed(2)}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Messages */}
                {(statusMessage || statusError) && (
                    <div className={`mt-6 max-w-5xl mx-auto rounded-xl border p-4 text-center text-sm ${statusError ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-green-500/30 bg-green-500/10 text-green-300"}`}>
                        {statusError || statusMessage}
                    </div>
                )}

                {/* Payment methods footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500 mb-2">Accepted Payment Methods</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {["EVC Plus", "Zaad", "Sahal", "eDahab", "Card", "Apple Pay"].map((m) => (
                            <span key={m} className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-full border border-white/5">{m}</span>
                        ))}
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
    const planParam = (searchParams.get("plan") || "").trim().toLowerCase();
    const authParam = (searchParams.get("auth") || "").trim().toLowerCase();
    const bonusDaysParam = Number(searchParams.get("bonusDays") || "0");
    const offerCodeParam = String(searchParams.get("offerCode") || "").trim();
    const initialPlanId: PlanId = ["match", "weekly", "monthly", "yearly"].includes(planParam) ? (planParam as PlanId) : "monthly";
    const initialAuthMode: "signup" | "login" = authParam === "login" ? "login" : "signup";
    const initialBonusDays = Number.isFinite(bonusDaysParam) ? Math.min(7, Math.max(0, Math.floor(bonusDaysParam))) : 0;

    if (sid || orderId) return <PaymentVerifier sid={sid} orderId={orderId} />;
    return <CheckoutHub initialPlanId={initialPlanId} initialAuthMode={initialAuthMode} initialBonusDays={initialBonusDays} initialOfferCode={offerCodeParam} />;
}

export default function PayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0e17]"><Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" /></div>}>
            <PayPageContent />
        </Suspense>
    );
}
