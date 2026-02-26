import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payment, Device, Subscription, ConversionEvent, User } from "@/lib/models";
import { getOrCreateAutoPaymentRedemption } from "@/lib/auto-redemption";
import { sendEmail, buildWelcomeEmail } from "@/lib/email";

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

const SUCCESS_STATUSES = new Set(["success", "successful", "completed", "complete", "paid", "approved"]);
const FAILED_STATUSES = new Set(["failed", "declined", "cancelled", "canceled", "error"]);

type PaymentRecord = {
    orderId: string;
    status: string;
    plan: "match" | "weekly" | "monthly" | "yearly";
    bonusDays?: number;
    deviceId: string;
    sifaloSid?: string;
    accessCode?: string;
    accessCodeId?: string;
    verifyAttempts?: number;
};

type DeviceRecord = {
    _id?: string;
    userId?: string;
};

function normalizeText(input: unknown): string {
    return String(input || "").trim().toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> {
    if (typeof value === "object" && value !== null) {
        return value as Record<string, unknown>;
    }
    return {};
}

function extractStatusCandidates(payload: Record<string, unknown>): string[] {
    const data = asRecord(payload.data);
    const result = asRecord(payload.result);

    return [
        payload.status,
        payload.payment_status,
        payload.paymentStatus,
        payload.state,
        data.status,
        data.payment_status,
        result.status,
    ]
        .map(normalizeText)
        .filter(Boolean);
}

function isSuccessStatus(payload: Record<string, unknown>): boolean {
    const statuses = extractStatusCandidates(payload);
    if (statuses.some((s) => SUCCESS_STATUSES.has(s))) {
        return true;
    }

    const data = asRecord(payload.data);
    const codeRaw = payload.code ?? data.code ?? payload.resultCode;
    const codeNum = Number(codeRaw);
    return Number.isFinite(codeNum) && codeNum === 601;
}

function isFailureStatus(payload: Record<string, unknown>): boolean {
    const statuses = extractStatusCandidates(payload);
    return statuses.some((s) => FAILED_STATUSES.has(s));
}

function firstNonEmpty(...values: unknown[]): string | undefined {
    for (const value of values) {
        const text = String(value || "").trim();
        if (text) return text;
    }
    return undefined;
}

async function processWebhook(request: NextRequest, payload: Record<string, unknown>) {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const sid = firstNonEmpty(
        payload.sid,
        payload.sifalo_sid,
        payload.transaction_id,
        payload.transactionId,
        payload.trx_id,
        searchParams.get("sid")
    );

    const orderId = firstNonEmpty(
        payload.order_id,
        payload.orderId,
        payload.orderID,
        searchParams.get("order_id"),
        searchParams.get("orderId")
    );

    const paymentType = firstNonEmpty(
        payload.payment_type,
        payload.paymentType,
        searchParams.get("payment_type")
    );

    console.log("Sifalo webhook received:", JSON.stringify({ sid, orderId, status: payload.status, payload }));

    if (!sid && !orderId) {
        return NextResponse.json({ error: "Missing sid or order_id" }, { status: 400 });
    }

    // Find payment record
    let payment: PaymentRecord | null = null;
    if (orderId) {
        payment = await Payment.findOne({ orderId }).lean<PaymentRecord | null>();
    }
    if (!payment && sid) {
        payment = await Payment.findOne({ sifaloSid: sid }).lean<PaymentRecord | null>();
    }
    if (!payment && payload.key) {
        payment = await Payment.findOne({ sifaloKey: payload.key }).lean<PaymentRecord | null>();
    }
    if (!payment && payload.token) {
        payment = await Payment.findOne({ sifaloToken: payload.token }).lean<PaymentRecord | null>();
    }

    if (!payment) {
        console.error("Webhook: Payment not found for", { sid, orderId, payloadKeys: Object.keys(payload || {}) });
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Already processed
    if (payment.status === "success") {
        return NextResponse.json({ message: "Already processed" });
    }

    // Update payment with sid if we received one
    if (sid) {
        await Payment.findOneAndUpdate(
            { orderId: payment.orderId },
            { sifaloSid: sid }
        );
    }

    const isSuccess = isSuccessStatus(payload);
    const isFailed = isFailureStatus(payload);
    const statusCandidates = extractStatusCandidates(payload);
    await Payment.findOneAndUpdate(
        { orderId: payment.orderId },
        {
            lastCheckedAt: Date.now(),
            verifyAttempts: Number(payment.verifyAttempts || 0) + 1,
            lastGatewayStatus: statusCandidates[0] || "",
            lastGatewayCode: String(payload.code ?? asRecord(payload.data).code ?? ""),
            lastGatewayMessage: firstNonEmpty(payload.message, asRecord(payload.data).message) || "",
            lastGatewayPayload: payload,
        }
    );

    if (isSuccess) {
        // Find user from deviceId
        const device = await Device.findOne({ deviceId: payment.deviceId }).lean<DeviceRecord | null>();

        if (device) {
            const userId = device.userId || device._id;
            const plan = payment.plan as "match" | "weekly" | "monthly" | "yearly";
            const baseDurationDays = PLAN_DURATIONS[plan] || 30;
            const bonusDays = Math.max(0, Number(payment.bonusDays) || 0);
            const durationDays = baseDurationDays + bonusDays;
            const maxDevices = PLAN_DEVICES[plan] || 1;
            const access = await getOrCreateAutoPaymentRedemption({
                paymentOrderId: payment.orderId,
                userId: String(userId),
                plan,
                durationDays,
                maxDevices,
            });

            // Create subscription
            const subscription = await Subscription.create({
                userId,
                plan,
                durationDays,
                maxDevices,
                status: "active",
                codeId: access.redemptionId,
                expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
                createdAt: Date.now(),
            });

            // Update payment record
            await Payment.findOneAndUpdate(
                { orderId: payment.orderId },
                {
                    status: "success",
                    sifaloSid: sid || payment.sifaloSid,
                    paymentType: paymentType || "unknown",
                    userId,
                    subscriptionId: subscription._id,
                    accessCode: access.code,
                    accessCodeId: access.redemptionId,
                    completedAt: Date.now(),
                    failureReason: "",
                }
            );

            try {
                await ConversionEvent.create({
                    eventName: "purchase_completed",
                    userId: String(userId),
                    deviceId: payment.deviceId,
                    pageType: "payment",
                    plan,
                    source: "webhook",
                    metadata: {
                        orderId: payment.orderId,
                        sid: sid || payment.sifaloSid,
                        paymentType: paymentType || "unknown",
                        durationDays,
                        bonusDays,
                    },
                    date: new Date().toISOString().slice(0, 10),
                    createdAt: Date.now(),
                });
            } catch (eventError) {
                console.error("Webhook conversion event write failed:", eventError);
            }

            // Send welcome email (fire-and-forget)
            try {
                const userDoc = await User.findById(userId).select("email").lean<{ email?: string }>();
                if (userDoc?.email) {
                    const { subject, html } = buildWelcomeEmail(plan, access.code);
                    void sendEmail({ to: userDoc.email, subject, html });
                }
            } catch (emailErr) {
                console.error("Welcome email error (Sifalo webhook):", emailErr);
            }

            console.log(`Webhook: Payment ${payment.orderId} verified, subscription created for user ${userId}`);
        } else {
            // No device found, still mark payment as success
            await Payment.findOneAndUpdate(
                { orderId: payment.orderId },
                {
                    status: "success",
                    sifaloSid: sid || payment.sifaloSid,
                    paymentType: paymentType || "unknown",
                    accessCode: payment.accessCode || "",
                    accessCodeId: payment.accessCodeId || "",
                    completedAt: Date.now(),
                }
            );
            try {
                await ConversionEvent.create({
                    eventName: "purchase_completed",
                    deviceId: payment.deviceId,
                    pageType: "payment",
                    plan: payment.plan,
                    source: "webhook_no_device",
                    metadata: {
                        orderId: payment.orderId,
                        sid: sid || payment.sifaloSid,
                        paymentType: paymentType || "unknown",
                    },
                    date: new Date().toISOString().slice(0, 10),
                    createdAt: Date.now(),
                });
            } catch (eventError) {
                console.error("Webhook conversion event write failed:", eventError);
            }
            console.log(`Webhook: Payment ${payment.orderId} marked as success but no device found for deviceId ${payment.deviceId}`);
        }

        return NextResponse.json({ success: true, status: "success" });
    }

    if (isFailed) {
        await Payment.findOneAndUpdate(
            { orderId: payment.orderId },
            {
                status: "failed",
                sifaloSid: sid || payment.sifaloSid,
                failedAt: Date.now(),
                failureReason: firstNonEmpty(payload.message, asRecord(payload.data).message) || "Payment failed",
            }
        );
        console.log(`Webhook: Payment ${payment.orderId} marked as failed`);
        return NextResponse.json({ success: true, status: "failed" });
    }

    // Unknown status: accept webhook but keep pending.
    return NextResponse.json({ success: true, status: "pending" });
}

// POST /api/pay/webhook — Sifalo Pay callback/webhook
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        return await processWebhook(request, (body || {}) as Record<string, unknown>);
    } catch (error: unknown) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Some gateways call callback URL using GET instead of POST.
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const body = Object.fromEntries(searchParams.entries());
        return await processWebhook(request, body);
    } catch (error: unknown) {
        console.error("Webhook GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
