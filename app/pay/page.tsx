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
    Loader2,
    Lock,
    RefreshCw,
    Shield,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import { PLAN_OPTIONS, PlanId, getPlanPrice } from "@/lib/plans";

type SettingsResponse = Record<string, unknown>;
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<SettingsResponse>);
const fetcherGeneric = (url: string) => fetch(url).then((r) => r.json());

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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0a0a12] via-[#0f1420] to-[#0a0a12]">
            <div className="max-w-md w-full">
                {displayStatus === "verifying" && (
                    <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-8"><div className="absolute inset-0 rounded-full border-4 border-white/10" /><div className="absolute inset-0 rounded-full border-4 border-t-[#3B82F6] animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><Crown className="text-[#3B82F6]" size={32} /></div></div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta la xaqiijinayaa...</h1>
                        <p className="text-gray-400">Fadlan sug ilaa lacagta la xaqiijiyo</p>
                    </div>
                )}
                {displayStatus === "success" && (
                    <div className="text-center animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/30"><CheckCircle2 className="text-green-500" size={48} /></div>
                        <h1 className="text-3xl font-black text-white mb-2">Waad ku guulaysatay!</h1>
                        <p className="text-green-400 text-lg font-bold mb-2">{displayMessage}</p>
                        {plan && <div className="inline-block bg-yellow-400/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold uppercase mb-8">{plan} wuu kuu shaqeynayaa</div>}
                        {accessCode && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Auto Premium Code</p>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-mono text-lg text-white tracking-wider">{accessCode}</p>
                                    <button onClick={handleCopyCode} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center gap-1">
                                        {isCodeCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}{isCodeCopied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3 mt-6">
                            <Link href="/" className="flex items-center justify-center gap-2 w-full bg-[#3B82F6] text-white font-bold py-4 rounded-xl hover:bg-[#2563eb] transition-all text-lg">Bilow Daawashada <ArrowRight size={20} /></Link>
                            <Link href="/subscription" className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all">Arag Subscription-kaaga</Link>
                        </div>
                    </div>
                )}
                {displayStatus === "pending" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Loader2 className="text-yellow-400 animate-spin" size={48} /></div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta wali ma dhammaanin</h1>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <p className="text-sm text-gray-500 mb-6">Haddii aad lacagta bixisay, fadlan sug daqiiqado yar oo ku dhufo "Isku day mar kale"</p>
                        <p className="text-xs text-gray-500 mb-6">Auto-check: {Math.min(autoPollCount, MAX_AUTO_POLLS)} / {MAX_AUTO_POLLS}</p>
                        <button onClick={handleRetry} className="flex items-center justify-center gap-2 w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"><RefreshCw size={18} />Isku day mar kale</button>
                    </div>
                )}
                {displayStatus === "failed" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle className="text-red-500" size={48} /></div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta ma shaqeyn</h1>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <div className="space-y-3">
                            <Link href="/pricing" className="flex items-center justify-center gap-2 w-full bg-[#3B82F6] text-white font-bold py-3 rounded-xl hover:bg-[#2563eb] transition-all">Isku day mar kale</Link>
                            <button onClick={handleRetry} className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"><RefreshCw size={18} />Xaqiiji mar kale</button>
                        </div>
                    </div>
                )}
                {displayStatus === "error" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle className="text-red-500" size={48} /></div>
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
/*  CheckoutHub — LookMovie-style checkout layout */
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
    const { data: geo, isLoading: geoLoading } = useSWR<{ country: string | null; multiplier: number }>("/api/geo", fetcherGeneric);
    // Don't fall back to 1 — wait until geo is confirmed to avoid price mismatch
    const geoReady = !geoLoading && geo !== undefined;
    const geoMultiplier = geo?.multiplier ?? 1;
    const { deviceId, email, profile, signupWithEmail, loginWithEmail, updateAvatar } = useUser();

    // Determine the actual Plan option safely.
    const selectedPlan = useMemo(() => PLAN_OPTIONS.find((p) => p.id === initialPlanId) || PLAN_OPTIONS[0], [initialPlanId]);
    const basePlanPrice = useMemo(() => getPlanPrice(settings, selectedPlan), [settings, selectedPlan]);
    const selectedPlanPrice = useMemo(() => Math.round(basePlanPrice * geoMultiplier * 100) / 100, [basePlanPrice, geoMultiplier]);

    const [authMode, setAuthMode] = useState<"signup" | "login">(initialAuthMode);
    const [formEmail, setFormEmail] = useState(email || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Payment + loading state
    const [paymentMethod, setPaymentMethod] = useState<"sifalo" | "stripe" | "paypal" | "mpesa">("stripe");
    const [paypalTxId, setPaypalTxId] = useState("");
    const [mpesaTxId, setMpesaTxId] = useState("");
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [authCompleted, setAuthCompleted] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusError, setStatusError] = useState("");

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const canProceedToPayment = Boolean(email || authCompleted);

    const handleAuth = async () => {
        setStatusError(""); setStatusMessage("");
        const emailInput = (formEmail || email || "").trim();
        if (!emailInput) { setStatusError("Email waa loo baahan yahay."); return; }
        if (!password.trim()) { setStatusError("Password waa loo baahan yahay."); return; }
        if (authMode === "signup") {
            if (password.length < 6) { setStatusError("Password waa inuu noqdaa ugu yaraan 6 xaraf."); return; }
            if (password !== confirmPassword) { setStatusError("Password-yada isma waafaqsana."); return; }
        }
        setIsAuthLoading(true);
        const result = authMode === "signup"
            ? await signupWithEmail(emailInput, password, "", "") // Cleaned up unwanted fields
            : await loginWithEmail(emailInput, password);
        setIsAuthLoading(false);

        if (!result.success) { setStatusError(result.error || "Authentication failed."); return; }
        setAuthCompleted(true);
        setStatusMessage(authMode === "signup" ? "Account created successfully. You can now checkout." : "Logged in successfully.");
        setPassword(""); setConfirmPassword("");
    };

    const startSifaloCheckout = async () => {
        setStatusError(""); setStatusMessage(""); setIsPaying(true);
        const bonusDays = selectedPlan.id === "monthly" ? Math.min(7, Math.max(0, Number(initialBonusDays) || 0)) : 0;
        const offerCode = bonusDays > 0 ? (String(initialOfferCode || "PAY_MONTHLY_BONUS").trim() || "PAY_MONTHLY_BONUS") : undefined;
        try {
            const res = await fetch("/api/pay/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: selectedPlan.id, deviceId: deviceId || "unknown", offerBonusDays: bonusDays, offerCode }) });
            const data = await res.json();
            if (!res.ok || !data?.checkoutUrl) { setStatusError(data?.error || "Checkout lama bilaabi karo hadda."); setIsPaying(false); return; }
            window.location.href = String(data.checkoutUrl);
        } catch { setStatusError("Checkout error. Fadlan isku day mar kale."); setIsPaying(false); }
    };

    const startStripeCheckout = async () => {
        setStatusError(""); setStatusMessage(""); setIsPaying(true);
        const bonusDays = selectedPlan.id === "monthly" ? Math.min(7, Math.max(0, Number(initialBonusDays) || 0)) : 0;
        const offerCode = bonusDays > 0 ? (String(initialOfferCode || "PAY_MONTHLY_BONUS").trim() || "PAY_MONTHLY_BONUS") : undefined;
        try {
            const res = await fetch("/api/pay/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: selectedPlan.id, deviceId: deviceId || "unknown", offerBonusDays: bonusDays, offerCode }) });
            const data = await res.json();
            if (!res.ok || !data?.checkoutUrl) { setStatusError(data?.error || "Stripe checkout could not be started."); setIsPaying(false); return; }
            window.location.href = String(data.checkoutUrl);
        } catch { setStatusError("Checkout error. Please try again."); setIsPaying(false); }
    };

    const startMpesaCheckout = async () => {
        setStatusError(""); setStatusMessage(""); setIsPaying(true);
        const txId = mpesaTxId.trim().toUpperCase();
        if (!txId) { setStatusError("Please enter your M-Pesa Transaction Code."); setIsPaying(false); return; }
        const bonusDays = selectedPlan.id === "monthly" ? Math.min(7, Math.max(0, Number(initialBonusDays) || 0)) : 0;
        const offerCode = bonusDays > 0 ? (String(initialOfferCode || "PAY_MONTHLY_BONUS").trim() || "PAY_MONTHLY_BONUS") : undefined;
        try {
            const res = await fetch("/api/pay/mpesa/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: selectedPlan.id, deviceId: deviceId || "unknown", mpesaTxId: txId, offerBonusDays: bonusDays, offerCode }) });
            const data = await res.json();
            if (!res.ok || !data?.orderId) { setStatusError(data?.error || "M-Pesa submission failed. Please try again."); setIsPaying(false); return; }
            window.location.href = `/pay?order_id=${encodeURIComponent(String(data.orderId))}`;
        } catch { setStatusError("Submission error. Please try again."); setIsPaying(false); }
    };

    const startPaypalCheckout = async () => {
        setStatusError(""); setStatusMessage(""); setIsPaying(true);
        const txId = paypalTxId.trim();
        if (!txId) { setStatusError("Fadlan geli PayPal Transaction ID-gaaga."); setIsPaying(false); return; }
        const bonusDays = selectedPlan.id === "monthly" ? Math.min(7, Math.max(0, Number(initialBonusDays) || 0)) : 0;
        const offerCode = bonusDays > 0 ? (String(initialOfferCode || "PAY_MONTHLY_BONUS").trim() || "PAY_MONTHLY_BONUS") : undefined;
        try {
            const res = await fetch("/api/pay/paypal/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: selectedPlan.id, deviceId: deviceId || "unknown", paypalTxId: txId, offerBonusDays: bonusDays, offerCode }) });
            const data = await res.json();
            if (!res.ok || !data?.orderId) { setStatusError(data?.error || "PayPal submission failed. Please try again."); setIsPaying(false); return; }
            window.location.href = `/pay?order_id=${encodeURIComponent(String(data.orderId))}`;
        } catch { setStatusError("Submission error. Please try again."); setIsPaying(false); }
    };

    const handlePay = async () => {
        if (!canProceedToPayment) { setStatusError("Fadlan isdiiwaangeli ama gal accountka."); return; }
        if (paymentMethod === "stripe") {
            await startStripeCheckout();
        } else if (paymentMethod === "paypal") {
            await startPaypalCheckout();
        } else if (paymentMethod === "mpesa") {
            await startMpesaCheckout();
        } else {
            await startSifaloCheckout();
        }
    };

    const avatarUrl = (profile as Record<string, unknown>)?.avatarUrl as string | null;
    const isEditingAuth = !canProceedToPayment;

    return (
        <div className="min-h-screen bg-[#060b13] text-[#e1e2e6] selection:bg-[#FF1A4E] selection:text-white font-sans relative overflow-hidden pb-32">
            {/* Background Lines */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] bg-[linear-gradient(45deg,rgba(59,130,246,0.1)0%,transparent_40%,transparent_60%,rgba(255,26,78,0.1)100%)]" />
            </div>

            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-12">
                    <Link href="/" className="text-2xl font-black tracking-tighter">FAN<span className="text-[#ff003e]">BROJ</span></Link>
                    <Link href="/pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">CHANGE PLAN</Link>
                </div>

                {/*
                  Mobile order: 01 Create Account → 02 Payment Method → 03 Pay
                  Desktop: 2-col grid — left col has 01+03, right col has 02 (spans both rows)
                  Achieved by: flex-col on mobile (DOM order), CSS grid on lg with explicit placement
                */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-12 gap-y-10">

                    {/* ── 01 Create Account ── col1 row1 on desktop */}
                    <section className="lg:col-start-1 lg:row-start-1 lg:pr-8">
                        <h2 className="text-3xl font-black mb-8 flex items-end gap-3 tracking-wide">
                            <span className="text-4xl text-[#ff003e] font-light leading-none">01</span> Create Account
                        </h2>

                        {isEditingAuth ? (
                            <div className="space-y-5">
                                <div className="flex items-center gap-6 mb-4">
                                    <label className={`cursor-pointer font-bold border-b-2 pb-1 ${authMode === 'signup' ? 'text-white border-[#ff003e]' : 'text-gray-500 border-transparent hover:text-gray-300'}`} onClick={() => setAuthMode('signup')}>New Account</label>
                                    <label className={`cursor-pointer font-bold border-b-2 pb-1 ${authMode === 'login' ? 'text-white border-[#ff003e]' : 'text-gray-500 border-transparent hover:text-gray-300'}`} onClick={() => setAuthMode('login')}>I Have An Account</label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="sm:col-span-2 relative">
                                        <label className="absolute -top-2.5 left-4 bg-[#060b13] px-2 text-xs font-bold text-gray-400">Email</label>
                                        <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="example@email.com" className="w-full bg-transparent border border-[#2a303c] rounded-md px-4 py-4 focus:outline-none focus:border-[#ff003e] transition-colors" />
                                    </div>
                                    <div className="relative">
                                        <label className="absolute -top-2.5 left-4 bg-[#060b13] px-2 text-xs font-bold text-gray-400">Password</label>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="**********" className="w-full bg-transparent border border-[#2a303c] rounded-md px-4 py-4 focus:outline-none focus:border-[#ff003e] transition-colors" />
                                    </div>
                                    {authMode === "signup" && (
                                        <div className="relative">
                                            <label className="absolute -top-2.5 left-4 bg-[#060b13] px-2 text-xs font-bold text-gray-400">Confirm Password</label>
                                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="**********" className="w-full bg-transparent border border-[#2a303c] rounded-md px-4 py-4 focus:outline-none focus:border-[#ff003e] transition-colors" />
                                        </div>
                                    )}
                                    <div className="sm:col-span-2 pt-2">
                                        <button type="button" onClick={handleAuth} disabled={isAuthLoading} className="w-full sm:w-auto px-8 bg-[#2a303c] hover:bg-[#323947] disabled:opacity-50 py-3 rounded-md font-bold text-white transition-colors">
                                            {isAuthLoading ? "Sending..." : "Continue"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-[#2a303c] rounded-lg p-6 flex flex-col sm:flex-row items-center gap-5 relative bg-[#0b101a] backdrop-blur-sm">
                                <div className="absolute top-4 right-4 text-green-500 flex items-center gap-1.5 text-xs font-bold bg-green-500/10 px-2.5 py-1 rounded-full"><CheckCircle2 size={12} /> Ready</div>
                                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                    <div className="w-16 h-16 rounded-full border border-[#2a303c] bg-[#1a202c] overflow-hidden flex items-center justify-center">
                                        {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-2xl text-gray-500 uppercase">{(email || "U")[0]}</span>}
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera size={16} /></div>
                                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { if (e.target.files?.[0]) updateAvatar(e.target.files[0]) }} />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg">{email || formEmail}</p>
                                    <p className="text-gray-400 text-sm mt-0.5">Account verified and ready for checkout</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ── 02 Payment Method ── col2 rows 1-2 on desktop; position 2 on mobile */}
                    <section className={`lg:col-start-2 lg:row-start-1 lg:row-span-2 transition-opacity duration-300 ${isEditingAuth ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <h2 className="text-3xl font-black mb-8 flex items-end gap-3 tracking-wide">
                            <span className="text-4xl text-[#ff003e] font-light leading-none">02</span> Payment Method
                        </h2>
                        <div className="grid grid-cols-2 gap-3">

                            {/* Credit Card / Stripe */}
                            <div
                                onClick={() => setPaymentMethod('stripe')}
                                className={`relative rounded-xl border-2 p-4 cursor-pointer overflow-hidden transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] sm:min-h-[130px] ${paymentMethod === 'stripe' ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_18px_rgba(59,130,246,0.15)]' : 'border-[#2a303c] bg-transparent hover:border-[#4b5563] hover:bg-white/[0.02]'}`}
                            >
                                {paymentMethod === 'stripe' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-xl" />}
                                {paymentMethod === 'stripe' && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                        <Check size={11} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                                <div className="text-2xl mb-2">💳</div>
                                <h3 className="font-extrabold text-sm text-white uppercase tracking-wide mb-1">Credit Card</h3>
                                <p className="text-[10px] text-gray-500 text-center">Visa / MC / Amex</p>
                            </div>

                            {/* Mobile Money / Sifalo */}
                            <div
                                onClick={() => setPaymentMethod('sifalo')}
                                className={`relative rounded-xl border-2 p-4 cursor-pointer overflow-hidden transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] sm:min-h-[130px] ${paymentMethod === 'sifalo' ? 'border-orange-400 bg-orange-400/5 shadow-[0_0_18px_rgba(251,146,60,0.15)]' : 'border-[#2a303c] bg-[#0f1520] hover:border-[#4b5563]'}`}
                            >
                                {paymentMethod === 'sifalo' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-400 rounded-t-xl" />}
                                {paymentMethod === 'sifalo' && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center">
                                        <Check size={11} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                                <div className="text-2xl mb-2">📱</div>
                                <h3 className="font-extrabold text-sm text-white uppercase tracking-wide mb-1">Mobile Money</h3>
                                <p className="text-[10px] text-gray-500 text-center">EVC · Zaad · Sahal</p>
                            </div>

                            {/* PayPal */}
                            <div
                                onClick={() => setPaymentMethod('paypal')}
                                className={`relative rounded-xl border-2 p-4 cursor-pointer overflow-hidden transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] sm:min-h-[130px] ${paymentMethod === 'paypal' ? 'border-[#009cde] bg-[#009cde]/5 shadow-[0_0_18px_rgba(0,156,222,0.15)]' : 'border-[#2a303c] bg-transparent hover:border-[#4b5563] hover:bg-white/[0.02]'}`}
                            >
                                {paymentMethod === 'paypal' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#009cde] rounded-t-xl" />}
                                {paymentMethod === 'paypal' && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#009cde] flex items-center justify-center">
                                        <Check size={11} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                                <div className="text-2xl mb-2">🅿️</div>
                                <h3 className="font-extrabold text-sm text-white uppercase tracking-wide mb-1">PayPal</h3>
                                <p className="text-[10px] text-gray-500 text-center">Send & submit TX</p>
                            </div>

                            {/* M-Pesa */}
                            <div
                                onClick={() => setPaymentMethod('mpesa')}
                                className={`relative rounded-xl border-2 p-4 cursor-pointer overflow-hidden transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] sm:min-h-[130px] ${paymentMethod === 'mpesa' ? 'border-[#4CAF50] bg-[#4CAF50]/5 shadow-[0_0_18px_rgba(76,175,80,0.15)]' : 'border-[#2a303c] bg-transparent hover:border-[#4b5563] hover:bg-white/[0.02]'}`}
                            >
                                {paymentMethod === 'mpesa' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4CAF50] rounded-t-xl" />}
                                {paymentMethod === 'mpesa' && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#4CAF50] flex items-center justify-center">
                                        <Check size={11} className="text-white" strokeWidth={3} />
                                    </div>
                                )}
                                <div className="text-2xl mb-2">🌿</div>
                                <h3 className="font-extrabold text-sm text-white uppercase tracking-wide mb-1">M-Pesa</h3>
                                <p className="text-[10px] text-gray-500 text-center">Kenya Mobile Money</p>
                            </div>

                        </div>

                        {/* What's included — fills empty space below payment cards */}
                        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-5">
                            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-4">Waxaad Helaysaa</p>
                            <div className="space-y-3">
                                {[
                                    { icon: "🎬", label: "724+ Filim Af Somali" },
                                    { icon: "⚽", label: "Ciyaaro Live — HD & 4K" },
                                    { icon: "📺", label: "Smart TV + Mobile + PC" },
                                    { icon: "🚫", label: "Bilaa Xayeysiis (No Ads)" },
                                    { icon: "⚡", label: "Premium isla markiiba furmaa" },
                                    { icon: "💬", label: "WhatsApp Support 24/7" },
                                ].map((feat) => (
                                    <div key={feat.label} className="flex items-center gap-3">
                                        <span className="text-base w-6 flex-shrink-0">{feat.icon}</span>
                                        <span className="text-sm text-gray-300">{feat.label}</span>
                                        <Check size={13} className="text-green-400 ml-auto flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security strip */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-gray-600">
                            <span className="flex items-center gap-1"><Lock size={11} /> SSL Encrypted</span>
                            <span className="flex items-center gap-1"><Shield size={11} /> Secure Checkout</span>
                            <span className="flex items-center gap-1">🔒 Data Protected</span>
                        </div>
                    </section>

                    {/* ── 03 Pay ── col1 row2 on desktop; position 3 on mobile */}
                    <section className={`lg:col-start-1 lg:row-start-2 lg:pr-8 transition-opacity duration-300 ${isEditingAuth ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <h2 className="text-3xl font-black mb-6 flex items-end gap-3 tracking-wide">
                            <span className="text-4xl text-[#ff003e] font-light leading-none">03</span> Pay
                        </h2>
                        <div className="border border-[#2a303c] rounded-xl p-6 sm:p-8 bg-[#0b101a]/50 backdrop-blur-md space-y-6">

                            {/* Order Summary */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-base font-medium">{selectedPlan.label}</span>
                                    {geoReady
                                        ? <span className="text-2xl font-bold text-white">${selectedPlanPrice.toFixed(2)}</span>
                                        : <span className="w-20 h-7 rounded bg-white/10 animate-pulse inline-block" />
                                    }
                                </div>
                                {initialBonusDays > 0 && selectedPlan.id === "monthly" && (
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-green-400 text-sm font-bold">+{initialBonusDays} Days FREE Bonus</span>
                                        <span className="text-green-400 text-sm font-bold">$0.00</span>
                                    </div>
                                )}
                                <div className="h-px bg-[#2a303c] my-4" />
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-bold text-lg">Total</span>
                                    {geoReady
                                        ? <span className="text-3xl font-black text-white">${selectedPlanPrice.toFixed(2)}</span>
                                        : <span className="w-24 h-9 rounded bg-white/10 animate-pulse inline-block" />
                                    }
                                </div>
                            </div>

                            {/* Trust badges */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm text-gray-300"><Lock size={14} className="text-green-400 flex-shrink-0" /> Lacag-bixin ammaan ah</div>
                                <div className="flex items-center gap-2 text-sm text-gray-300"><Shield size={14} className="text-green-400 flex-shrink-0" /> {paymentMethod === "stripe" ? "Stripe" : paymentMethod === "paypal" ? "PayPal" : paymentMethod === "mpesa" ? "M-Pesa" : "Sifalo"} Secure</div>
                                <div className="flex items-center gap-2 text-sm text-gray-300"><CreditCard size={14} className="text-green-400 flex-shrink-0" /> Premium isla markiiba furmaa</div>
                                <div className="flex items-center gap-2 text-sm text-gray-300"><Crown size={14} className="text-green-400 flex-shrink-0" /> WhatsApp 24/7</div>
                            </div>

                            {/* M-Pesa step-by-step guide */}
                            {paymentMethod === "mpesa" && (
                                <div className="rounded-xl border border-[#4CAF50]/30 bg-[#4CAF50]/5 p-5 space-y-4">
                                    <p className="text-white font-bold text-base">How to pay with M-Pesa:</p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <span className="w-7 h-7 rounded-full bg-[#4CAF50] text-white text-sm font-black flex items-center justify-center flex-shrink-0">1</span>
                                            <p className="text-gray-300 text-sm leading-relaxed pt-0.5">
                                                Open M-Pesa and send{" "}
                                                <span className="text-white font-black text-base">${selectedPlanPrice.toFixed(2)}</span>{" "}
                                                to:<br />
                                                <span className="text-[#4CAF50] font-black text-base">0797415296</span>
                                                <span className="text-gray-400 text-sm"> — Abdullahi Ahmed</span>
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="w-7 h-7 rounded-full bg-[#4CAF50] text-white text-sm font-black flex items-center justify-center flex-shrink-0">2</span>
                                            <p className="text-gray-300 text-sm leading-relaxed pt-0.5">
                                                After sending, check your M-Pesa SMS for the <span className="text-white font-bold">Transaction Code</span> (looks like: QJK2ABCDE5)
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="w-7 h-7 rounded-full bg-[#4CAF50] text-white text-sm font-black flex items-center justify-center flex-shrink-0">3</span>
                                            <p className="text-gray-300 text-sm leading-relaxed pt-0.5">Paste the code below and click Submit</p>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={mpesaTxId}
                                        onChange={e => setMpesaTxId(e.target.value.toUpperCase())}
                                        placeholder="Paste M-Pesa code e.g. QJK2ABCDE5"
                                        className="w-full bg-[#060b13] border-2 border-[#4CAF50]/40 focus:border-[#4CAF50] rounded-lg px-4 py-4 text-base text-white placeholder-gray-500 focus:outline-none transition-colors font-mono uppercase"
                                    />
                                </div>
                            )}

                            {/* PayPal step-by-step guide */}
                            {paymentMethod === "paypal" && (
                                <div className="rounded-xl border border-[#009cde]/30 bg-[#009cde]/5 p-5 space-y-4">
                                    <p className="text-white font-bold text-base">How to pay with PayPal:</p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <span className="w-7 h-7 rounded-full bg-[#009cde] text-white text-sm font-black flex items-center justify-center flex-shrink-0">1</span>
                                            <p className="text-gray-300 text-sm leading-relaxed pt-0.5">
                                                Open PayPal and send{" "}
                                                <span className="text-white font-black text-base">${selectedPlanPrice.toFixed(2)}</span>{" "}
                                                to:<br />
                                                <span className="text-[#009cde] font-black text-base break-all">code.abdala@gmail.com</span>
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="w-7 h-7 rounded-full bg-[#009cde] text-white text-sm font-black flex items-center justify-center flex-shrink-0">2</span>
                                            <p className="text-gray-300 text-sm leading-relaxed pt-0.5">
                                                After paying, open your PayPal receipt and copy the <span className="text-white font-bold">Transaction ID</span> (looks like: 5TY05013RG002845M)
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="w-7 h-7 rounded-full bg-[#009cde] text-white text-sm font-black flex items-center justify-center flex-shrink-0">3</span>
                                            <p className="text-gray-300 text-sm leading-relaxed pt-0.5">Paste it below and click Submit</p>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={paypalTxId}
                                        onChange={e => setPaypalTxId(e.target.value)}
                                        placeholder="Paste Transaction ID here..."
                                        className="w-full bg-[#060b13] border-2 border-[#009cde]/40 focus:border-[#009cde] rounded-lg px-4 py-4 text-base text-white placeholder-gray-500 focus:outline-none transition-colors font-mono"
                                    />
                                </div>
                            )}

                            {/* Pay Button */}
                            <button
                                type="button"
                                onClick={handlePay}
                                disabled={isPaying || !canProceedToPayment || !geoReady}
                                className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-black text-xl py-5 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(13,110,253,0.35)] hover:shadow-[0_0_36px_rgba(13,110,253,0.55)]"
                            >
                                {(isPaying || !geoReady) ? <Loader2 size={24} className="animate-spin" /> : null}
                                {isPaying ? "PROCESSING..." : !geoReady ? "Loading..." : paymentMethod === "paypal" ? "SUBMIT PAYPAL PAYMENT" : paymentMethod === "mpesa" ? "SUBMIT M-PESA PAYMENT" : `PAY $${selectedPlanPrice.toFixed(2)}`}
                            </button>
                            <p className="text-sm text-gray-500 text-center">
                                {paymentMethod === "paypal"
                                    ? "We will verify your payment within 30–40 minutes and activate your Premium."
                                    : paymentMethod === "mpesa"
                                    ? "We will verify your M-Pesa payment within 30–40 minutes and activate your Premium."
                                    : "Lacagta marka la xaqiijiyo, Premium si toos ah ayuu kuu shaqeynayaa. Code looma baahna."}
                            </p>
                        </div>
                    </section>

                    {/* Status messages */}
                    {(statusError || statusMessage) && (
                        <div className={`lg:col-start-1 p-4 rounded-lg text-sm border font-medium ${statusError ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
                            {statusError || statusMessage}
                        </div>
                    )}

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
