"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { loginWithEmail, email: userEmail, isLoading: userLoading } = useUser();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

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

            {/* Support Link */}
            <div className="mt-8 relative z-10">
                <a href="mailto:support@fanbroj.net" className="text-gray-400 hover:text-white text-sm transition-colors">
                    support@fanbroj.net
                </a>
            </div>

            {/* Additional "Sign Up via Plans" Link (Since users arriving here without account need guidance) */}
            <div className="mt-4 relative z-10">
                <p className="text-gray-500 text-sm">
                    Kuma haysatid account? <Link href="/pricing" className="text-[#007bff] hover:underline font-bold">Sign Up (Dooro Plan)</Link>
                </p>
            </div>

        </div>
    );
}
