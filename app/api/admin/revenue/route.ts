import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payment, Subscription } from "@/lib/models";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// Monthly-equivalent revenue for MRR calculation
const PLAN_MONTHLY_EQUIV: Record<string, number> = {
    match:   1.50,   // one-off 3-day plan — not recurring
    weekly:  3.00 * 4.33,  // ~$12.99/mo equiv
    monthly: 6.00,
    yearly:  80.00 / 12,   // ~$6.67/mo equiv
};

interface LeanPayment {
    plan?: string;
    amount?: number;
    gateway?: string;
    completedAt?: number;
    createdAt?: number;
}

interface LeanSubscription {
    plan?: string;
    createdAt?: number;
}

export async function GET(req: NextRequest) {
    if (!isAdminAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = Date.now();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    const [allPayments, activeSubscriptions, newToday, newThisWeek, last30Subscriptions] =
        await Promise.all([
            Payment.find({ status: "success" })
                .select("plan amount gateway completedAt createdAt")
                .lean<LeanPayment[]>(),
            Subscription.countDocuments({ status: "active", expiresAt: { $gt: now } }),
            Subscription.countDocuments({ createdAt: { $gte: todayStart.getTime() } }),
            Subscription.countDocuments({ createdAt: { $gte: weekStart } }),
            Subscription.find({ status: "active", expiresAt: { $gt: now } })
                .select("plan createdAt")
                .lean<LeanSubscription[]>(),
        ]);

    // Revenue totals
    const totalRevenue = allPayments.reduce((s, p) => s + (p.amount ?? 0), 0);

    const thisMonthRevenue = allPayments
        .filter(p => (p.completedAt ?? p.createdAt ?? 0) >= startOfMonth.getTime())
        .reduce((s, p) => s + (p.amount ?? 0), 0);

    const lastMonthRevenue = allPayments
        .filter(p => {
            const ts = p.completedAt ?? p.createdAt ?? 0;
            return ts >= startOfLastMonth.getTime() && ts < startOfMonth.getTime();
        })
        .reduce((s, p) => s + (p.amount ?? 0), 0);

    // MRR from currently active subscriptions
    const mrr = last30Subscriptions.reduce(
        (s, sub) => s + (PLAN_MONTHLY_EQUIV[sub.plan ?? ""] ?? 0), 0
    );

    // Revenue by plan
    const planMap: Record<string, { count: number; revenue: number }> = {};
    for (const p of allPayments) {
        const key = p.plan ?? "unknown";
        planMap[key] = planMap[key] ?? { count: 0, revenue: 0 };
        planMap[key].count++;
        planMap[key].revenue += p.amount ?? 0;
    }

    // Revenue by gateway
    const gwMap: Record<string, { count: number; revenue: number }> = {};
    for (const p of allPayments) {
        const key = p.gateway ?? "unknown";
        gwMap[key] = gwMap[key] ?? { count: 0, revenue: 0 };
        gwMap[key].count++;
        gwMap[key].revenue += p.amount ?? 0;
    }

    // 30-day daily chart
    const dailyMap: Record<string, number> = {};
    for (const p of allPayments) {
        const ts = p.completedAt ?? p.createdAt ?? 0;
        if (ts < thirtyDaysAgo) continue;
        const date = new Date(ts).toISOString().slice(0, 10);
        dailyMap[date] = (dailyMap[date] ?? 0) + (p.amount ?? 0);
    }

    const dailyChart = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now - (29 - i) * 86400000).toISOString().slice(0, 10);
        return { date, revenue: Math.round((dailyMap[date] ?? 0) * 100) / 100 };
    });

    return NextResponse.json({
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
        lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100,
        activeSubscriptions,
        newToday,
        newThisWeek,
        totalPayments: allPayments.length,
        revenueByPlan: Object.entries(planMap).map(([plan, d]) => ({
            plan,
            count: d.count,
            revenue: Math.round(d.revenue * 100) / 100,
        })),
        revenueByGateway: Object.entries(gwMap).map(([gateway, d]) => ({
            gateway,
            count: d.count,
            revenue: Math.round(d.revenue * 100) / 100,
        })),
        dailyChart,
    });
}
