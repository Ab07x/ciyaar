"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, User } from "lucide-react";

export const dynamic = "force-dynamic";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get("from") || "/kism";

    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/kism/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push(from);
                router.refresh();
            } else {
                setError(data.error || "Login failed");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black tracking-tighter mb-2">
                    FAN<span className="text-accent-green">BROJ</span>
                </h1>
                <p className="text-text-muted text-sm uppercase tracking-wider">Admin Panel</p>
            </div>

            {/* Login Card */}
            <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-stadium-hover rounded-2xl mx-auto mb-6">
                    <Lock size={32} className="text-accent-green" />
                </div>

                <h2 className="text-xl font-bold text-center mb-2">Admin Login</h2>
                <p className="text-text-muted text-center text-sm mb-8">
                    Gali username iyo password-ka
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                                required
                                className="w-full bg-stadium-dark border border-border-subtle rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                required
                                className="w-full bg-stadium-dark border border-border-subtle rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">
                            <AlertCircle size={18} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent-green text-black font-bold py-4 rounded-xl hover:bg-accent-green/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                Gal <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <p className="text-text-muted text-xs text-center mt-6">
                © {new Date().getFullYear()} Fanbroj. Admin access only.
            </p>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-stadium-dark flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
