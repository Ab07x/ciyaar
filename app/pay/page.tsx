"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Crown, ArrowRight, RefreshCw, Copy, Check } from "lucide-react";
import Link from "next/link";

function PaymentVerifier() {
    const searchParams = useSearchParams();
    const sid = searchParams.get("sid");
    const orderId = searchParams.get("order_id");

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
                {/* Verifying State */}
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

                {/* Success State */}
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

                {/* Pending State */}
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

                {/* Failed State */}
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

                {/* Error State */}
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

export default function PayPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
            </div>
        }>
            <PaymentVerifier />
        </Suspense>
    );
}
