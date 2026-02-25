import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import { Payment, Device, Subscription, ConversionEvent, Redemption } from "@/lib/models";
import { getOrCreateAutoPaymentRedemption } from "@/lib/auto-redemption";

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
const PENDING_STATUSES = new Set(["pending", "processing", "in_progress", "awaiting", "waiting"]);

type PaymentRecord = {
    orderId: string;
    status: string;
    plan: "match" | "weekly" | "monthly" | "yearly";
    bonusDays?: number;
    sifaloSid?: string;
    gateway?: string;
    stripeSessionId?: string;
    accessCode?: string;
    accessCodeId?: string;
    subscriptionId?: string;
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

function readString(value: unknown): string | undefined {
    const str = String(value || "").trim();
    return str || undefined;
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

function isSuccessfulVerification(payload: Record<string, unknown>): boolean {
    const statuses = extractStatusCandidates(payload);
    if (statuses.some((s) => SUCCESS_STATUSES.has(s))) {
        return true;
    }

    const data = asRecord(payload.data);
    const codeRaw = payload.code ?? data.code ?? payload.resultCode;
    const codeNum = Number(codeRaw);
    return Number.isFinite(codeNum) && codeNum === 601;
}

function isPendingVerification(payload: Record<string, unknown>): boolean {
    const statuses = extractStatusCandidates(payload);
    return statuses.some((s) => PENDING_STATUSES.has(s));
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { sid, orderId, stripeSession, deviceId } = body;

        if (!deviceId) {
            return NextResponse.json(
                { error: "deviceId is required" },
                { status: 400 }
            );
        }

        // Direct Stripe session from external payment domain (fanproj.shop)
        if (stripeSession && !sid && !orderId) {
            if (!process.env.STRIPE_SECRET_KEY) {
                return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
            }
            const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
            const session = await stripeClient.checkout.sessions.retrieve(stripeSession);

            if (session.status === "complete" || session.payment_status === "paid") {
                const planFromMeta = (session.metadata?.plan || "monthly") as "match" | "weekly" | "monthly" | "yearly";
                const deviceIdFromMeta = session.metadata?.deviceId || deviceId;
                const extOrderId = `STRIPE-EXT-${stripeSession}`;

                // Idempotent: check if already activated
                const existing = await Payment.findOne({ orderId: extOrderId }).lean<PaymentRecord | null>();
                if (existing?.status === "success") {
                    return NextResponse.json({ success: true, message: "Payment already verified", plan: existing.plan, code: existing.accessCode || null });
                }

                const device = await Device.findOne({ deviceId: deviceIdFromMeta }).lean<DeviceRecord | null>();
                if (!device) {
                    return NextResponse.json({ error: "Device not found, please contact support" }, { status: 404 });
                }

                const userId = device.userId || device._id;
                const plan = planFromMeta;
                const durationDays = PLAN_DURATIONS[plan] || 30;
                const maxDevices = PLAN_DEVICES[plan] || 1;

                const access = await getOrCreateAutoPaymentRedemption({ paymentOrderId: extOrderId, userId: String(userId), plan, durationDays, maxDevices });

                const subscription = await Subscription.create({ userId, plan, durationDays, maxDevices, status: "active", activatedAt: Date.now(), expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000, codeId: access.redemptionId, createdAt: Date.now() });

                await Payment.findOneAndUpdate(
                    { orderId: extOrderId },
                    { $setOnInsert: { deviceId: deviceIdFromMeta, plan, amount: 0, currency: "USD", orderId: extOrderId, gateway: "stripe_ext", stripeSessionId: stripeSession, status: "success", bonusDays: 0, accessCode: access.code, accessCodeId: access.redemptionId, subscriptionId: subscription._id, userId, completedAt: Date.now(), createdAt: Date.now() } },
                    { upsert: true }
                );

                return NextResponse.json({ success: true, message: "Payment verified and subscription activated!", plan, expiresIn: `${durationDays} days`, code: access.code });
            } else if (session.status === "open" || session.payment_status === "unpaid") {
                return NextResponse.json({ success: false, message: "Payment is still pending", status: "pending" });
            } else {
                return NextResponse.json({ success: false, message: "Payment session expired or failed", status: "failed" });
            }
        }

        if (!sid && !orderId) {
            return NextResponse.json(
                { error: "sid or orderId is required" },
                { status: 400 }
            );
        }

        // Look up payment record
        let payment: PaymentRecord | null = null;
        if (orderId) {
            payment = await Payment.findOne({ orderId }).lean<PaymentRecord | null>();
        }

        if (!payment && sid) {
            payment = await Payment.findOne({ sifaloSid: sid }).lean<PaymentRecord | null>();
        }

        if (!payment) {
            return NextResponse.json(
                { error: "Payment record not found" },
                { status: 404 }
            );
        }

        // Already verified
        if (payment.status === "success") {
            let resolvedCode = payment.accessCode || null;
            if (!resolvedCode) {
                const linkedCode = await Redemption.findOne({ paymentOrderId: payment.orderId })
                    .select("code")
                    .lean<{ code?: string } | null>();
                resolvedCode = linkedCode?.code || null;
            }

            if (!resolvedCode) {
                const existingDevice = await Device.findOne({ deviceId }).lean<DeviceRecord | null>();
                if (existingDevice?.userId) {
                    const plan = payment.plan as "match" | "weekly" | "monthly" | "yearly";
                    const baseDurationDays = PLAN_DURATIONS[plan] || 30;
                    const bonusDays = Math.max(0, Number(payment.bonusDays) || 0);
                    const durationDays = baseDurationDays + bonusDays;
                    const maxDevices = PLAN_DEVICES[plan] || 1;
                    const access = await getOrCreateAutoPaymentRedemption({
                        paymentOrderId: payment.orderId,
                        userId: String(existingDevice.userId),
                        plan,
                        durationDays,
                        maxDevices,
                    });
                    resolvedCode = access.code;
                    await Payment.findOneAndUpdate(
                        { orderId: payment.orderId },
                        {
                            accessCode: access.code,
                            accessCodeId: access.redemptionId,
                        }
                    );
                }
            }

            return NextResponse.json({
                success: true,
                message: "Payment already verified",
                plan: payment.plan,
                code: resolvedCode,
            });
        }

        // PayPal manual payment — just report pending until admin approves
        if (payment.gateway === "paypal") {
            return NextResponse.json({
                success: false,
                message: "PayPal lacag-bixintaada waa la helay! Kooxdeenu waxay xaqiijin doontaa 30–40 daqiiqo gudahood — kadibna Premium si toos ah ayuu kuu furmaa.",
                status: "pending",
                manual: true,
            });
        }

        // M-Pesa manual payment — just report pending until admin approves
        if (payment.gateway === "mpesa") {
            return NextResponse.json({
                success: false,
                message: "M-Pesa lacag-bixintaada waa la helay! Kooxdeenu waxay xaqiijin doontaa 30–40 daqiiqo gudahood — kadibna Premium si toos ah ayuu kuu furmaa.",
                status: "pending",
                manual: true,
            });
        }

        // Stripe payment verification
        if (payment.gateway === "stripe" && payment.stripeSessionId) {
            if (!process.env.STRIPE_SECRET_KEY) {
                return NextResponse.json(
                    { error: "Stripe not configured" },
                    { status: 500 }
                );
            }

            const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);

            const session = await stripeClient.checkout.sessions.retrieve(payment.stripeSessionId);

            await Payment.findOneAndUpdate(
                { orderId: payment.orderId },
                {
                    lastCheckedAt: Date.now(),
                    verifyAttempts: Number(payment.verifyAttempts || 0) + 1,
                    lastGatewayStatus: session.payment_status || "",
                }
            );

            if (session.payment_status === "paid") {
                // Payment successful — activate subscription
                const device = await Device.findOne({ deviceId }).lean<DeviceRecord | null>();

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

                const access = await getOrCreateAutoPaymentRedemption({
                    paymentOrderId: payment.orderId,
                    userId: String(userId),
                    plan,
                    durationDays,
                    maxDevices,
                });

                const subscription = await Subscription.create({
                    userId,
                    plan,
                    durationDays,
                    maxDevices,
                    status: "active",
                    activatedAt: Date.now(),
                    expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
                    codeId: access.redemptionId,
                    createdAt: Date.now(),
                });

                await Payment.findOneAndUpdate(
                    { orderId: payment.orderId },
                    {
                        status: "success",
                        stripePaymentIntentId: typeof session.payment_intent === "string"
                            ? session.payment_intent
                            : "",
                        paymentType: "stripe_card",
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
                        deviceId,
                        pageType: "payment",
                        plan,
                        source: "stripe_verify_api",
                        metadata: {
                            orderId: payment.orderId,
                            stripeSessionId: payment.stripeSessionId,
                            bonusDays,
                            durationDays,
                        },
                        date: new Date().toISOString().slice(0, 10),
                        createdAt: Date.now(),
                    });
                } catch (eventError) {
                    console.error("Stripe verify conversion event write failed:", eventError);
                }

                return NextResponse.json({
                    success: true,
                    message: "Payment verified and subscription activated!",
                    plan,
                    expiresIn: `${durationDays} days`,
                    code: access.code,
                });
            } else if (session.payment_status === "unpaid") {
                return NextResponse.json({
                    success: false,
                    message: "Payment is still pending",
                    status: "pending",
                });
            } else {
                return NextResponse.json({
                    success: false,
                    message: "Payment session expired or failed",
                    status: "failed",
                });
            }
        }

        // If we don't have a sid, we can't verify yet (Sifalo payments)
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

        const verifyData = (await verifyRes.json()) as Record<string, unknown>;
        console.log("Sifalo verify response:", verifyData);

        const statusCandidates = extractStatusCandidates(verifyData);
        await Payment.findOneAndUpdate(
            { orderId: payment.orderId },
            {
                lastCheckedAt: Date.now(),
                verifyAttempts: Number(payment.verifyAttempts || 0) + 1,
                lastGatewayStatus: statusCandidates[0] || "",
                lastGatewayCode: String(verifyData.code ?? asRecord(verifyData.data).code ?? ""),
                lastGatewayMessage: readString(verifyData.message) || readString(asRecord(verifyData.data).message) || "",
                lastGatewayPayload: verifyData,
            }
        );

        // Check payment status
        if (isSuccessfulVerification(verifyData)) {
            // Payment successful! Activate subscription.

            // 1. Resolve user from deviceId
            const device = await Device.findOne({ deviceId }).lean<DeviceRecord | null>();

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
            const access = await getOrCreateAutoPaymentRedemption({
                paymentOrderId: payment.orderId,
                userId: String(userId),
                plan,
                durationDays,
                maxDevices,
            });

            // 2. Create subscription
            const subscription = await Subscription.create({
                userId,
                plan,
                durationDays,
                maxDevices,
                status: "active",
                activatedAt: Date.now(),
                expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
                codeId: access.redemptionId,
                createdAt: Date.now(),
            });

            // 3. Update payment record
            await Payment.findOneAndUpdate(
                { orderId: payment.orderId },
                {
                    status: "success",
                    sifaloSid: verifySid,
                    paymentType: readString(verifyData.payment_type) || readString(asRecord(verifyData.data).payment_type) || "unknown",
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
                    deviceId,
                    pageType: "payment",
                    plan,
                    source: "verify_api",
                    metadata: {
                        orderId: payment.orderId,
                        sid: verifySid,
                        bonusDays,
                        durationDays,
                    },
                    date: new Date().toISOString().slice(0, 10),
                    createdAt: Date.now(),
                });
            } catch (eventError) {
                console.error("Verify conversion event write failed:", eventError);
            }

            return NextResponse.json({
                success: true,
                message: "Payment verified and subscription activated!",
                plan,
                expiresIn: `${durationDays} days`,
                code: access.code,
            });
        } else if (isPendingVerification(verifyData)) {
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
                    failureReason: readString(verifyData.message) || readString(asRecord(verifyData.data).message) || "Payment declined",
                }
            );

            try {
                await ConversionEvent.create({
                    eventName: "purchase_failed",
                    deviceId,
                    pageType: "payment",
                    plan: payment.plan,
                    source: "verify_api",
                    metadata: {
                        orderId: payment.orderId,
                        sid: verifySid,
                        verifyStatus: verifyData.status,
                        verifyCode: verifyData.code,
                    },
                    date: new Date().toISOString().slice(0, 10),
                    createdAt: Date.now(),
                });
            } catch (eventError) {
                console.error("Verify failure conversion event write failed:", eventError);
            }

            return NextResponse.json({
                success: false,
                message: "Payment failed or was declined",
                status: "failed",
            });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Verification failed";
        console.error("Verify error:", error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
