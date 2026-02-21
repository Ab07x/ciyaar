"use client";

/**
 * QuickCheckout — inline overlay checkout (bottom sheet on mobile, modal on desktop).
 * Supports: EVC Plus/Zaad (Sifalo), Stripe, M-Pesa, PayPal.
 * Polls /api/pay/verify every 3 s for Sifalo/Stripe (max 30 × = 90 s).
 * M-Pesa/PayPal: inline TX code form → manual admin approval.
 * Remembers last-used payment method in localStorage.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSWRConfig } from "swr";
import { useUser } from "@/providers/UserProvider";
import { PLAN_OPTIONS, PlanId } from "@/lib/plans";
import {
    X,
    Star,
    Loader2,
    Check,
    CheckCircle2,
    ExternalLink,
    ChevronLeft,
    Clock,
    AlertCircle,
    RefreshCw,
    Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
    | "select"
    | "sifalo_polling"
    | "stripe_polling"
    | "mpesa_form"
    | "paypal_form"
    | "manual_done"
    | "success"
    | "error";

type PayMethod = "sifalo" | "stripe" | "mpesa" | "paypal";

export interface QuickCheckoutProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    defaultPlan?: PlanId;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fanbroj_checkout_method";
const MAX_POLL = 30; // 30 × 3 s = 90 s

const PLAN_META: Record<PlanId, { label: string; duration: string; color: string; bg: string }> = {
    monthly: { label: "Pro",     duration: "30 maalmood",  color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30" },
    yearly:  { label: "Elite",   duration: "365 maalmood", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
    weekly:  { label: "Plus",    duration: "7 maalmood",   color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
    match:   { label: "Starter", duration: "1 ciyaar",     color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30" },
};

// ─── Root Component ───────────────────────────────────────────────────────────

export default function QuickCheckout({ isOpen, onClose, onSuccess, defaultPlan = "monthly" }: QuickCheckoutProps) {
    const { deviceId } = useUser();
    const { mutate } = useSWRConfig();

    const [step, setStep]           = useState<Step>("select");
    const [plan, setPlan]           = useState<PlanId>(defaultPlan);
    const [method, setMethod]       = useState<PayMethod>("sifalo");
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [txInput, setTxInput]     = useState("");
    const [pollCount, setPollCount] = useState(0);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [geoMultiplier, setGeoMultiplier] = useState<number | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Init remembered method
    useEffect(() => {
        const saved = typeof window !== "undefined"
            ? (localStorage.getItem(STORAGE_KEY) as PayMethod | null)
            : null;
        if (saved && ["sifalo", "stripe", "mpesa", "paypal"].includes(saved)) {
            setMethod(saved);
        }
    }, []);

    // ── Fetch geo multiplier once overlay opens
    useEffect(() => {
        if (!isOpen || geoMultiplier !== null) return;
        fetch("/api/geo")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.multiplier) setGeoMultiplier(Number(d.multiplier)); })
            .catch(() => {});
    }, [isOpen, geoMultiplier]);

    // ── Reset state each time overlay opens
    useEffect(() => {
        if (isOpen) {
            setStep("select");
            setError(null);
            setTxInput("");
            setPollCount(0);
            setCheckoutUrl(null);
            setLoading(false);
        } else {
            stopPolling();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const stopPolling = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }, []);

    const handleSuccess = useCallback((planId: PlanId) => {
        stopPolling();
        setPlan(planId);
        setStep("success");
        if (deviceId) mutate(`/api/subscriptions?deviceId=${encodeURIComponent(deviceId)}`);
        onSuccess?.();
    }, [deviceId, mutate, onSuccess, stopPolling]);

    const startPolling = useCallback((oid: string, planId: PlanId) => {
        stopPolling();
        let count = 0;
        setPollCount(0);

        pollRef.current = setInterval(async () => {
            count++;
            setPollCount(count);
            if (!deviceId) return;

            try {
                const res = await fetch("/api/pay/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: oid, deviceId }),
                });
                const data = await res.json();

                if (data.success) {
                    handleSuccess(planId);
                } else if (data.status === "failed") {
                    stopPolling();
                    setError("Lacag-bixinta waa fashilantay. Isku day mar kale.");
                    setStep("error");
                } else if (count >= MAX_POLL) {
                    stopPolling();
                    // Timed out — show manual confirmation screen
                    setStep("manual_done");
                }
            } catch { /* network hiccup — keep polling */ }
        }, 3000);
    }, [deviceId, handleSuccess, stopPolling]);

    // ── Sifalo (EVC Plus / Zaad)
    const handleSifalo = useCallback(async () => {
        if (!deviceId) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch("/api/pay/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, deviceId }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Khalad");

            setCheckoutUrl(data.checkoutUrl);
            window.open(data.checkoutUrl, "_blank");
            setStep("sifalo_polling");
            startPolling(data.orderId, plan);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Khalad ayaa dhacay");
        } finally { setLoading(false); }
    }, [deviceId, plan, startPolling]);

    // ── Stripe (card)
    const handleStripe = useCallback(async () => {
        if (!deviceId) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch("/api/pay/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, deviceId }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Khalad");

            setCheckoutUrl(data.checkoutUrl);
            window.open(data.checkoutUrl, "_blank");
            setStep("stripe_polling");
            startPolling(data.orderId, plan);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Khalad ayaa dhacay");
        } finally { setLoading(false); }
    }, [deviceId, plan, startPolling]);

    // ── M-Pesa submit
    const handleMpesaSubmit = useCallback(async () => {
        if (!deviceId || !txInput.trim()) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch("/api/pay/mpesa/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, deviceId, mpesaTxId: txInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Khalad");
            setStep("manual_done");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Khalad ayaa dhacay");
        } finally { setLoading(false); }
    }, [deviceId, plan, txInput]);

    // ── PayPal submit
    const handlePaypalSubmit = useCallback(async () => {
        if (!deviceId || !txInput.trim()) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch("/api/pay/paypal/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, deviceId, paypalTxId: txInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Khalad");
            setStep("manual_done");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Khalad ayaa dhacay");
        } finally { setLoading(false); }
    }, [deviceId, plan, txInput]);

    // ── Proceed from select step
    const handleProceed = () => {
        localStorage.setItem(STORAGE_KEY, method);
        if      (method === "sifalo") handleSifalo();
        else if (method === "stripe") handleStripe();
        else if (method === "mpesa")  { setStep("mpesa_form");  setTxInput(""); setError(null); }
        else if (method === "paypal") { setStep("paypal_form"); setTxInput(""); setError(null); }
    };

    const goBack = () => { stopPolling(); setStep("select"); setError(null); };

    const selectedPlanOpt = PLAN_OPTIONS.find(p => p.id === plan)!;
    const multiplier = geoMultiplier ?? 2.5;
    const displayPrice = (selectedPlanOpt.defaultPrice * multiplier).toFixed(2);

    const showBack = !["select", "success", "manual_done", "error"].includes(step);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet (mobile) / Modal (desktop) */}
            <div className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center pointer-events-none">
                <div
                    className="pointer-events-auto bg-[#0d0d0d] text-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md shadow-2xl border border-white/10 flex flex-col"
                    style={{ maxHeight: "92vh", animation: "qc-slide 0.28s ease-out" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            {showBack && (
                                <button
                                    onClick={goBack}
                                    className="p-1 rounded-full hover:bg-white/10 transition-colors -ml-1 mr-1"
                                    aria-label="Ku noqo"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">Fanbroj Premium</span>
                            {/* Plan summary badge — visible once past select step */}
                            {step !== "select" && step !== "success" && (
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ml-1 ${PLAN_META[plan].color} bg-white/10`}>
                                    {PLAN_META[plan].label} · ${displayPrice}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body (scrollable) */}
                    <div className="overflow-y-auto flex-1 p-4 pb-8">
                        {step === "select" && (
                            <SelectStep
                                plan={plan}
                                setPlan={setPlan}
                                method={method}
                                setMethod={setMethod}
                                displayPrice={displayPrice}
                                geoReady={geoMultiplier !== null}
                                onProceed={handleProceed}
                                loading={loading}
                                error={error}
                            />
                        )}

                        {(step === "sifalo_polling" || step === "stripe_polling") && (
                            <PollingStep
                                isSifalo={step === "sifalo_polling"}
                                pollCount={pollCount}
                                maxPoll={MAX_POLL}
                                checkoutUrl={checkoutUrl}
                            />
                        )}

                        {step === "mpesa_form" && (
                            <ManualForm
                                type="mpesa"
                                displayPrice={displayPrice}
                                txInput={txInput}
                                setTxInput={setTxInput}
                                onSubmit={handleMpesaSubmit}
                                loading={loading}
                                error={error}
                            />
                        )}

                        {step === "paypal_form" && (
                            <ManualForm
                                type="paypal"
                                displayPrice={displayPrice}
                                txInput={txInput}
                                setTxInput={setTxInput}
                                onSubmit={handlePaypalSubmit}
                                loading={loading}
                                error={error}
                            />
                        )}

                        {step === "manual_done" && <ManualDoneStep onClose={onClose} />}
                        {step === "success"      && <SuccessStep plan={plan} onClose={onClose} />}
                        {step === "error"        && (
                            <ErrorStep
                                error={error}
                                onRetry={() => { setError(null); setStep("select"); }}
                                onClose={onClose}
                            />
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes qc-slide {
                    from { transform: translateY(40px); opacity: 0; }
                    to   { transform: translateY(0);   opacity: 1; }
                }
                @media (min-width: 768px) {
                    @keyframes qc-slide {
                        from { transform: scale(0.96) translateY(8px); opacity: 0; }
                        to   { transform: scale(1)    translateY(0);   opacity: 1; }
                    }
                }
            `}</style>
        </>
    );
}

// ─── SelectStep ──────────────────────────────────────────────────────────────

function SelectStep({
    plan, setPlan, method, setMethod, displayPrice, geoReady, onProceed, loading, error,
}: {
    plan: PlanId;
    setPlan: (p: PlanId) => void;
    method: PayMethod;
    setMethod: (m: PayMethod) => void;
    displayPrice: string;
    geoReady: boolean;
    onProceed: () => void;
    loading: boolean;
    error: string | null;
}) {
    const PLANS: { id: PlanId; name: string; price: string; duration: string; badge?: string }[] = [
        { id: "monthly", name: "Pro",     price: "",  duration: "30 maalmood", badge: "Popular" },
        { id: "yearly",  name: "Elite",   price: "",  duration: "365 maalmood", badge: "Best value" },
        { id: "weekly",  name: "Plus",    price: "",  duration: "7 maalmood" },
        { id: "match",   name: "Starter", price: "",  duration: "1 ciyaar" },
    ];

    const METHODS: { id: PayMethod; label: string; sub: string; icon: string; color: string }[] = [
        { id: "sifalo", label: "EVC Plus / Zaad", sub: "Somali mobile money", icon: "🟢", color: "#4ade80" },
        { id: "stripe", label: "Card",            sub: "Visa / Mastercard",   icon: "💳", color: "#818cf8" },
        { id: "paypal", label: "PayPal",          sub: "Send & submit",       icon: "🅿️", color: "#009cde" },
        { id: "mpesa",  label: "M-Pesa",          sub: "Kenya mobile money",  icon: "🌿", color: "#4ade80" },
    ];

    const planOpts = PLAN_OPTIONS;

    // Compute per-plan prices using same multiplier that produced displayPrice
    // displayPrice is for "plan" — we can work backwards
    const selectedOpt = planOpts.find(p => p.id === plan)!;
    const multiplierApprox = selectedOpt ? Number(displayPrice) / selectedOpt.defaultPrice : 2.5;

    return (
        <div className="space-y-5">
            {/* Plan selector */}
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dooro Qorshaha</p>
                <div className="grid grid-cols-2 gap-2">
                    {PLANS.map(p => {
                        const opt = planOpts.find(o => o.id === p.id)!;
                        const price = (opt.defaultPrice * multiplierApprox).toFixed(2);
                        const meta = PLAN_META[p.id];
                        const active = plan === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setPlan(p.id)}
                                className={`relative text-left rounded-xl border-2 p-3 transition-all duration-150 ${
                                    active
                                        ? `${meta.bg} border-opacity-70`
                                        : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                                }`}
                                style={active ? { borderColor: meta.color.replace("text-", "").replace("-400", "") } : {}}
                            >
                                {p.badge && (
                                    <span className={`absolute -top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full text-black ${
                                        p.id === "monthly" ? "bg-green-400" : "bg-yellow-400"
                                    }`}>
                                        {p.badge}
                                    </span>
                                )}
                                {active && (
                                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                    </div>
                                )}
                                <div className={`text-xs font-black uppercase ${meta.color}`}>{p.name}</div>
                                <div className="text-white font-bold text-base">
                                    {geoReady ? `$${price}` : <Loader2 className="w-3.5 h-3.5 animate-spin inline" />}
                                </div>
                                <div className="text-gray-500 text-[10px]">{p.duration}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Payment method selector */}
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Qaabka Lacag-bixinta</p>
                <div className="space-y-2">
                    {METHODS.map(m => {
                        const active = method === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setMethod(m.id)}
                                className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all duration-150 ${
                                    active
                                        ? "bg-white/5"
                                        : "border-white/10 hover:border-white/20 bg-transparent"
                                }`}
                                style={active ? { borderColor: m.color } : {}}
                            >
                                <span className="text-xl leading-none">{m.icon}</span>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-bold">{m.label}</div>
                                    <div className="text-[10px] text-gray-500">{m.sub}</div>
                                </div>
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        active ? "border-current" : "border-white/20"
                                    }`}
                                    style={active ? { borderColor: m.color, backgroundColor: m.color + "33" } : {}}
                                >
                                    {active && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* CTA */}
            <button
                onClick={onProceed}
                disabled={loading || !geoReady}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-black text-base py-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sugaya...</>
                ) : !geoReady ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Qiimaha la soo uruuriyaa...</>
                ) : (
                    <>${displayPrice} — KU BILOW HADDA</>
                )}
            </button>

            {/* Trust line */}
            <p className="text-center text-[10px] text-gray-600">
                🔒 Lacag-bixin ammaan ah · Premium isla markiiba furmaa · WhatsApp 24/7
            </p>
        </div>
    );
}

// ─── PollingStep ─────────────────────────────────────────────────────────────

function PollingStep({
    isSifalo, pollCount, maxPoll, checkoutUrl,
}: {
    isSifalo: boolean;
    pollCount: number;
    maxPoll: number;
    checkoutUrl: string | null;
}) {
    const pct = Math.min(100, Math.round((pollCount / maxPoll) * 100));

    return (
        <div className="flex flex-col items-center text-center gap-5 py-4">
            {/* Spinner ring */}
            <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" stroke="white" strokeOpacity="0.08" strokeWidth="6" fill="none" />
                    <circle
                        cx="40" cy="40" r="34"
                        stroke="#4ade80" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                </svg>
                <Loader2 className="absolute inset-0 m-auto w-7 h-7 text-green-400 animate-spin" />
            </div>

            <div>
                <p className="font-bold text-lg">
                    {isSifalo ? "EVC Plus / Zaad" : "Kaardhkaaga"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                    Tab cusub ayaa la furay — lacag-bixinta dhammaystir,<br />
                    kadibna halkan ayuu si toos ah ugu soo noqon doonaa.
                </p>
            </div>

            <div className="w-full bg-white/5 rounded-full h-1.5">
                <div
                    className="bg-green-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-xs text-gray-600">{pollCount}/{maxPoll} check · {90 - pollCount * 3}s remaining</p>

            {checkoutUrl && (
                <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 underline underline-offset-2"
                >
                    <ExternalLink className="w-4 h-4" />
                    Tab dib u fur
                </a>
            )}

            <p className="text-[11px] text-gray-600 max-w-xs">
                Lacag-bixinta dhammaystir kaddib, page-kan inta lagu jiro joogso —
                xaqiijinta si toos ah ayey u dhici doontaa.
            </p>
        </div>
    );
}

// ─── ManualForm ───────────────────────────────────────────────────────────────

function ManualForm({
    type, displayPrice, txInput, setTxInput, onSubmit, loading, error,
}: {
    type: "mpesa" | "paypal";
    displayPrice: string;
    txInput: string;
    setTxInput: (v: string) => void;
    onSubmit: () => void;
    loading: boolean;
    error: string | null;
}) {
    const isMpesa = type === "mpesa";
    const accentColor = isMpesa ? "#4ade80" : "#009cde";
    const borderClass = isMpesa ? "border-green-500/30 bg-green-500/5" : "border-[#009cde]/30 bg-[#009cde]/5";
    const inputFocus  = isMpesa ? "focus:border-green-500" : "focus:border-[#009cde]";
    const btnClass    = isMpesa ? "bg-green-500 hover:bg-green-400" : "bg-[#009cde] hover:bg-[#00b4ff]";

    const steps = isMpesa ? [
        <>Open M-Pesa and send <span className="text-white font-black">${displayPrice}</span> to: <br /><span style={{ color: accentColor }} className="font-black text-base">0797415296</span><span className="text-gray-400 text-sm"> — Abdullahi Ahmed</span></>,
        <>Check your M-Pesa SMS for the <span className="text-white font-bold">Transaction Code</span> (e.g. QJK2ABCDE5)</>,
        <>Paste the code below and click Submit</>,
    ] : [
        <>Open PayPal and send <span className="text-white font-black">${displayPrice}</span> to: <br /><span style={{ color: accentColor }} className="font-black text-base">code.abdala@gmail.com</span></>,
        <>Open your PayPal receipt and copy the <span className="text-white font-bold">Transaction ID</span> (e.g. 5TY05013RG002845M)</>,
        <>Paste it below and click Submit</>,
    ];

    return (
        <div className="space-y-4">
            <div className={`rounded-xl border ${borderClass} p-4 space-y-3`}>
                <p className="font-bold">
                    How to pay with {isMpesa ? "M-Pesa" : "PayPal"}:
                </p>
                <div className="space-y-3">
                    {steps.map((s, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span
                                className="w-6 h-6 rounded-full text-black text-xs font-black flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: accentColor }}
                            >
                                {i + 1}
                            </span>
                            <p className="text-gray-300 text-sm leading-relaxed pt-0.5">{s}</p>
                        </div>
                    ))}
                </div>

                <input
                    type="text"
                    value={txInput}
                    onChange={e => setTxInput(isMpesa ? e.target.value.toUpperCase() : e.target.value)}
                    placeholder={isMpesa ? "Paste M-Pesa code e.g. QJK2ABCDE5" : "Paste Transaction ID here..."}
                    className={`w-full bg-black/40 border-2 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors font-mono ${
                        isMpesa ? "border-green-500/40" : "border-[#009cde]/40"
                    } ${inputFocus}`}
                />
            </div>

            {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <button
                onClick={onSubmit}
                disabled={loading || !txInput.trim()}
                className={`w-full flex items-center justify-center gap-2 rounded-xl text-black font-black py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnClass}`}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Gudbinaya..." : `SUBMIT ${isMpesa ? "M-PESA" : "PAYPAL"} PAYMENT`}
            </button>

            <p className="text-center text-xs text-gray-600">
                {isMpesa
                    ? "We will verify your M-Pesa payment within 30–40 min and activate your Premium."
                    : "We will verify your PayPal payment within 30–40 min and activate your Premium."}
            </p>
        </div>
    );
}

// ─── ManualDoneStep ───────────────────────────────────────────────────────────

function ManualDoneStep({ onClose }: { onClose: () => void }) {
    return (
        <div className="flex flex-col items-center text-center gap-5 py-6">
            <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center ring-4 ring-green-500/20">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
                <p className="font-black text-xl text-green-400">Lacagta La Helay!</p>
                <p className="text-gray-300 text-sm mt-2 max-w-xs">
                    Waad gudbisay! Kooxdeenu waxay xaqiijin doontaa
                    <span className="text-white font-bold"> 30–40 daqiiqo</span> gudahood —
                    kadibna Premium si toos ah ayuu kuu furmaa.
                </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 rounded-lg px-4 py-2.5">
                <Clock className="w-4 h-4" />
                Xaqiijinta: 30–40 daqiiqo gudahood
            </div>
            <button
                onClick={onClose}
                className="w-full rounded-xl border border-white/20 py-3 text-sm font-bold hover:bg-white/5 transition-colors"
            >
                Xidh
            </button>
        </div>
    );
}

// ─── SuccessStep ──────────────────────────────────────────────────────────────

function SuccessStep({ plan, onClose }: { plan: PlanId; onClose: () => void }) {
    const meta = PLAN_META[plan];
    return (
        <div className="flex flex-col items-center text-center gap-5 py-6">
            {/* Celebration */}
            <div className="relative">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center ring-4 ring-green-500/30 ring-offset-4 ring-offset-[#0d0d0d]">
                    <Sparkles className="w-12 h-12 text-green-400" />
                </div>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-green-400"
                        style={{
                            top: `${50 + 44 * Math.sin((i * Math.PI * 2) / 6)}%`,
                            left: `${50 + 44 * Math.cos((i * Math.PI * 2) / 6)}%`,
                            transform: "translate(-50%, -50%)",
                            opacity: 0.6,
                            animation: `ping 1s ${i * 0.15}s ease-out infinite`,
                        }}
                    />
                ))}
            </div>

            <div>
                <p className="font-black text-2xl">Mahad sanid! 🎉</p>
                <p className={`font-bold mt-1 ${meta.color}`}>
                    {meta.label} Plan — {meta.duration}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                    Premium way furmay — daawo dhammaan filimada iyo tartan-naftaada.
                </p>
            </div>

            <button
                onClick={onClose}
                className="w-full rounded-xl bg-green-500 hover:bg-green-400 text-black font-black py-4 transition-colors"
            >
                BILOW DAAWASHADA
            </button>
        </div>
    );
}

// ─── ErrorStep ───────────────────────────────────────────────────────────────

function ErrorStep({
    error, onRetry, onClose,
}: {
    error: string | null;
    onRetry: () => void;
    onClose: () => void;
}) {
    return (
        <div className="flex flex-col items-center text-center gap-5 py-6">
            <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center ring-4 ring-red-500/20">
                <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
                <p className="font-black text-xl text-red-400">Khalad ayaa dhacay</p>
                <p className="text-gray-400 text-sm mt-2 max-w-xs">
                    {error || "Lacag-bixinta way fashilantay. Isku day mar kale ama xiriir admin."}
                </p>
            </div>
            <div className="flex flex-col w-full gap-2">
                <button
                    onClick={onRetry}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 py-3 font-bold transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Isku day mar kale
                </button>
                <button
                    onClick={onClose}
                    className="w-full rounded-xl border border-white/10 py-3 text-sm text-gray-400 hover:bg-white/5 transition-colors"
                >
                    Xidh
                </button>
            </div>
        </div>
    );
}
