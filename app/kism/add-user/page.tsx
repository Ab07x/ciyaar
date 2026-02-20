"use client";

import { useState } from "react";
import { UserPlus, Copy, Check, Loader2, MessageCircle } from "lucide-react";

const PLANS = [
    { id: "weekly", label: "Plus (Weekly)", days: 7, devices: 2 },
    { id: "monthly", label: "Pro (Monthly)", days: 30, devices: 3 },
    { id: "yearly", label: "Elite (Yearly)", days: 365, devices: 5 },
];

export default function AddUserPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [plan, setPlan] = useState("monthly");
    const [customDays, setCustomDays] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const selectedPlan = PLANS.find((p) => p.id === plan)!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setResult(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    displayName: displayName.trim(),
                    phoneNumber: phoneNumber.trim(),
                    plan,
                    customDays: customDays ? Number(customDays) : null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
                return;
            }

            setResult(data);
        } catch {
            setError("Network error — try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const getWhatsAppMessage = () => {
        if (!result) return "";
        const days = customDays ? Number(customDays) : selectedPlan.days;
        return `Assalamu Calaykum! ✅

Fanbroj Premium waa laguu diyaariyay.

📧 Email: ${result.email}
🔑 Password: ${password}
📅 Plan: ${selectedPlan.label} (${days} maalmood)

Sida loo isticmaalo:
1. Tag https://fanbroj.net/login
2. Geli Email iyo Password
3. Daawo movies & sports!

Su'aal haddii aad qabto naga soo wac WhatsApp.
— Fanbroj Team`;
    };

    const copyCredentials = () => {
        if (!result) return;
        const text = `Email: ${result.email}\nPassword: ${password}\nPlan: ${selectedPlan.label}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const msg = encodeURIComponent(getWhatsAppMessage());
        const phone = phoneNumber.replace(/\D/g, "");
        const url = phone
            ? `https://wa.me/${phone}?text=${msg}`
            : `https://wa.me/?text=${msg}`;
        window.open(url, "_blank");
    };

    const handleReset = () => {
        setEmail("");
        setPassword("");
        setDisplayName("");
        setPhoneNumber("");
        setCustomDays("");
        setResult(null);
        setError("");
    };

    return (
        <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center">
                    <UserPlus size={20} className="text-accent-green" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Add User (Manual Payment)</h1>
                    <p className="text-sm text-text-muted">Create account + activate plan for cash-paying users</p>
                </div>
            </div>

            {/* Success Result */}
            {result && (
                <div className="mb-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6">
                    <h3 className="text-green-400 font-bold text-lg mb-3">
                        {result.isNewUser ? "Account Created + Plan Activated" : "Plan Activated (Existing User)"}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-300 mb-5">
                        <p><span className="text-gray-500">Email:</span> <span className="font-mono text-white">{result.email}</span></p>
                        <p><span className="text-gray-500">Password:</span> <span className="font-mono text-white">{password}</span></p>
                        <p><span className="text-gray-500">Plan:</span> <span className="text-white">{selectedPlan.label}</span></p>
                        <p><span className="text-gray-500">Duration:</span> <span className="text-white">{result.durationDays} days</span></p>
                        <p><span className="text-gray-500">Expires:</span> <span className="text-white">{new Date(result.expiresAt).toLocaleDateString()}</span></p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={copyCredentials}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-lg transition-all"
                        >
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            {copied ? "Copied!" : "Copy Credentials"}
                        </button>

                        <button
                            onClick={shareWhatsApp}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm rounded-lg transition-all"
                        >
                            <MessageCircle size={16} />
                            Share via WhatsApp
                        </button>

                        <button
                            onClick={handleReset}
                            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-sm rounded-lg transition-all"
                        >
                            Add Another User
                        </button>
                    </div>
                </div>
            )}

            {/* Form */}
            {!result && (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1.5">Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="user@example.com"
                            className="w-full bg-stadium-elevated border border-border-strong rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-accent-green transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">If user already exists, plan will be activated on their existing account.</p>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1.5">Password *</label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Minimum 6 characters"
                            className="w-full bg-stadium-elevated border border-border-strong rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-accent-green transition-colors font-mono"
                        />
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1.5">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Optional — auto-generated from email if empty"
                            className="w-full bg-stadium-elevated border border-border-strong rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-accent-green transition-colors"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1.5">Phone / WhatsApp Number</label>
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+252XXXXXXXXX"
                            className="w-full bg-stadium-elevated border border-border-strong rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-accent-green transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for the WhatsApp share button after creation.</p>
                    </div>

                    {/* Plan Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Select Plan *</label>
                        <div className="grid grid-cols-3 gap-3">
                            {PLANS.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPlan(p.id)}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                                        plan === p.id
                                            ? "border-accent-green bg-accent-green/10 text-white"
                                            : "border-border-strong bg-stadium-elevated text-gray-400 hover:border-gray-600"
                                    }`}
                                >
                                    <p className="font-bold text-sm">{p.label}</p>
                                    <p className="text-xs mt-1 opacity-70">{p.days} days</p>
                                    <p className="text-xs opacity-50">{p.devices} devices</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Duration Override */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1.5">Custom Duration (optional)</label>
                        <input
                            type="number"
                            value={customDays}
                            onChange={(e) => setCustomDays(e.target.value)}
                            placeholder={`Default: ${selectedPlan.days} days — override here`}
                            min={1}
                            className="w-full bg-stadium-elevated border border-border-strong rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-accent-green transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">Override the plan duration. E.g. give 45 days on a monthly plan.</p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-accent-green hover:bg-accent-green/90 text-black font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                        {isLoading ? "Creating..." : "Create User & Activate Plan"}
                    </button>
                </form>
            )}
        </div>
    );
}
