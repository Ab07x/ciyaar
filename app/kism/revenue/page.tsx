"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";
import { DollarSign, TrendingUp, Users, Calendar, CreditCard, ArrowUp, ArrowDown, Download } from "lucide-react";

const {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} = require("recharts"); // eslint-disable-line @typescript-eslint/no-require-imports

const fetcher = (url: string) => fetch(url).then(r => r.json());

const GATEWAY_COLORS: Record<string, string> = {
    checkout: "#f97316",
    stripe:   "#635bff",
    paypal:   "#003087",
    mpesa:    "#00A651",
    unknown:  "#6b7280",
};

const PLAN_COLORS: Record<string, string> = {
    match:   "#f472b6",
    weekly:  "#60a5fa",
    monthly: "#4ade80",
    yearly:  "#facc15",
};

function StatCard({
    label, value, sub, icon: Icon, color = "text-white", trend,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    color?: string;
    trend?: number;
}) {
    return (
        <div className="bg-stadium-elevated border border-border-strong rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-text-muted text-sm font-medium">{label}</span>
                <Icon size={18} className={color} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
            {trend !== undefined && trend !== 0 && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${trend > 0 ? "text-accent-green" : "text-accent-red"}`}>
                    {trend > 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                    {Math.abs(trend).toFixed(0)}% vs last month
                </div>
            )}
        </div>
    );
}

function downloadCSV(data: object[], filename: string) {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const rows = [keys.join(","), ...data.map(r => keys.map(k => (r as Record<string, unknown>)[k]).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

export default function RevenueDashboard() {
    const { data, isLoading } = useSWR("/api/admin/revenue", fetcher, { refreshInterval: 60000 });

    if (isLoading || !data) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-black text-white">REVENUE DASHBOARD</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-stadium-elevated border border-border-strong rounded-xl p-5 animate-pulse h-24" />
                    ))}
                </div>
            </div>
        );
    }

    const trend = data.lastMonthRevenue > 0
        ? ((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100
        : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">REVENUE DASHBOARD</h1>
                    <p className="text-text-muted text-sm">Real-time financial overview</p>
                </div>
                <button
                    onClick={() => downloadCSV(data.dailyChart, "revenue-30d.csv")}
                    className="flex items-center gap-2 px-4 py-2 bg-stadium-elevated border border-border-strong rounded-lg text-sm font-semibold hover:bg-stadium-hover transition-colors"
                >
                    <Download size={15} />
                    Export CSV
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="MRR"
                    value={`$${data.mrr.toFixed(0)}`}
                    sub="Monthly Recurring Revenue"
                    icon={TrendingUp}
                    color="text-accent-green"
                />
                <StatCard
                    label="ARR"
                    value={`$${data.arr.toFixed(0)}`}
                    sub="Annual Run Rate"
                    icon={TrendingUp}
                    color="text-accent-gold"
                />
                <StatCard
                    label="This Month"
                    value={`$${data.thisMonthRevenue.toFixed(2)}`}
                    sub={`Last month: $${data.lastMonthRevenue.toFixed(2)}`}
                    icon={Calendar}
                    color="text-accent-blue"
                    trend={trend}
                />
                <StatCard
                    label="All-Time Revenue"
                    value={`$${data.totalRevenue.toFixed(2)}`}
                    sub={`${data.totalPayments} successful payments`}
                    icon={DollarSign}
                    color="text-white"
                />
                <StatCard
                    label="Active Subscribers"
                    value={data.activeSubscriptions.toLocaleString()}
                    sub="Currently active plans"
                    icon={Users}
                    color="text-accent-green"
                />
                <StatCard
                    label="New Today"
                    value={data.newToday.toLocaleString()}
                    sub={`${data.newThisWeek} this week`}
                    icon={Users}
                    color="text-accent-blue"
                />
                <StatCard
                    label="LTV (Est.)"
                    value={data.activeSubscriptions > 0
                        ? `$${(data.totalRevenue / Math.max(data.totalPayments, 1) * 3).toFixed(2)}`
                        : "$0"}
                    sub="Avg 3× purchases per user"
                    icon={CreditCard}
                    color="text-purple-400"
                />
                <StatCard
                    label="Avg Order Value"
                    value={data.totalPayments > 0
                        ? `$${(data.totalRevenue / data.totalPayments).toFixed(2)}`
                        : "$0"}
                    sub="Per successful payment"
                    icon={DollarSign}
                    color="text-pink-400"
                />
            </div>

            {/* 30-Day Revenue Chart */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-accent-green" />
                    Revenue — Last 30 Days
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data.dailyChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: "#6b7280", fontSize: 11 }}
                            tickFormatter={(v: string) => v.slice(5)}
                            interval={4}
                        />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                        <Tooltip
                            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                            labelStyle={{ color: "#9ca3af" }}
                            itemStyle={{ color: "#4ade80" }}
                            formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} fill="url(#revenueGrad)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Plan + Gateway Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Plan */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h2 className="font-bold text-white mb-4">Revenue by Plan</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.revenueByPlan} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="plan" tick={{ fill: "#6b7280", fontSize: 12 }} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                            <Tooltip
                                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                                formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name]}
                            />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                {data.revenueByPlan.map((entry: { plan: string }) => (
                                    <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? "#6b7280"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                        {data.revenueByPlan.map((row: { plan: string; count: number; revenue: number }) => (
                            <div key={row.plan} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: PLAN_COLORS[row.plan] ?? "#6b7280" }} />
                                    <span className="text-text-secondary capitalize">{row.plan}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-text-muted">{row.count} orders</span>
                                    <span className="font-bold text-white">${row.revenue.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue by Gateway */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6">
                    <h2 className="font-bold text-white mb-4">Revenue by Payment Method</h2>
                    {data.revenueByGateway.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={data.revenueByGateway}
                                        dataKey="revenue"
                                        nameKey="gateway"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={40}
                                    >
                                        {data.revenueByGateway.map((entry: { gateway: string }) => (
                                            <Cell key={entry.gateway} fill={GATEWAY_COLORS[entry.gateway] ?? "#6b7280"} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                                        formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                                    />
                                    <Legend formatter={(value: string) => (
                                        <span style={{ color: "#9ca3af", fontSize: 12, textTransform: "capitalize" }}>{value}</span>
                                    )} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 space-y-2">
                                {data.revenueByGateway.map((row: { gateway: string; count: number; revenue: number }) => (
                                    <div key={row.gateway} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ background: GATEWAY_COLORS[row.gateway] ?? "#6b7280" }} />
                                            <span className="text-text-secondary capitalize">{row.gateway}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-text-muted">{row.count} orders</span>
                                            <span className="font-bold text-white">${row.revenue.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-text-muted">
                            No payment data yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
