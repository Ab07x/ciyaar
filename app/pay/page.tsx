"use client";

import React from "react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Copy,
    CreditCard,
    Crown,
    Loader2,
    RefreshCw,
    Shield,
    Smartphone,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import { PLAN_OPTIONS, PlanId } from "@/lib/plans";

type SettingsResponse = Record<string, unknown>;
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<SettingsResponse>);
const fetcherGeneric = (url: string) => fetch(url).then((r) => r.json());

/* ────────────────────────────────────────────── */
/*  PaymentVerifier                               */
/* ────────────────────────────────────────────── */
function PaymentVerifier({ sid, orderId, stripeSession, paymentType }: { sid: string | null; orderId: string | null; stripeSession: string | null; paymentType: string | null }) {
    const [status, setStatus] = useState<"verifying" | "success" | "failed" | "pending" | "error">("verifying");
    const [message, setMessage] = useState("");
    const [plan, setPlan] = useState("");
    const [accessCode, setAccessCode] = useState("");
    const [isCodeCopied, setIsCodeCopied] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [autoPollCount, setAutoPollCount] = useState(0);
    const [isManualPayment, setIsManualPayment] = useState(
        paymentType === "mpesa" || paymentType === "paypal"
    );
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
            else if (data.status === "pending") { setStatus("pending"); setMessage(data.message || "Lacagta wali way socotaa..."); if (data.manual) setIsManualPayment(true); }
            else { setStatus("failed"); setMessage(data.message || data.error || "Xaqiijinta lacagtu way fashilmatay."); }
        } catch { setStatus("error"); setMessage("Khalad ayaa dhacay. Fadlan isku day mar kale."); }
    }, [sid, orderId, stripeSession]);

    useEffect(() => { if (!hasQueryToken) return; const t = window.setTimeout(() => { void verifyPayment(); }, 0); return () => window.clearTimeout(t); }, [hasQueryToken, retryCount, verifyPayment]);
    useEffect(() => { if (status !== "pending" || isManualPayment || autoPollCount >= MAX_AUTO_POLLS) return; const t = window.setTimeout(() => { setAutoPollCount(c => c + 1); setRetryCount(c => c + 1); }, 4000); return () => window.clearTimeout(t); }, [status, autoPollCount, isManualPayment]);
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
                        {isManualPayment ? (
                            <>
                                <div className="w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/20">
                                    <CheckCircle2 className="text-green-400" size={48} />
                                </div>
                                <h1 className="text-2xl font-black text-white mb-3">Lacagta La Helay!</h1>
                                <p className="text-gray-300 mb-6 leading-relaxed max-w-sm mx-auto">{displayMessage}</p>
                                <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 mb-6 text-left space-y-2">
                                    <p className="text-yellow-400 font-bold text-sm">Maxaa xiga?</p>
                                    <p className="text-gray-400 text-sm">✔ Kooxdeenu waxay heli doontaa lacag-bixintaada</p>
                                    <p className="text-gray-400 text-sm">✔ 30–40 daqiiqo gudahood Premium wuu kuu furmaa</p>
                                    <p className="text-gray-400 text-sm">✔ Haddii aad su&apos;aal qabtid, nala soo xiriir WhatsApp</p>
                                </div>
                                <p className="text-xs text-gray-600 mb-4">Xog: Boggan xidh — Premium markuu furmaa waxaad moodada gali kartaa</p>
                                <Link href="/" className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all">Ku laabo Bogga Hore</Link>
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Loader2 className="text-yellow-400 animate-spin" size={48} /></div>
                                <h1 className="text-2xl font-black text-white mb-2">Lacagta la xaqiijinayaa...</h1>
                                <p className="text-gray-400 mb-6">{displayMessage}</p>
                                <p className="text-sm text-gray-500 mb-6">Haddii aad lacagta bixisay, fadlan sug daqiiqado yar oo ku dhufo &quot;Isku day mar kale&quot;</p>
                                <p className="text-xs text-gray-500 mb-6">Auto-check: {Math.min(autoPollCount, MAX_AUTO_POLLS)} / {MAX_AUTO_POLLS}</p>
                                <button onClick={handleRetry} className="flex items-center justify-center gap-2 w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"><RefreshCw size={18} />Isku day mar kale</button>
                            </>
                        )}
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
/*  CheckoutHub                                   */
/* ────────────────────────────────────────────── */
/** Map legacy plan IDs to new plan IDs for /api/pricing lookup */
const LEGACY_TO_NEW: Record<PlanId, string> = {
    match: "starter",
    weekly: "basic",
    monthly: "pro",
    yearly: "elite",
};

