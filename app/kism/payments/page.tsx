"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, CheckCircle2, Clock3, Copy, CreditCard, RefreshCw, Search, XCircle } from "lucide-react";

type PaymentRow = {
    _id: string;
    orderId: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
    paymentType?: string;
    deviceId?: string;
    userId?: string;
    sifaloSid?: string;
    accessCode?: string;
    codeSource?: string;
    verifyAttempts?: number;
    lastGatewayStatus?: string;
    lastGatewayCode?: string;
    debugReason?: string;
    createdAt: number;
    completedAt?: number;
    failedAt?: number;
};

type PaymentStats = {
    all: number;
    pending: number;
    success: number;
    failed: number;
    stalePending: number;
};

type PaymentsResponse = {
    payments: PaymentRow[];
    total: number;
    page: number;
    limit: number;
    stats: PaymentStats;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatusBadge({ status }: { status: string }) {
    const normalized = status.toLowerCase();

    if (normalized === "success") {
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs font-bold"><CheckCircle2 size={12} /> success</span>;
    }
    if (normalized === "failed") {
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs font-bold"><XCircle size={12} /> failed</span>;
    }

    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-xs font-bold"><Clock3 size={12} /> pending</span>;
}

export default function AdminPaymentsPage() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [copiedValue, setCopiedValue] = useState("");

    const query = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "25");
        params.set("status", status);
        if (search.trim()) params.set("search", search.trim());
        return `/api/admin/payments?${params.toString()}`;
    }, [page, status, search]);

    const { data, isLoading, mutate } = useSWR<PaymentsResponse>(query, fetcher);

    const payments = data?.payments || [];
    const total = data?.total || 0;
    const limit = data?.limit || 25;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const copyText = async (value: string) => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopiedValue(value);
        window.setTimeout(() => setCopiedValue(""), 1800);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-black">PAYMENT DEBUG</h1>
                    <p className="text-text-muted">La soco auto payments, failures, iyo auto-generated access codes</p>
                </div>
                <button
                    onClick={() => void mutate()}
                    className="px-4 py-2 bg-stadium-hover text-white rounded-lg font-bold flex items-center gap-2 hover:bg-white/10"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
                    <p className="text-xs text-text-muted uppercase mb-1">Total</p>
                    <p className="text-2xl font-black text-white">{data?.stats?.all || 0}</p>
                </div>
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
                    <p className="text-xs text-text-muted uppercase mb-1">Pending</p>
                    <p className="text-2xl font-black text-yellow-300">{data?.stats?.pending || 0}</p>
                </div>
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
                    <p className="text-xs text-text-muted uppercase mb-1">Success</p>
                    <p className="text-2xl font-black text-green-300">{data?.stats?.success || 0}</p>
                </div>
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
                    <p className="text-xs text-text-muted uppercase mb-1">Failed</p>
                    <p className="text-2xl font-black text-red-300">{data?.stats?.failed || 0}</p>
                </div>
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4">
                    <p className="text-xs text-text-muted uppercase mb-1">Stale Pending</p>
                    <p className="text-2xl font-black text-orange-300">{data?.stats?.stalePending || 0}</p>
                </div>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex items-center gap-2 w-full md:max-w-md">
                    <Search size={16} className="text-text-muted" />
                    <input
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                        placeholder="Search orderId, deviceId, sid, code"
                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={(e) => {
                            setPage(1);
                            setStatus(e.target.value);
                        }}
                        className="bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-stadium-dark border-b border-border-strong">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs uppercase text-text-muted">Order</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-text-muted">Status</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-text-muted">Plan</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-text-muted">Access Code</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-text-muted">Gateway</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-text-muted">Debug Reason</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-text-muted">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">Loading payments...</td>
                                </tr>
                            )}

                            {!isLoading && payments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">No payment rows found</td>
                                </tr>
                            )}

                            {payments.map((payment) => (
                                <tr key={payment._id} className="border-b border-border-subtle last:border-b-0 align-top">
                                    <td className="px-4 py-3">
                                        <div className="font-mono text-white text-xs break-all">{payment.orderId}</div>
                                        <div className="text-text-muted text-xs mt-1">{payment.currency} {Number(payment.amount || 0).toFixed(2)}</div>
                                        {payment.deviceId && (
                                            <div className="text-text-muted text-[11px] mt-1 break-all">{payment.deviceId}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
                                    <td className="px-4 py-3 capitalize">
                                        <div className="font-bold text-white">{payment.plan}</div>
                                        <div className="text-text-muted text-xs">attempts: {payment.verifyAttempts || 0}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {payment.accessCode ? (
                                            <button
                                                onClick={() => void copyText(payment.accessCode || "")}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 font-mono text-xs"
                                            >
                                                <Copy size={12} />
                                                {copiedValue === payment.accessCode ? "Copied" : payment.accessCode}
                                            </button>
                                        ) : (
                                            <span className="text-text-muted text-xs">-</span>
                                        )}
                                        {payment.codeSource && (
                                            <div className="text-text-muted text-[11px] mt-1">{payment.codeSource}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs text-white flex items-center gap-1"><CreditCard size={12} /> {payment.paymentType || "-"}</div>
                                        <div className="text-text-muted text-[11px] mt-1 break-all">SID: {payment.sifaloSid || "-"}</div>
                                        <div className="text-text-muted text-[11px] break-all">Status: {payment.lastGatewayStatus || "-"} {payment.lastGatewayCode ? `(${payment.lastGatewayCode})` : ""}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {payment.debugReason ? (
                                            <div className="inline-flex items-start gap-1 text-yellow-300 text-xs">
                                                <AlertTriangle size={12} className="mt-0.5" />
                                                <span>{payment.debugReason}</span>
                                            </div>
                                        ) : (
                                            <span className="text-text-muted text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                                        <div>{new Date(payment.createdAt).toLocaleString()}</div>
                                        {payment.completedAt && <div className="text-green-300 mt-1">Done: {new Date(payment.completedAt).toLocaleString()}</div>}
                                        {payment.failedAt && <div className="text-red-300 mt-1">Fail: {new Date(payment.failedAt).toLocaleString()}</div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">Page {page} of {totalPages} • {total} rows</p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1.5 rounded bg-stadium-hover text-sm disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="px-3 py-1.5 rounded bg-stadium-hover text-sm disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
