import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import { Payment, Device, Subscription, ConversionEvent } from "@/lib/models";
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
    plan: "match" | "weekly" | "monthly" | "yearly";
    bonusDays?: number;
    deviceId: string;
    stripeSessionId?: string;
    accessCode?: string;
    accessCodeId?: string;
    verifyAttempts?: number;
};

type DeviceRecord = {
    _id?: string;
    userId?: string;
};

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const sig = request.headers.get("stripe-signature");

        if (!sig || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: "Missing signature or webhook secret" },
                { status: 400 }
            );
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("Stripe webhook signature verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        await connectDB();

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const { orderId, plan, deviceId, bonusDays: bonusDaysStr } = session.metadata || {};

            if (!orderId || !plan || !deviceId) {
                console.error("Stripe webhook: missing metadata", session.metadata);
                return NextResponse.json({ received: true });
            }

            // Find payment record
            const payment = await Payment.findOne({ orderId }).lean<PaymentRecord | null>();
            if (!payment) {
                console.error("Stripe webhook: Payment not found for orderId", orderId);
                return NextResponse.json({ received: true });
            }

            // Already processed (idempotent)
            if (payment.status === "success") {
                return NextResponse.json({ received: true, message: "Already processed" });
            }

            const bonusDays = Math.max(0, Number(bonusDaysStr) || 0);
            const validPlan = plan as "match" | "weekly" | "monthly" | "yearly";
            const baseDurationDays = PLAN_DURATIONS[validPlan] || 30;
            const durationDays = baseDurationDays + bonusDays;
            const maxDevices = PLAN_DEVICES[validPlan] || 1;

            // Find user from deviceId
            const device = await Device.findOne({ deviceId }).lean<DeviceRecord | null>();

            if (device) {
                const userId = device.userId || device._id;

                const access = await getOrCreateAutoPaymentRedemption({
                    paymentOrderId: orderId,
                    userId: String(userId),
                    plan: validPlan,
                    durationDays,
                    maxDevices,
                });

                // Create subscription
                const subscription = await Subscription.create({
                    userId,
                    plan: validPlan,
                    durationDays,
                    maxDevices,
                    status: "active",
                    codeId: access.redemptionId,
                    expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
                    createdAt: Date.now(),
                });

                // Update payment record
                await Payment.findOneAndUpdate(
                    { orderId },
                    {
                        status: "success",
                        stripeSessionId: session.id,
                        stripePaymentIntentId: typeof session.payment_intent === "string"
                            ? session.payment_intent
                            : session.payment_intent?.id || "",
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
                        plan: validPlan,
                        source: "stripe_webhook",
                        metadata: {
                            orderId,
                            stripeSessionId: session.id,
                            durationDays,
                            bonusDays,
                        },
                        date: new Date().toISOString().slice(0, 10),
                        createdAt: Date.now(),
                    });
                } catch (eventError) {
                    console.error("Stripe webhook conversion event write failed:", eventError);
                }

                console.log(`Stripe webhook: Payment ${orderId} verified, subscription created for user ${userId}`);
            } else {
                // No device found, still mark payment as success
                await Payment.findOneAndUpdate(
                    { orderId },
                    {
                        status: "success",
                        stripeSessionId: session.id,
                        stripePaymentIntentId: typeof session.payment_intent === "string"
                            ? session.payment_intent
                            : session.payment_intent?.id || "",
                        paymentType: "stripe_card",
                        completedAt: Date.now(),
                    }
                );

                try {
                    await ConversionEvent.create({
                        eventName: "purchase_completed",
                        deviceId,
                        pageType: "payment",
                        plan: validPlan,
                        source: "stripe_webhook_no_device",
                        metadata: { orderId, stripeSessionId: session.id },
                        date: new Date().toISOString().slice(0, 10),
                        createdAt: Date.now(),
                    });
                } catch (eventError) {
                    console.error("Stripe webhook conversion event write failed:", eventError);
                }

                console.log(`Stripe webhook: Payment ${orderId} marked as success but no device found for deviceId ${deviceId}`);
            }

            return NextResponse.json({ received: true, status: "success" });
        }

        if (event.type === "checkout.session.expired") {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.metadata?.orderId;

            if (orderId) {
                await Payment.findOneAndUpdate(
                    { orderId },
                    {
                        status: "failed",
                        failedAt: Date.now(),
                        failureReason: "Stripe checkout session expired",
                    }
                );
                console.log(`Stripe webhook: Payment ${orderId} marked as failed (session expired)`);
            }

            return NextResponse.json({ received: true, status: "expired" });
        }

        // Unhandled event type
        return NextResponse.json({ received: true });
    } catch (error: unknown) {
        console.error("Stripe webhook error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
