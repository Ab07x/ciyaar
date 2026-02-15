"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Smartphone, Tv, AlertTriangle } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

type PairStatus = "pending" | "paired" | "expired" | "cancelled";

type PairSessionInfo = {
    code: string;
    status: PairStatus;
    expiresAt: number;
};

function normalizeCode(value: string | null): string {
    return (value || "").trim().toUpperCase();
}

function formatRemaining(expiresAt: number): string {
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function TVPairPage() {
    const searchParams = useSearchParams();
    const code = useMemo(() => normalizeCode(searchParams.get("code")), [searchParams]);
    const { deviceId, userId, isLoading } = useUser();

    const [session, setSession] = useState<PairSessionInfo | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [isChecking, setIsChecking] = useState(false);
    const [isLinking, setIsLinking] = useState(false);

    const fetchSession = useCallback(async () => {
        if (!code) return;

        setIsChecking(true);
        try {
            const res = await fetch(`/api/tv/pair?code=${encodeURIComponent(code)}`, {
                cache: "no-store",
            });
            const data = await res.json();

            if (!res.ok) {
                setSession(null);
                setStatusMessage(data?.error || "Pairing code ma shaqeynayo.");
                return;
            }

            setSession({
                code: data.code,
                status: data.status,
                expiresAt: Number(data.expiresAt || 0),
            });

            if (data.status === "paired") {
                setStatusMessage("TV-gaan hore ayaa loo xiray account.");
            } else if (data.status === "expired") {
                setStatusMessage("Code-kan wuu dhacay. Fur TV-ga oo samee code cusub.");
            } else if (data.status === "cancelled") {
                setStatusMessage("Pairing-kan waa la joojiyay. Samee code cusub TV-ga.");
            } else {
                setStatusMessage("");
            }
        } catch {
            setStatusMessage("Network error. Isku day mar kale.");
        } finally {
            setIsChecking(false);
        }
    }, [code]);

    useEffect(() => {
        void fetchSession();
    }, [fetchSession]);

    const handleLinkTV = async () => {
        if (!code) return;
        if (!deviceId) {
            setStatusMessage("Phone session lama helin. Fadlan refresh garee bogga.");
            return;
        }

        setIsLinking(true);
        setStatusMessage("");

        try {
            const res = await fetch("/api/tv/pair", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    phoneDeviceId: deviceId,
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setStatusMessage(data?.error || "TV pairing failed.");
                return;
            }

            setSession((prev) => {
                if (!prev) {
                    return { code, status: "paired", expiresAt: Date.now() + 60_000 };
                }
                return { ...prev, status: "paired" };
            });
            setStatusMessage("TV-ga waa ku xirmay account-kaaga. Hadda ka daawo TV-ga.");
        } catch {
            setStatusMessage("Network error. Isku day mar kale.");
        } finally {
            setIsLinking(false);
        }
    };

    const canLink = Boolean(
        code &&
        !isLoading &&
        userId &&
        deviceId &&
        session?.status === "pending"
    );

    return (
        <div className="min-h-screen bg-[#040b16] text-white flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center text-green-300">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">Link TV to Your Account</h1>
                        <p className="text-white/65 text-sm">Fanbroj TV instant pairing</p>
                    </div>
                </div>

                {!code && (
                    <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200 text-sm">
                        Pairing code lama helin. Scan QR code-ka TV-ga ama geli link sax ah.
                    </div>
                )}

                {code && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Pairing Code</p>
                            <p className="text-3xl font-black tracking-[0.18em] text-green-300">{code}</p>
                            {session?.status === "pending" && (
                                <p className="text-sm text-white/70 mt-2">
                                    Wuxuu dhacayaa: <span className="font-bold text-yellow-300">{formatRemaining(session.expiresAt)}</span>
                                </p>
                            )}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75 flex items-start gap-3">
                            <Tv className="text-white/60 mt-0.5" size={18} />
                            <div>
                                <p>Markaad riixdo, TV-ga wuxuu isla account-kan la wadaagi doonaa login + premium status.</p>
                                <p className="text-white/50 mt-1">Device: <span className="font-mono">{deviceId || "loading..."}</span></p>
                            </div>
                        </div>

                        {statusMessage && (
                            <div className={`rounded-2xl p-4 text-sm border ${session?.status === "paired"
                                ? "border-green-400/30 bg-green-500/10 text-green-200"
                                : "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"
                                }`}>
                                <div className="flex items-start gap-2">
                                    {session?.status === "paired" ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertTriangle size={18} className="mt-0.5" />}
                                    <p>{statusMessage}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            disabled={!canLink || isLinking || isChecking}
                            onClick={handleLinkTV}
                            className="w-full rounded-xl bg-green-500 text-black font-black py-3.5 hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {(isLinking || isChecking) ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            {session?.status === "paired" ? "TV Already Linked" : "Link This TV"}
                        </button>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => void fetchSession()}
                                className="flex-1 rounded-xl bg-white/10 py-3 font-semibold hover:bg-white/20 transition-colors"
                            >
                                Refresh Status
                            </button>
                            <Link
                                href="/"
                                className="flex-1 rounded-xl bg-white text-black py-3 text-center font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
