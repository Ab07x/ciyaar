import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payment, Device, Subscription } from "@/lib/models";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOrCreateAutoPaymentRedemption } from "@/lib/auto-redemption";

const PLAN_DURATIONS: Record<string, number> = {
    match: 1,
    weekly: 7,
    monthly: 30,
    yearly: 365,
};

const PLAN_DEVICES: Record<string, number> = {
    match: 1,
    weekly: 2,
    monthly: 3,
    yearly: 5,
};

type PaymentRecord = {
    orderId: string;
    status: string;
    plan: string;
    deviceId: string;
    bonusDays?: number;
};

type DeviceRecord = {
    _id?: string;
    userId?: string;
};

export async function POST(request: NextRequest) {
    try {
        if (!isAdminAuthenticated(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        const payment = await Payment.findOne({ orderId }).lean<PaymentRecord | null>();
        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }
        if (payment.status === "success") {
            return NextResponse.json({ error: "Already approved" }, { status: 400 });
        }

        const plan = payment.plan as "match" | "weekly" | "monthly" | "yearly";
        const baseDurationDays = PLAN_DURATIONS[plan] || 30;
        const bonusDays = Math.max(0, Number(payment.bonusDays) || 0);
        const durationDays = baseDurationDays + bonusDays;
        const maxDevices = PLAN_DEVICES[plan] || 1;

        const device = await Device.findOne({ deviceId: payment.deviceId }).lean<DeviceRecord | null>();
        if (!device) {
            return NextResponse.json({ error: "Device not found for this payment" }, { status: 404 });
        }

        const userId = device.userId || device._id;

        const access = await getOrCreateAutoPaymentRedemption({
            paymentOrderId: orderId,
            userId: String(userId),
            plan,
            durationDays,
            maxDevices,
        });

        await Subscription.create({
            userId,
            plan,
            durationDays,
            maxDevices,
            status: "active",
            codeId: access.redemptionId,
            expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
            createdAt: Date.now(),
        });

        await Payment.findOneAndUpdate(
            { orderId },
            {
                status: "success",
                paymentType: "paypal_manual",
                userId,
                accessCode: access.code,
                accessCodeId: access.redemptionId,
                completedAt: Date.now(),
                failureReason: "",
            }
        );

        return NextResponse.json({ success: true, code: access.code });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Approval failed";
        console.error("PayPal approve error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
