import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payment, Redemption } from "@/lib/models";
import { isAdminAuthenticated } from "@/lib/admin-auth";



type LeanPayment = {
    _id: string;
    orderId: string;
    deviceId?: string;
    userId?: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
    paymentType?: string;
    gateway?: string;
    sifaloSid?: string;
    paypalTxId?: string;
    mpesaTxId?: string;
    bonusDays?: number;
    offerCode?: string;
    accessCode?: string;
    accessCodeId?: string;
    verifyAttempts?: number;
    lastCheckedAt?: number;
    lastGatewayStatus?: string;
    lastGatewayCode?: string;
    lastGatewayMessage?: string;
    failureReason?: string;
    createdAt: number;
    completedAt?: number;
    failedAt?: number;
};

type LeanRedemption = {
    paymentOrderId?: string;
    code?: string;
    source?: string;
    usedAt?: number;
};

export async function GET(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
        const status = String(searchParams.get("status") || "all").trim().toLowerCase();
        const search = String(searchParams.get("search") || "").trim();

        const filter: Record<string, unknown> = {};

        if (status && status !== "all") {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { orderId: { $regex: search, $options: "i" } },
                { deviceId: { $regex: search, $options: "i" } },
                { userId: { $regex: search, $options: "i" } },
                { plan: { $regex: search, $options: "i" } },
                { sifaloSid: { $regex: search, $options: "i" } },
                { accessCode: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;

        const [payments, total, statusAgg, pendingStaleCount] = await Promise.all([
            Payment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean<LeanPayment[]>(),
            Payment.countDocuments(filter),
            Payment.aggregate([
                { $match: {} },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            Payment.countDocuments({
                status: "pending",
                createdAt: { $lt: Date.now() - 15 * 60 * 1000 },
            }),
        ]);

        const orderIds = payments.map((p) => p.orderId).filter(Boolean);

        let redemptions: LeanRedemption[] = [];
        if (orderIds.length > 0) {
            redemptions = await Redemption.find({ paymentOrderId: { $in: orderIds } })
                .select("paymentOrderId code source usedAt")
                .lean<LeanRedemption[]>();
        }

        const redemptionByOrder = new Map<string, LeanRedemption>();
        for (const redemption of redemptions) {
            const key = String(redemption.paymentOrderId || "");
            if (!key) continue;
            redemptionByOrder.set(key, redemption);
        }

        const rows = payments.map((payment) => {
            const linkedCode = redemptionByOrder.get(payment.orderId);
            const accessCode = payment.accessCode || linkedCode?.code || "";
            const debugReason = payment.failureReason
                || payment.lastGatewayMessage
                || (payment.status === "pending" ? "Awaiting payment callback/verify" : "");

            return {
                ...payment,
                accessCode,
                codeSource: linkedCode?.source || (payment.accessCode ? "auto_payment" : ""),
                codeUsedAt: linkedCode?.usedAt || null,
                debugReason,
            };
        });

        const statsMap = new Map<string, number>();
        statusAgg.forEach((row: { _id?: string; count?: number }) => {
            const key = String(row._id || "");
            if (!key) return;
            statsMap.set(key, Number(row.count || 0));
        });

        return NextResponse.json({
            payments: rows,
            total,
            page,
            limit,
            stats: {
                all: Number(statsMap.get("pending") || 0) + Number(statsMap.get("success") || 0) + Number(statsMap.get("failed") || 0),
                pending: Number(statsMap.get("pending") || 0),
                success: Number(statsMap.get("success") || 0),
                failed: Number(statsMap.get("failed") || 0),
                stalePending: pendingStaleCount,
            },
        });
    } catch (error) {
        console.error("GET /api/admin/payments error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