function CheckoutHub({
    initialPlanId = "monthly",
    initialBonusDays = 0,
    initialOfferCode = "",
}: {
    initialPlanId?: PlanId;
    initialBonusDays?: number;
    initialOfferCode?: string;
}) {
    const { data: pricing, isLoading: pricingLoading } = useSWR("/api/pricing", fetcherGeneric);
    const geoReady = !pricingLoading && pricing !== undefined;
    const { deviceId, email, signupWithEmail } = useUser();

    const selectedPlan = useMemo(() => PLAN_OPTIONS.find((p) => p.id === initialPlanId) || PLAN_OPTIONS[0], [initialPlanId]);

    // Get price from the new tier-based /api/pricing endpoint (matches /pricing page exactly)
    const selectedPlanPrice = useMemo(() => {
        if (!pricing?.plans) return 0;
        const newId = LEGACY_TO_NEW[selectedPlan.id];
        const planData = pricing.plans.find((p: { id: string }) => p.id === newId);
        if (!planData) return 0;
        // yearly plan shows yearly price, others show monthly price
        return selectedPlan.id === "yearly" ? planData.yearly.price : planData.monthly.price;
    }, [pricing, selectedPlan]);

    const [formEmail, setFormEmail] = useState(email || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"stripe" | "sifalo">("stripe");
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [authCompleted, setAuthCompleted] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusError, setStatusError] = useState("");
    const canProceedToPayment = Boolean(email || authCompleted);

    const handleAuth = async () => {
        setStatusError(""); setStatusMessage("");
        const emailInput = (formEmail || email || "").trim();
        if (!emailInput) { setStatusError("Email waa loo baahan yahay."); return; }
        if (!password.trim()) { setStatusError("Password waa loo baahan yahay."); return; }
        if (password.length < 6) { setStatusError("Password waa inuu noqdaa ugu yaraan 6 xaraf."); return; }
        if (password !== confirmPassword) { setStatusError("Password-yada isma waafaqsana."); return; }
        setIsAuthLoading(true);
        const result = await signupWithEmail(emailInput, password, "", "");
        setIsAuthLoading(false);
        if (!result.success) { setStatusError(result.error || "Authentication failed."); return; }
        setAuthCompleted(true);
        setStatusMessage("Account created successfully.");
        setPassword(""); setConfirmPassword("");
    };

    const startStripeCheckout = async () => {
        setStatusError(""); setStatusMessage(""); setIsPaying(true);
        try {
            const res = await fetch("https://fanproj.shop/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: selectedPlan.id, email: email || formEmail || undefined, deviceId: deviceId || "unknown" }) });
            const data = await res.json();
            if (!res.ok || !data?.url) { setStatusError(data?.error || "Stripe checkout could not be started."); setIsPaying(false); return; }
            window.location.href = String(data.url);
        } catch { setStatusError("Checkout error. Please try again."); setIsPaying(false); }
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

    const handlePay = async () => {
        if (!canProceedToPayment) { setStatusError("Fadlan isdiiwaangeli ama gal accountka."); return; }
        if (paymentMethod === "stripe") await startStripeCheckout();
        else await startSifaloCheckout();
    };

    /* ── input style ── */
    const inputStyle: React.CSSProperties = {
        width: "100%", background: "transparent", border: "1px solid #2d3548",
        borderRadius: 4, padding: "14px 12px", color: "#fff", fontSize: 14,
        outline: "none", boxSizing: "border-box",
    };
    const labelStyle: React.CSSProperties = {
        position: "absolute", top: -9, left: 12, background: "#0c1a2e",
        padding: "0 6px", fontSize: 11, fontWeight: 600, color: "#8892a4",
    };

    return (
        <div style={{ minHeight: "100vh", color: "#e1e2e6", position: "relative" }}>

            {/* ── Background: background.png covers full page ── */}
            <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/background.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(8,16,32,0.55)" }} />
            </div>

            <div style={{ maxWidth: 960, margin: "0 auto", padding: "60px 24px 80px", position: "relative", zIndex: 1 }}>

                {/* ══════════ 01 Create Account  +  02 Payment Method ══════════ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, marginBottom: 56 }} className="checkout-top">
                    <style>{`@media(max-width:768px){.checkout-top{grid-template-columns:1fr!important;gap:40px!important}}`}</style>

                    {/* ── 01 Create Account ── */}
                    <div>
                        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 28 }}>
                            <span style={{ color: "#ff003e", fontWeight: 300, marginRight: 10 }}>01</span>
                            <span style={{ color: "#fff" }}>Create Account</span>
                        </h2>

                        {!canProceedToPayment ? (
                            <div>
                                {/* Email */}
                                <div style={{ position: "relative", marginBottom: 24 }}>
                                    <label style={labelStyle}>Email</label>
                                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="example@email.com" style={inputStyle} />
                                </div>
                                {/* Password + Confirm side by side */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                                    <div style={{ position: "relative" }}>
                                        <label style={labelStyle}>Password</label>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="**********" style={inputStyle} />
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <label style={labelStyle}>Confirm Password</label>
                                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="**********" style={inputStyle} />
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                    <button type="button" onClick={handleAuth} disabled={isAuthLoading} style={{ background: "#2a303c", border: "none", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 32px", borderRadius: 4, opacity: isAuthLoading ? 0.5 : 1 }}>
                                        {isAuthLoading ? "Sending..." : "Continue"}
                                    </button>
                                    <Link href={`/login?redirect=/pay?plan=${initialPlanId}`} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                                        Already have an account? <span style={{ color: "#9ca3af", fontWeight: 600 }}>Login</span>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div style={{ border: "1px solid #2d3548", borderRadius: 8, padding: 20, display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
                                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#22c55e" }}>
                                    <CheckCircle2 size={12} /> Ready
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontWeight: 700, fontSize: 18, color: "#6b7280", textTransform: "uppercase" }}>{(email || "U")[0]}</span>
                                </div>
                                <div>
                                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{email || formEmail}</p>
                                    <p style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>Account ready</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── 02 Payment Method ── */}
                    <div>
                        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 28 }}>
                            <span style={{ color: "#ff003e", fontWeight: 300, marginRight: 10 }}>02</span>
                            <span style={{ color: "#fff" }}>Payment Method</span>
                        </h2>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {/* Credit Card */}
                            <div onClick={() => setPaymentMethod("stripe")} style={{ position: "relative", borderRadius: 8, border: paymentMethod === "stripe" ? "2px solid #3b82f6" : "2px solid #2d3548", background: paymentMethod === "stripe" ? "rgba(59,130,246,0.08)" : "rgba(15,23,42,0.6)", padding: "28px 16px", cursor: "pointer", textAlign: "center" }}>
                                {paymentMethod === "stripe" && (
                                    <div style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Check size={12} style={{ color: "#fff" }} strokeWidth={3} />
                                    </div>
                                )}
                                <p style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 6, letterSpacing: "0.03em" }}>CREDIT CARD</p>
                                <p style={{ fontSize: 12, color: "#8892a4", fontStyle: "italic" }}>Mastercard, Visa and more.</p>
                            </div>
                            {/* Cards & Wallets */}
                            <div onClick={() => setPaymentMethod("sifalo")} style={{ position: "relative", borderRadius: 8, border: paymentMethod === "sifalo" ? "2px solid #f97316" : "2px solid #2d3548", background: paymentMethod === "sifalo" ? "rgba(249,115,22,0.08)" : "rgba(15,23,42,0.6)", padding: "28px 16px", cursor: "pointer", textAlign: "center" }}>
                                {paymentMethod === "sifalo" && (
                                    <div style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Check size={12} style={{ color: "#fff" }} strokeWidth={3} />
                                    </div>
                                )}
                                <p style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 6, letterSpacing: "0.03em" }}>CARDS &amp; WALLETS</p>
                                <p style={{ fontSize: 12, color: "#8892a4", fontStyle: "italic" }}>Cards / Apple / Google / Bank / Vouchers / Local / Crypto</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════ 03 Pay ══════════ */}
                <div>
                    <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 28 }}>
                        <span style={{ color: "#8892a4", fontWeight: 300, marginRight: 10 }}>03</span>
                        <span style={{ color: "#fff" }}>Pay</span>
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid #2d3548", borderRadius: 8, overflow: "hidden" }} className="pay-box">
                        <style>{`@media(max-width:768px){.pay-box{grid-template-columns:1fr!important}}`}</style>

                        {/* Left: plan + total */}
                        <div style={{ padding: "28px 32px", borderRight: "1px solid #2d3548" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                <span style={{ color: "#8892a4", fontSize: 15 }}>{selectedPlan.label}</span>
                                {geoReady
                                    ? <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>$ {selectedPlanPrice.toFixed(2)}</span>
                                    : <span style={{ display: "inline-block", width: 72, height: 22, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
                                }
                            </div>
                            {initialBonusDays > 0 && selectedPlan.id === "monthly" && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                    <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 600 }}>+{initialBonusDays} Days FREE</span>
                                    <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 600 }}>$0.00</span>
                                </div>
                            )}
                            <div style={{ height: 1, background: "#2d3548", margin: "12px 0" }} />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ color: "#8892a4", fontSize: 15 }}>Total</span>
                                {geoReady
                                    ? <span style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>$ {selectedPlanPrice.toFixed(2)}</span>
                                    : <span style={{ display: "inline-block", width: 88, height: 26, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
                                }
                            </div>
                        </div>

                        {/* Right: PAY button */}
                        <div style={{ padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <button
                                type="button"
                                onClick={handlePay}
                                disabled={isPaying || !canProceedToPayment || !geoReady}
                                style={{
                                    background: "#0d6efd", border: "none", cursor: isPaying || !canProceedToPayment || !geoReady ? "not-allowed" : "pointer",
                                    color: "#fff", fontWeight: 900, fontSize: 18, padding: "16px 48px", borderRadius: 8,
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    opacity: isPaying || !canProceedToPayment || !geoReady ? 0.5 : 1,
                                    transition: "all 0.2s", whiteSpace: "nowrap",
                                }}
                            >
                                {(isPaying || !geoReady) && <Loader2 size={20} className="animate-spin" />}
                                {isPaying ? "PROCESSING..." : !geoReady ? "Loading..." : `PAY $${selectedPlanPrice.toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status messages */}
                {(statusError || statusMessage) && (
                    <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, border: statusError ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)", background: statusError ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", color: statusError ? "#f87171" : "#4ade80" }}>
                        {statusError || statusMessage}
                    </div>
                )}
            </div>
        </div>
    );
}

function PayPageContent() {
    const searchParams = useSearchParams();
    const sid = searchParams.get("sid");
    const orderId = searchParams.get("order_id");
    const stripeSession = searchParams.get("stripe_session");
    const paymentType = searchParams.get("type");
    const planParam = (searchParams.get("plan") || "").trim().toLowerCase();
    const bonusDaysParam = Number(searchParams.get("bonusDays") || "0");
    const offerCodeParam = String(searchParams.get("offerCode") || "").trim();
    const initialPlanId: PlanId = ["match", "weekly", "monthly", "yearly"].includes(planParam) ? (planParam as PlanId) : "monthly";
    const initialBonusDays = Number.isFinite(bonusDaysParam) ? Math.min(7, Math.max(0, Math.floor(bonusDaysParam))) : 0;

    if (sid || orderId || stripeSession) return <PaymentVerifier sid={sid} orderId={orderId} stripeSession={stripeSession} paymentType={paymentType} />;
    return <CheckoutHub initialPlanId={initialPlanId} initialBonusDays={initialBonusDays} initialOfferCode={offerCodeParam} />;
}

export default function PayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" /></div>}>
            <PayPageContent />
        </Suspense>
    );
}
