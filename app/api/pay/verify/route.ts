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

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { sid, orderId, deviceId } = body;

        if (!deviceId) {
            return NextResponse.json(
                { error: "deviceId is required" },
                { status: 400 }
            );
        }

        if (!sid && !orderId) {
            return NextResponse.json(
                { error: "sid or orderId is required" },
                { status: 400 }
            );
        }

        // Look up payment record
        let payment: any = null;
        if (orderId) {
            payment = await Payment.findOne({ orderId }).lean();
        }

        if (!payment && sid) {
            payment = await Payment.findOne({ sifaloSid: sid }).lean();
        }

        if (!payment) {
            return NextResponse.json(
                { error: "Payment record not found" },
                { status: 404 }
            );
        }

        // Already verified
        if (payment.status === "success") {
            return NextResponse.json({
                success: true,
                message: "Payment already verified",
                plan: payment.plan,
            });
        }

        // If we don't have a sid, we can't verify yet
        const verifySid = sid || payment.sifaloSid;
        if (!verifySid) {
            return NextResponse.json({
                success: false,
                message: "No transaction ID to verify",
                status: "pending",
            });
        }

        // Call Sifalo Pay Verify API
        const username = process.env.SIFALO_PAY_USERNAME;
        const password = process.env.SIFALO_PAY_PASSWORD;

        if (!username || !password) {
            return NextResponse.json(
                { error: "Payment system not configured" },
                { status: 500 }
            );
        }

        const authToken = Buffer.from(`${username}:${password}`).toString("base64");

        const verifyRes = await fetch("https://api.sifalopay.com/gateway/verify.php", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sid: verifySid }),
        });

        if (!verifyRes.ok) {
            const errText = await verifyRes.text();
            console.error("Sifalo verify error:", verifyRes.status, errText);
            return NextResponse.json(
                { error: "Verification failed" },
                { status: 502 }
            );
        }

        const verifyData = await verifyRes.json();
        console.log("Sifalo verify response:", verifyData);

        // Check payment status
        if (verifyData.status === "success" && verifyData.code === 601) {
            // Payment successful! Activate subscription.

            // 1. Resolve user from deviceId
            const device = await Device.findOne({ deviceId }).lean() as any;

            if (!device) {
                return NextResponse.json(
                    { error: "Device not found, please contact support" },
                    { status: 404 }
                );
            }

            const userId = device.userId || device._id;
            const plan = payment.plan as "match" | "weekly" | "monthly" | "yearly";
            const baseDurationDays = PLAN_DURATIONS[plan] || 30;
            const bonusDays = Math.max(0, Number(payment.bonusDays) || 0);
            const durationDays = baseDurationDays + bonusDays;
            const maxDevices = PLAN_DEVICES[plan] || 1;

            // 2. Create subscription
            const subscription = await Subscription.create({
                userId,
                plan,
                durationDays,
                maxDevices,
                status: "active",
                activatedAt: Date.now(),
                expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
                createdAt: Date.now(),
            });

            // 3. Update payment record
            await Payment.findOneAndUpdate(
                { orderId: payment.orderId },
                {
                    status: "success",
                    sifaloSid: verifySid,
                    paymentType: verifyData.payment_type || "unknown",
                    userId,
                    subscriptionId: subscription._id,
                    completedAt: Date.now(),
                }
            );

            return NextResponse.json({
                success: true,
                message: "Payment verified and subscription activated!",
                plan,
                expiresIn: `${durationDays} days`,
            });
        } else if (verifyData.status === "pending") {
            return NextResponse.json({
                success: false,
                message: "Payment is still pending",
                status: "pending",
            });
        } else {
            // Payment failed
            await Payment.findOneAndUpdate(
                { orderId: payment.orderId },
                {
                    status: "failed",
                    sifaloSid: verifySid,
                    failedAt: Date.now(),
                }
            );

            return NextResponse.json({
                success: false,
                message: "Payment failed or was declined",
                status: "failed",
            });
        }
    } catch (error: any) {
        console.error("Verify error:", error);
        return NextResponse.json(
            { error: error.message || "Verification failed" },
            { status: 500 }
        );
    }
}
