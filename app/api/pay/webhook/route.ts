import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payment, Device, Subscription } from "@/lib/models";

// Plan duration mapping (days)
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

// POST /api/pay/webhook — Sifalo Pay callback/webhook
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        console.log("Sifalo webhook received:", JSON.stringify(body));

        const { sid, status, order_id, payment_type } = body;

        if (!sid && !order_id) {
            return NextResponse.json({ error: "Missing sid or order_id" }, { status: 400 });
        }

        // Find payment record
        let payment: any = null;
        if (order_id) {
            payment = await Payment.findOne({ orderId: order_id }).lean();
        }
        if (!payment && sid) {
            payment = await Payment.findOne({ sifaloSid: sid }).lean();
        }
        // Also try matching by sifaloKey or sifaloToken
        if (!payment && body.key) {
            payment = await Payment.findOne({ sifaloKey: body.key }).lean();
        }

        if (!payment) {
            console.error("Webhook: Payment not found for", { sid, order_id });
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Already processed
        if (payment.status === "success") {
            return NextResponse.json({ message: "Already processed" });
        }

        // Update payment with sid
        await Payment.findOneAndUpdate(
            { orderId: payment.orderId },
            { sifaloSid: sid || payment.sifaloSid }
        );

        // Check if payment was successful
        const isSuccess = status === "success" || status === "completed" || status === "paid";

        if (isSuccess) {
            // Find user from deviceId
            const device = await Device.findOne({ deviceId: payment.deviceId }).lean() as any;

            if (device) {
                const userId = device.userId || device._id;
                const plan = payment.plan as "match" | "weekly" | "monthly" | "yearly";
                const durationDays = PLAN_DURATIONS[plan] || 30;
                const maxDevices = PLAN_DEVICES[plan] || 1;

                // Create subscription
                const subscription = await Subscription.create({
                    userId,
                    plan,
                    durationDays,
                    maxDevices,
                    status: "active",
                    expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
                    createdAt: Date.now(),
                });

                // Update payment record
                await Payment.findOneAndUpdate(
                    { orderId: payment.orderId },
                    {
                        status: "success",
                        sifaloSid: sid || payment.sifaloSid,
                        paymentType: payment_type || body.payment_type || "unknown",
                        userId,
                        subscriptionId: subscription._id,
                        completedAt: Date.now(),
                    }
                );

                console.log(`Webhook: Payment ${payment.orderId} verified, subscription created for user ${userId}`);
            } else {
                // No device found, still mark payment as success
                await Payment.findOneAndUpdate(
                    { orderId: payment.orderId },
                    {
                        status: "success",
                        sifaloSid: sid || payment.sifaloSid,
                        paymentType: payment_type || body.payment_type || "unknown",
                        completedAt: Date.now(),
                    }
                );
                console.log(`Webhook: Payment ${payment.orderId} marked as success but no device found for deviceId ${payment.deviceId}`);
            }
        } else if (status === "failed" || status === "declined" || status === "cancelled") {
            await Payment.findOneAndUpdate(
                { orderId: payment.orderId },
                {
                    status: "failed",
                    sifaloSid: sid || payment.sifaloSid,
                    failedAt: Date.now(),
                }
            );
            console.log(`Webhook: Payment ${payment.orderId} marked as failed`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
