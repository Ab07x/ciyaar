import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Device, Payment } from "@/lib/models";

type LeanPayment = {
    _id?: string;
    orderId?: string;
    plan?: string;
    amount?: number;
    currency?: string;
    status?: string;
    gateway?: string;
    paymentType?: string;
    accessCode?: string;
    createdAt?: number;
    completedAt?: number;
    failedAt?: number;
    failureReason?: string;
};

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const directUserId = String(searchParams.get("userId") || "").trim();
        const deviceId = String(searchParams.get("deviceId") || "").trim();
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 40)));

        let userId = directUserId;

        if (!userId && deviceId) {
            const device = await Device.findOne({ deviceId }).lean<{ userId?: string } | null>();
            userId = String(device?.userId || "");
        }

        if (!userId && !deviceId) {
            return NextResponse.json({ error: "userId or deviceId required" }, { status: 400 });
        }

        const filter: Record<string, unknown> = userId
            ? { userId }
            : { deviceId };

        const rows = await Payment.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean<LeanPayment[]>();

        const payments = rows.map((row) => ({
            _id: String(row._id || ""),
            orderId: String(row.orderId || ""),
            plan: String(row.plan || ""),
            amount: Number(row.amount || 0),
            currency: String(row.currency || "USD"),
            status: String(row.status || "pending"),
            gateway: String(row.gateway || "sifalo"),
            paymentType: String(row.paymentType || ""),
            accessCode: String(row.accessCode || ""),
            createdAt: Number(row.createdAt || 0),
            completedAt: Number(row.completedAt || 0),
            failedAt: Number(row.failedAt || 0),
            failureReason: String(row.failureReason || ""),
        }));

        return NextResponse.json({ payments });
    } catch (error) {
        console.error("GET /api/pay/history error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
