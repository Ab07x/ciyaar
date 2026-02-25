/**
 * Cron endpoint: send recovery emails for abandoned checkouts.
 *
 * Call this via an external cron service (cron-job.org, Vercel Cron, etc.)
 * every hour with the header:  Authorization: Bearer <CRON_SECRET>
 *
 * env vars:
 *   CRON_SECRET       — shared secret to protect this endpoint
 *   RESEND_API_KEY    — Resend API key for email delivery
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payment, Device, User, ConversionEvent } from "@/lib/models";
import { sendEmail, buildCheckoutRecoveryEmail } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

interface LeanPayment {
    _id: unknown;
    orderId?: string;
    plan?: string;
    amount?: number;
    deviceId?: string;
    createdAt?: number;
}

interface LeanDevice {
    userId?: string;
}

interface LeanUser {
    email?: string;
}

export async function GET(req: NextRequest) {
    // Auth check
    const auth = req.headers.get("authorization") ?? "";
    if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = Date.now();
    const minAge = 30 * 60 * 1000;   // 30 minutes ago — must have started
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours ago — not too stale

    // Find pending payments in the 30-min to 24-hour window
    const abandonedPayments = await Payment.find({
        status: "pending",
        gateway: { $in: ["checkout", "stripe"] }, // automated gateways only
        createdAt: { $gte: now - maxAge, $lte: now - minAge },
    })
        .select("_id orderId plan amount deviceId createdAt")
        .lean<LeanPayment[]>();

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const payment of abandonedPayments) {
        const orderId = payment.orderId ?? String(payment._id);

        // Skip if we already sent a recovery email for this order
        const alreadySent = await ConversionEvent.exists({
            eventName: "recovery_email_sent",
            "metadata.orderId": orderId,
        });
        if (alreadySent) { skipped++; continue; }

        // Find user email via deviceId → Device → User
        if (!payment.deviceId) { skipped++; continue; }

        const device = await Device.findOne({ deviceId: payment.deviceId })
            .select("userId")
            .lean<LeanDevice | null>();
        if (!device?.userId) { skipped++; continue; }

        const user = await User.findById(device.userId)
            .select("email")
            .lean<LeanUser | null>();
        if (!user?.email) { skipped++; continue; }

        const plan = payment.plan ?? "monthly";
        const { subject, html } = buildCheckoutRecoveryEmail(plan);

        const result = await sendEmail({ to: user.email, subject, html });
        if (result.success) {
            sent++;
            // Record that we sent the recovery email
            await ConversionEvent.create({
                eventName: "recovery_email_sent",
                deviceId: payment.deviceId,
                pageType: "email",
                plan,
                source: "cron_checkout_recovery",
                metadata: { orderId, email: user.email },
                date: new Date().toISOString().slice(0, 10),
                createdAt: now,
            });
        } else {
            errors.push(`${orderId}: ${result.error}`);
        }
    }

    return NextResponse.json({
        success: true,
        total: abandonedPayments.length,
        sent,
        skipped,
        errors: errors.length ? errors : undefined,
    });
}
