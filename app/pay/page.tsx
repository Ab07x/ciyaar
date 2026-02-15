"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Copy,
    Crown,
    Loader2,
    RefreshCw,
    ShieldCheck,
    XCircle,
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

            if (!deviceId) {
                setStatus("error");
                setMessage("Device ID lama helin. Fadlan la xiriir taageerada.");
                return;
            }

            const res = await fetch("/api/pay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sid, orderId, deviceId }),
            });

            const data = await res.json();

            if (data.success) {
                setStatus("success");
                setMessage(data.message || "Premium wuu kuu shaqeynayaa!");
                setPlan(data.plan || "");
                if (data.code) {
                    const codeText = String(data.code);
                    setAccessCode(codeText);
                    localStorage.setItem("fanbroj_last_payment_code", codeText);
                }
            } else if (data.status === "pending") {
                setStatus("pending");
                setMessage("Lacagta wali way socotaa...");
            } else {
                setStatus("failed");
                setMessage(data.message || data.error || "Xaqiijinta lacagtu way fashilmatay.");
            }
        } catch {
            setStatus("error");
            setMessage("Khalad ayaa dhacay. Fadlan isku day mar kale.");
        }
    }, [sid, orderId]);

    useEffect(() => {
        if (!hasQueryToken) {
            return;
        }

        const timeout = window.setTimeout(() => {
            void verifyPayment();
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [hasQueryToken, retryCount, verifyPayment]);

    useEffect(() => {
        if (status !== "pending") return;
        if (autoPollCount >= MAX_AUTO_POLLS) return;

        const timeout = window.setTimeout(() => {
            setAutoPollCount((count) => count + 1);
            setRetryCount((count) => count + 1);
        }, 4000);

        return () => window.clearTimeout(timeout);
    }, [status, autoPollCount]);

    const handleRetry = () => {
        setAutoPollCount(0);
        setRetryCount((c) => c + 1);
    };

    const handleCopyCode = async () => {
        if (!accessCode) return;
        try {
            await navigator.clipboard.writeText(accessCode);
            setIsCodeCopied(true);
            window.setTimeout(() => setIsCodeCopied(false), 1800);
        } catch {
            setIsCodeCopied(false);
        }
    };

    const displayStatus = hasQueryToken ? status : "error";
    const displayMessage = hasQueryToken ? message : "Macluumaad lacag bixin ah lama helin.";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black via-gray-950 to-black">
            <div className="max-w-md w-full">
                {displayStatus === "verifying" && (
                    <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-accent-green animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Crown className="text-accent-gold" size={32} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta la xaqiijinayaa...</h1>
                        <p className="text-gray-400">Fadlan sug ilaa lacagta la xaqiijiyo</p>
                    </div>
                )}

                {displayStatus === "success" && (
                    <div className="text-center animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-accent-green/30">
                            <CheckCircle2 className="text-accent-green" size={48} />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">🎉 Waad ku guulaysatay!</h1>
                        <p className="text-accent-green text-lg font-bold mb-2">{displayMessage}</p>
                        {plan && (
                            <div className="inline-block bg-accent-gold/20 text-accent-gold px-4 py-2 rounded-full text-sm font-bold uppercase mb-8">
                                {plan} wuu kuu shaqeynayaa
                            </div>
                        )}
                        {accessCode && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Auto Premium Code</p>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-mono text-lg text-white tracking-wider">{accessCode}</p>
                                    <button
                                        onClick={handleCopyCode}
                                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold flex items-center gap-1"
                                    >
                                        {isCodeCopied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
                                        {isCodeCopied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Code-kan wuxuu ka muuqan doonaa Menu/Subscription si aad u keydsato mar walba.</p>
                            </div>
                        )}
                        <div className="space-y-3 mt-6">
                            <Link
                                href="/"
                                className="flex items-center justify-center gap-2 w-full bg-accent-green text-black font-bold py-4 rounded-xl hover:brightness-110 transition-all text-lg"
                            >
                                Bilow Daawashada
                                <ArrowRight size={20} />
                            </Link>
                            <Link
                                href="/subscription"
                                className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
                            >
                                Arag Subscription-kaaga
                            </Link>
                        </div>
                    </div>
                )}

                {displayStatus === "pending" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="text-yellow-400 animate-spin" size={48} />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta wali ma dhammaanin</h1>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <p className="text-sm text-gray-500 mb-6">
                            Haddii aad lacagta bixisay, fadlan sug daqiiqado yar oo ku dhufo &quot;Isku day mar kale&quot;
                        </p>
                        <p className="text-xs text-gray-500 mb-6">
                            Auto-check: {Math.min(autoPollCount, MAX_AUTO_POLLS)} / {MAX_AUTO_POLLS}
                        </p>
                        <button
                            onClick={handleRetry}
                            className="flex items-center justify-center gap-2 w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"
                        >
                            <RefreshCw size={18} />
                            Isku day mar kale
                        </button>
                    </div>
                )}

                {displayStatus === "failed" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="text-red-400" size={48} />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-2">Lacagta ma shaqeyn</h1>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <div className="space-y-3">
                            <Link
                                href="/pricing"
                                className="flex items-center justify-center gap-2 w-full bg-accent-green text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"
                            >
                                Isku day mar kale
                            </Link>
                            <button
                                onClick={handleRetry}
                                className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
                            >
                                <RefreshCw size={18} />
                                Xaqiiji mar kale
                            </button>
                        </div>
                    </div>
                )}

                {displayStatus === "error" && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="text-red-400" size={48} />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-2">Khalad ayaa dhacay</h1>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <Link
                            href="/pricing"
                            className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
                        >
                            Ku laabo Qiimaha
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

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
    const { deviceId, userId, email, signupWithEmail, loginWithEmail } = useUser();

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
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [statusError, setStatusError] = useState<string>("");
    const canProceedToPayment = Boolean(email || authCompleted);

    const selectedPlan = useMemo(
        () => PLAN_OPTIONS.find((plan) => plan.id === selectedPlanId) || PLAN_OPTIONS[0],
        [selectedPlanId]
    );

    const selectedPlanPrice = useMemo(
        () => getPlanPrice(settings, selectedPlan),
        [settings, selectedPlan]
    );

    const storeUrl = String(process.env.NEXT_PUBLIC_STORE_CHECKOUT_URL || "https://somaliwebsite.com");

    const handleAuth = async () => {
        setStatusError("");
        setStatusMessage("");

        const emailInput = (formEmail || email || "").trim();

        if (!emailInput) {
            setStatusError("Email geli.");
            return;
        }
        if (!password.trim()) {
            setStatusError("Password geli.");
            return;
        }

        if (authMode === "signup") {
            if (password.length < 6) {
                setStatusError("Password-ku waa inuu noqdaa ugu yaraan 6 xaraf.");
                return;
            }
            if (password !== confirmPassword) {
                setStatusError("Password iyo Confirm Password ma is waafaqaan.");
                return;
            }
        }

        setIsAuthLoading(true);
        const result = authMode === "signup"
            ? await signupWithEmail(emailInput, password, displayName.trim())
            : await loginWithEmail(emailInput, password);
        setIsAuthLoading(false);

        if (!result.success) {
            setStatusError(result.error || "Auth failed");
            return;
        }

        setAuthCompleted(true);
        setStatusMessage(
            authMode === "signup"
                ? "Account waa la sameeyay, waana logged-in. Hadda dooro payment method."
                : "Login waa sax. Hadda dooro payment method."
        );
        setPassword("");
        setConfirmPassword("");
    };

    const startSifaloCheckout = async (forcePlanId?: PlanId) => {
        const planToPay = forcePlanId || selectedPlan.id;
        setStatusError("");
        setStatusMessage("");
        setIsPaying(true);
        const bonusDays = planToPay === "monthly"
            ? Math.min(7, Math.max(0, Number(initialBonusDays) || 0))
            : 0;
        const offerCode = bonusDays > 0
            ? (String(initialOfferCode || "PAY_MONTHLY_BONUS").trim() || "PAY_MONTHLY_BONUS")
            : undefined;

        try {
            const res = await fetch("/api/pay/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan: planToPay,
                    deviceId: deviceId || "unknown",
                    offerBonusDays: bonusDays,
                    offerCode,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data?.checkoutUrl) {
                setStatusError(data?.error || "Checkout lama bilaabi karo hadda.");
                setIsPaying(false);
                return;
            }

            window.location.href = String(data.checkoutUrl);
        } catch {
            setStatusError("Checkout error. Fadlan isku day mar kale.");
            setIsPaying(false);
        }
    };

    const handlePay = async () => {
        if (!canProceedToPayment) {
            setStatusError("Marka hore samee Sign Up ama Login, kadibna bixi lacagta.");
            return;
        }

        if (paymentMethod === "store") {
            const params = new URLSearchParams();
            params.set("plan", selectedPlan.id);
            params.set("amount", selectedPlanPrice.toFixed(2));
            params.set("src", "fanbroj_pay");
            if (email) params.set("email", email);
            const storeTarget = `${storeUrl}${storeUrl.includes("?") ? "&" : "?"}${params.toString()}`;
            window.open(storeTarget, "_blank", "noopener,noreferrer");
            setStatusMessage("Waxaan kuu furnay SomaliWebsite store si aad Stripe/PayPal uga bixiso.");
            return;
        }

        await startSifaloCheckout();
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#020D18] text-white">
            <div className="absolute inset-0 -z-10">
                <Image src="/img/lm-bg.jpg" alt="Pay background" fill className="object-cover opacity-30" priority />
                <div className="absolute inset-0 bg-gradient-to-b from-[#021025]/95 via-[#030e1d]/95 to-[#020D18]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6 md:gap-8">
                    <aside className="rounded-2xl border border-white/10 bg-[#061327]/80 backdrop-blur-sm overflow-hidden">
                        <div className="p-6 border-b border-white/10 text-center">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto ring-4 ring-[#3B82F6]/40 bg-[#0d2036]">
                                <Image src="/img/right-cartoons.png" alt="User avatar" fill className="object-cover" />
                            </div>
                            <p className="mt-4 text-2xl font-black text-white">{userId ? "Member" : "Free User"}</p>
                            <p className="text-xs text-gray-300 mt-1 break-all">{email || "No email yet"}</p>
                        </div>
                        <div className="p-5 space-y-4 text-sm text-gray-300">
                            <div>
                                <p className="font-bold text-white">Freemium Mode</p>
                                <p>Timer lock + xad maalinle ah ayaa shaqeynaya ilaa aad Premium qaadato.</p>
                            </div>
                            <div>
                                <p className="font-bold text-white">Quick Tips</p>
                                <ul className="space-y-1 text-xs text-gray-400">
                                    <li>1. Email + Password kaliya (verification ma jiro).</li>
                                    <li>2. Account-kaaga si auto ah ayaa loo keydiyaa.</li>
                                    <li>3. Kadib payment, Premium wuu furmayaa isla markiiba.</li>
                                </ul>
                            </div>
                        </div>
                    </aside>

                    <section className="rounded-2xl border border-white/10 bg-[#061327]/80 backdrop-blur-sm p-5 md:p-8">
                        <h1 className="text-3xl md:text-4xl font-black mb-6">Premium Checkout</h1>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div>
                                <p className="text-2xl font-black mb-4"><span className="text-red-400">01</span> {canProceedToPayment ? "Login Complete" : "Sign Up / Login"}</p>

                                {canProceedToPayment ? (
                                    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-black text-green-300">Account diyaar ah ✅</p>
                                                <p className="text-xs text-gray-200 mt-1 break-all">{email || formEmail || "Logged in"}</p>
                                                <p className="text-xs text-gray-400 mt-2">Hadda toos u dooro payment method iyo plan.</p>
                                            </div>
                                            {!email && (
                                                <Loader2 size={16} className="text-green-300 animate-spin flex-shrink-0 mt-0.5" />
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="inline-flex rounded-lg bg-black/30 p-1 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => setAuthMode("signup")}
                                                className={`px-4 py-2 rounded-md text-sm font-bold ${authMode === "signup" ? "bg-[#1d4ed8] text-white" : "text-gray-300"}`}
                                            >
                                                Sign Up
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAuthMode("login")}
                                                className={`px-4 py-2 rounded-md text-sm font-bold ${authMode === "login" ? "bg-[#1d4ed8] text-white" : "text-gray-300"}`}
                                            >
                                                Login
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <input
                                                type="email"
                                                value={formEmail || email || ""}
                                                onChange={(e) => setFormEmail(e.target.value)}
                                                placeholder="email@example.com"
                                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#3B82F6]"
                                            />
                                            {authMode === "signup" && (
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    placeholder="Magacaaga (optional)"
                                                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#3B82F6]"
                                                />
                                            )}
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Password"
                                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#3B82F6]"
                                            />
                                            {authMode === "signup" && (
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm Password"
                                                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#3B82F6]"
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleAuth}
                                                disabled={isAuthLoading}
                                                className="w-full bg-[#e50914] hover:bg-[#c60912] disabled:opacity-60 rounded-xl py-3 font-black"
                                            >
                                                {isAuthLoading ? "Fadlan sug..." : authMode === "signup" ? "Create Account" : "Login"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <p className="text-2xl font-black mb-4"><span className="text-red-400">02</span> Payment Method</p>
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 ${canProceedToPayment ? "" : "opacity-60 pointer-events-none"}`}>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("sifalo")}
                                        disabled={!canProceedToPayment}
                                        className={`rounded-xl border p-4 text-left ${paymentMethod === "sifalo" ? "border-green-400 bg-green-500/10" : "border-white/20 bg-white/5"}`}
                                    >
                                        <p className="font-black text-lg">Sifalo Checkout</p>
                                        <p className="text-sm text-gray-300">EVC / eDahab / Zaad / Sahal / Card</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("store")}
                                        disabled={!canProceedToPayment}
                                        className={`rounded-xl border p-4 text-left ${paymentMethod === "store" ? "border-blue-400 bg-blue-500/10" : "border-white/20 bg-white/5"}`}
                                    >
                                        <p className="font-black text-lg">Stripe/PayPal Store</p>
                                        <p className="text-sm text-gray-300">SomaliWebsite.com (external)</p>
                                    </button>
                                </div>

                            <p className="text-2xl font-black mb-4"><span className="text-red-400">03</span> Choose Plan</p>
                            {initialBonusDays > 0 && selectedPlan.id === "monthly" && (
                                <div className="mb-4 rounded-xl border border-green-400/30 bg-green-500/10 p-3">
                                    <p className="text-sm font-black text-green-300">Monthly Bonus Active: +{initialBonusDays} maalmood</p>
                                    <p className="text-xs text-gray-300 mt-1">Offer-kan waa laga soo wareejiyay pricing page.</p>
                                </div>
                            )}
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${canProceedToPayment ? "" : "opacity-60 pointer-events-none"}`}>
                                {PLAN_OPTIONS.map((plan) => {
                                        const price = getPlanPrice(settings, plan);
                                        const active = plan.id === selectedPlanId;
                                        return (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() => setSelectedPlanId(plan.id)}
                                                disabled={!canProceedToPayment}
                                                className={`rounded-xl border p-4 text-left transition-colors ${active ? "border-[#3B82F6] bg-[#1d4ed8]/15" : "border-white/20 bg-white/5 hover:bg-white/10"}`}
                                            >
                                                <p className="font-black text-lg">{plan.label}</p>
                                                <p className="text-sm text-gray-300">{plan.duration}</p>
                                                <p className="text-xs text-gray-400 mt-1">{plan.subtitle}</p>
                                                <p className="text-2xl font-black mt-2">${price.toFixed(2)}</p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-5 rounded-xl border border-white/15 bg-black/30 p-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-gray-300">Total</p>
                                        <p className="text-3xl font-black">${selectedPlanPrice.toFixed(2)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePay}
                                        disabled={isPaying || !canProceedToPayment}
                                        className="px-8 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 font-black"
                                    >
                                        {!canProceedToPayment ? "Sign Up / Login First" : isPaying ? "Processing..." : `PAY $${selectedPlanPrice.toFixed(2)}`}
                                    </button>
                                </div>

                                {!canProceedToPayment && (
                                    <p className="mt-3 text-xs text-yellow-300">
                                        Marka hore samee Sign Up ama Login si payment method-ku u furmo.
                                    </p>
                                )}
                            </div>
                        </div>

                        {(statusMessage || statusError) && (
                            <div className={`mt-5 rounded-xl border p-3 ${statusError ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-green-500/40 bg-green-500/10 text-green-200"}`}>
                                {statusError || statusMessage}
                            </div>
                        )}

                        <div className="mt-7 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                            <p className="font-black text-yellow-300 mb-2">Old Sifalo Gateway (Fallback)</p>
                            <p className="text-sm text-gray-300 mb-3">Haddii checkout-ka cusub ku dhibo, isticmaal button-kan hoose oo direct ah.</p>
                            <button
                                type="button"
                                onClick={() => void startSifaloCheckout(selectedPlan.id)}
                                disabled={isPaying || !canProceedToPayment}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 text-black font-black hover:brightness-110 disabled:opacity-60"
                            >
                                <ShieldCheck size={16} />
                                Open Old Sifalo Checkout
                            </button>
                        </div>
                    </section>
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

    const initialPlanId: PlanId = planParam === "match"
        || planParam === "weekly"
        || planParam === "monthly"
        || planParam === "yearly"
        ? (planParam as PlanId)
        : "monthly";

    const initialAuthMode: "signup" | "login" = authParam === "login" ? "login" : "signup";
    const initialBonusDays = Number.isFinite(bonusDaysParam) ? Math.min(7, Math.max(0, Math.floor(bonusDaysParam))) : 0;

    if (sid || orderId) {
        return <PaymentVerifier sid={sid} orderId={orderId} />;
    }

    return (
        <CheckoutHub
            initialPlanId={initialPlanId}
            initialAuthMode={initialAuthMode}
            initialBonusDays={initialBonusDays}
            initialOfferCode={offerCodeParam}
        />
    );
}

export default function PayPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-black">
                    <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
                </div>
            }
        >
            <PayPageContent />
        </Suspense>
    );
}
