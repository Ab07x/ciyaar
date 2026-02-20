"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import { Loader2, Ticket, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { loginWithEmail, email: userEmail, isLoading: userLoading, deviceId } = useUser();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Code redemption state
    const [redeemCode, setRedeemCode] = useState("");
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemError, setRedeemError] = useState("");
    const [redeemSuccess, setRedeemSuccess] = useState("");

    // If already logged in, redirect to home
    useEffect(() => {
        if (!userLoading && userEmail) {
            router.replace("/");
        }
    }, [userEmail, userLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Fadlan geli email iyo password.");
            return;
        }

        setIsLoading(true);
        const result = await loginWithEmail(email.trim(), password);
        setIsLoading(false);

        if (!result.success) {
            setError(result.error || "Email ama Password waa khalad.");
            return;
        }

        // On success, redirect to home
        router.push("/");
    };

    const handleRedeemCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setRedeemError("");
        setRedeemSuccess("");

        if (!redeemCode.trim()) {
            setRedeemError("Fadlan geli code-ka.");
            return;
        }

        if (!deviceId) {
            setRedeemError("Device ID lama helin. Fadlan refresh samee.");
            return;
        }

        setIsRedeeming(true);
        try {
            const res = await fetch("/api/redemptions/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: redeemCode.trim().toUpperCase(),
                    deviceId,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setRedeemError(data.error || "Code-ku waa khalad.");
                setIsRedeeming(false);
                return;
            }

            setRedeemSuccess(
                data.trial
                    ? `Trial waa la furay! ${data.trialHours} saac.`
                    : `Premium waa la furay! ${data.durationDays} maalmood.`
            );
            setRedeemCode("");
            setIsRedeeming(false);

            // Redirect to home after 2 seconds
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch {
            setRedeemError("Khalad ayaa dhacay. Fadlan isku day mar kale.");
            setIsRedeeming(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b13] text-white font-sans selection:bg-[#ff1a4e] selection:text-white relative">

            {/* Logo Header (Optional, but LookMovie has it top-left absolute on actual site. Here we center or add above) */}
            <div className="mb-10 text-center">
                <Link href="/" className="text-4xl font-black tracking-tighter shadow-sm">
                    FAN<span className="text-[#ff1a4e] drop-shadow-[0_0_15px_rgba(255,26,78,0.5)]">BROJ</span>
                </Link>
            </div>

            {/* Login Box */}
            <div className="w-full max-w-[420px] bg-[#0e1628] rounded-xl border border-[#1e293b] p-8 shadow-2xl relative z-10">
                <form onSubmit={handleLogin} className="flex flex-col">

                    {/* Email Input */}
                    <div className="flex flex-col mb-5">
                        <label className="text-[13px] font-bold text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-[#131b2f] border border-transparent focus:border-[#ff1a4e] rounded-md px-4 py-3.5 text-white outline-none transition-colors text-sm"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col mb-4">
                        <label className="text-[13px] font-bold text-gray-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-[#131b2f] border border-transparent focus:border-[#ff1a4e] rounded-md px-4 py-3.5 text-white outline-none transition-colors text-sm font-sans tracking-widest"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Options Row */}
                    <div className="flex items-center justify-between mb-8 mt-2">
                        <label className="flex items-center cursor-pointer group">
                            <div className="relative flex items-center justify-center w-[18px] h-[18px] mr-2">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="appearance-none w-full h-full border border-gray-600 rounded-[4px] bg-[#131b2f] checked:bg-[#007bff] checked:border-transparent transition-all cursor-pointer"
                                />
                                {rememberMe && (
                                    <svg className="w-[10px] h-[10px] text-white absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-[13px] text-gray-200 font-bold tracking-wide group-hover:text-white transition-colors">Remember Me</span>
                        </label>
                        <Link href="/login" className="text-[13px] text-[#007bff] hover:text-[#3395ff] transition-colors font-medium">
                            Forgot your password?
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded text-center font-bold">
                            {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#ff1a4e] hover:bg-[#ff0038] disabled:opacity-50 disabled:hover:bg-[#ff1a4e] py-3.5 rounded-sm font-black text-[15px] tracking-wide text-white uppercase transition-all shadow-[0_0_15px_rgba(255,26,78,0.4)] hover:shadow-[0_0_25px_rgba(255,26,78,0.6)] flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                        {isLoading ? "LOADING..." : "LOGIN"}
                    </button>

                </form>
            </div>

            {/* Sign Up CTA — clear and prominent for mobile */}
            <div className="mt-6 relative z-10 text-center">
                <p className="text-gray-400 text-sm mb-2">
                    Account ma haysatid?
                </p>
                <Link href="/pricing" className="inline-block px-6 py-2.5 bg-white/10 border border-white/10 text-white font-bold text-sm rounded-lg hover:bg-white/15 transition-all">
                    Samee Account — Dooro Plan
                </Link>
            </div>

            {/* Divider */}
            <div className="mt-8 mb-6 flex items-center gap-3 w-full max-w-[420px] relative z-10">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Ama</span>
                <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Code Redemption Box */}
            <div className="w-full max-w-[420px] bg-[#0e1628] rounded-xl border border-[#1e293b] p-8 shadow-2xl relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Ticket size={20} className="text-[#007bff]" />
                    <h2 className="text-[15px] font-black text-white uppercase tracking-wide">Redeem Code</h2>
                </div>
                <p className="text-xs text-gray-400 mb-5">Haddii aad leedahay premium code, halkan ku geli.</p>

                <form onSubmit={handleRedeemCode} className="flex flex-col">
                    <div className="flex flex-col mb-4">
                        <label className="text-[13px] font-bold text-gray-300 mb-2">Premium Code</label>
                        <input
                            type="text"
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                            placeholder="XXXX-XXXX-XXXX"
                            className="bg-[#131b2f] border border-transparent focus:border-[#007bff] rounded-md px-4 py-3.5 text-white outline-none transition-colors text-sm font-mono tracking-wider uppercase"
                            disabled={isRedeeming}
                        />
                    </div>

                    {redeemError && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded text-center font-bold">
                            {redeemError}
                        </div>
                    )}

                    {redeemSuccess && (
                        <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm p-3 rounded flex items-center gap-2 font-bold">
                            <CheckCircle2 size={16} />
                            {redeemSuccess}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isRedeeming}
                        className="w-full bg-[#007bff] hover:bg-[#0056b3] disabled:opacity-50 disabled:hover:bg-[#007bff] py-3.5 rounded-sm font-black text-[15px] tracking-wide text-white uppercase transition-all shadow-[0_0_15px_rgba(0,123,255,0.3)] hover:shadow-[0_0_25px_rgba(0,123,255,0.5)] flex items-center justify-center gap-2"
                    >
                        {isRedeeming ? <Loader2 size={18} className="animate-spin" /> : <Ticket size={18} />}
                        {isRedeeming ? "ACTIVATING..." : "ACTIVATE CODE"}
                    </button>
                </form>
            </div>

            {/* Support */}
            <div className="mt-8 relative z-10">
                <a href="mailto:support@fanbroj.net" className="text-gray-500 hover:text-white text-xs transition-colors">
                    support@fanbroj.net
                </a>
            </div>

        </div>
    );
}
