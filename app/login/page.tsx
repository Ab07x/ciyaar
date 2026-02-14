"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Loader2, CheckCircle2, XCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/providers/UserProvider";

// Generate a simple device ID
function getDeviceId(): string {
    if (typeof window === "undefined") return "";

    let deviceId = localStorage.getItem("fanbroj_device_id");
    if (!deviceId) {
        deviceId = `device_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        localStorage.setItem("fanbroj_device_id", deviceId);
    }
    return deviceId;
}

export default function LoginPage() {
    const router = useRouter();

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; plan?: string; expiresAt?: string } | null>(null);
    const [deviceId] = useState<string>(() => getDeviceId());
    const { isPremium, isLoading: userLoading } = useUser();

    useEffect(() => {
        // Device-based auth: if this device already has active premium, don't keep user on login page.
        if (!userLoading && isPremium) {
            router.replace("/");
        }
    }, [isPremium, userLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || loading) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/redemptions/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: code.trim().toUpperCase(),
                    deviceId,
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                }),
            });
            const response = await res.json();

            setResult(response);

            if (response.success) {
                // Store subscription info in localStorage
                localStorage.setItem("fanbroj_subscription", JSON.stringify({
                    plan: response.plan,
                    expiresAt: response.expiresAt,
                    activatedAt: Date.now(),
                }));

                // Redirect to home after 2 seconds
                setTimeout(() => {
                    router.push("/");
                }, 2000);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Khalad dhacay";
            setResult({ success: false, error: message });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-stadium-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block text-3xl font-black tracking-tighter text-white mb-2">
                        FAN<span className="text-accent-green">BROJ</span>
                    </Link>
                    <p className="text-text-secondary">Geli code-kaaga Premium</p>
                </div>

                {/* Login Card */}
                <div className="bg-stadium-elevated border border-border-subtle rounded-2xl p-6 shadow-elevated">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-accent-gold/20 p-4 rounded-full">
                            <Lock className="text-accent-gold" size={32} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Premium Code
                            </label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="XXXXXXXX"
                                    maxLength={12}
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-xl pl-10 pr-4 py-4 text-lg font-mono tracking-wider text-center uppercase focus:outline-none focus:ring-2 focus:ring-accent-gold/50 focus:border-accent-gold transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length < 6}
                            className="w-full bg-accent-gold text-black font-bold py-4 rounded-xl hover:bg-accent-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Checking...
                                </>
                            ) : (
                                "Activate Premium"
                            )}
                        </button>
                    </form>

                    {/* Result Message */}
                    {result && (
                        <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${result.success
                            ? "bg-accent-green/10 border border-accent-green/30"
                            : "bg-accent-red/10 border border-accent-red/30"
                            }`}>
                            {result.success ? (
                                <CheckCircle2 className="text-accent-green flex-shrink-0 mt-0.5" size={20} />
                            ) : (
                                <XCircle className="text-accent-red flex-shrink-0 mt-0.5" size={20} />
                            )}
                            <div>
                                <p className={result.success ? "text-accent-green" : "text-accent-red"}>
                                    {result.message || result.error}
                                </p>
                                {result.success && result.plan && (
                                    <p className="text-text-secondary text-sm mt-1">
                                        Plan: {result.plan.charAt(0).toUpperCase() + result.plan.slice(1)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-center space-y-3">
                    <p className="text-text-muted text-sm">
                        Ma lihid code? <Link href="/pricing" className="text-accent-gold hover:underline">Iibin Premium</Link>
                    </p>
                    <Link href="/" className="text-text-secondary text-sm hover:text-white transition-colors block">
                        ← Ku noqo Homepage
                    </Link>
                </div>
            </div>
        </div>
    );
}
