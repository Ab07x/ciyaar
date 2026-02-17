"use client";

import Link from "next/link";
import useSWR from "swr";
import { CreditCard, History, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

type PaymentRow = {
    _id: string;
    orderId: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    paymentType?: string;
    accessCode?: string;
    createdAt: number;
    completedAt?: number;
    failedAt?: number;
    failureReason?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function statusBadge(status: string) {
    const normalized = status.toLowerCase();
    if (normalized === "success" || normalized === "completed") {
        return "bg-green-500/15 text-green-400 border-green-500/30";
    }
    if (normalized === "failed") {
        return "bg-red-500/15 text-red-400 border-red-500/30";
    }
    return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
}

function formatPlan(plan: string) {
    if (!plan) return "Plan";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export default function PaymentsPage() {
    const { userId, deviceId, isLoading: isUserLoading } = useUser();

    // Only fetch if we have either userId or deviceId, but prefer userId for full history
    const shouldFetch = !isUserLoading && (userId || deviceId);
    const query = userId
        ? `userId=${encodeURIComponent(userId)}`
        : deviceId
            ? `deviceId=${encodeURIComponent(deviceId)}`
            : "";

    const { data, isLoading: isDataLoading } = useSWR<{ payments: PaymentRow[] }>(
        shouldFetch ? `/api/pay/history?${query}` : null,
        fetcher
    );

    const payments = data?.payments || [];
    const isLoading = isUserLoading || (shouldFetch && isDataLoading);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="h-8 w-64 bg-white/10 rounded mb-8 animate-pulse" />
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!userId && !deviceId) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <CreditCard className="w-12 h-12 text-text-muted" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Payments History</h1>
                <p className="text-text-secondary max-w-md mb-8">
                    Fadlan soo gal (login) si aad u aragto taariikhda.
                </p>
                <Link
                    href="/pay?auth=login"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-green text-black font-bold px-5 py-3 hover:brightness-110 transition-all"
                >
                    <History size={18} />
                    Login / Sign Up
                </Link>
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <CreditCard className="w-12 h-12 text-text-muted" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Payments History</h1>
                <p className="text-text-secondary max-w-md mb-8">
                    Wali wax lacag-bixin ah laguma diiwaangelin account-kan.
                </p>
                <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-green text-black font-bold px-5 py-3 hover:brightness-110 transition-all"
                >
                    <CreditCard size={18} />
                    Iibso Premium
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between gap-3 mb-8">
                <h1 className="text-3xl font-black flex items-center gap-3">
                    <History className="text-accent-gold" />
                    Payments History
                </h1>
                <Link
                    href="/subscription"
                    className="text-sm font-bold text-text-secondary hover:text-white transition-colors"
                >
                    Subscription →
                </Link>
            </div>

            <div className="space-y-3">
                {payments.map((payment) => {
                    const status = payment.status.toLowerCase();
                    const statusIcon =
                        status === "success" ? <CheckCircle2 size={16} /> :
                            status === "failed" ? <XCircle size={16} /> :
                                <Clock3 size={16} />;

                    return (
                        <div
                            key={payment._id || payment.orderId}
                            className="rounded-2xl border border-white/10 bg-stadium-elevated p-4"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="font-bold">
                                        {formatPlan(payment.plan)} - {payment.currency} {payment.amount.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">
                                        Order: {payment.orderId || "N/A"} • Gateway: {payment.gateway || "sifalo"}
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">
                                        Created: {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "N/A"}
                                    </p>
                                </div>

                                <span className={`inline-flex items-center gap-1 text-xs font-black uppercase px-2.5 py-1 rounded-full border ${statusBadge(payment.status)}`}>
                                    {statusIcon}
                                    {payment.status}
                                </span>
                            </div>

                            {(payment.accessCode || payment.failureReason) && (
                                <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                                    {payment.accessCode && (
                                        <p className="text-text-secondary">
                                            Access Code: <span className="font-mono text-white">{payment.accessCode}</span>
                                        </p>
                                    )}
                                    {payment.failureReason && (
                                        <p className="text-red-400 mt-1">{payment.failureReason}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
