/**
 * Cron endpoint: send renewal reminder emails for subscriptions expiring soon.
 *
 * Schedule via cron-job.org or Vercel Cron — run once per day.
 * Header required: Authorization: Bearer <CRON_SECRET>
 *
 * Sends at these milestones:
 *   - 5 days before expiry
 *   - 1 day before expiry
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Subscription, User, ConversionEvent } from "@/lib/models";
import { sendEmail, buildRenewalReminderEmail } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

interface LeanSub {
    _id: unknown;
    userId?: string;
    plan?: string;
    expiresAt?: number;
}

interface LeanUser {
    email?: string;
}

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization") ?? "";
    if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    let sent = 0;
    let skipped = 0;

    // Check both 5-day and 1-day windows
    for (const daysLeft of [5, 1]) {
        const windowStart = now + (daysLeft - 1) * DAY;
        const windowEnd   = now + daysLeft * DAY;

        const expiringSubs = await Subscription.find({
            status: "active",
            expiresAt: { $gte: windowStart, $lte: windowEnd },
        })
            .select("_id userId plan expiresAt")
            .lean<LeanSub[]>();

        for (const sub of expiringSubs) {
            if (!sub.userId) { skipped++; continue; }

            const eventKey = `renewal_reminder_${daysLeft}d`;

            // Skip if we already sent this reminder for this subscription
            const alreadySent = await ConversionEvent.exists({
                eventName: eventKey,
                "metadata.subId": String(sub._id),
            });
            if (alreadySent) { skipped++; continue; }

            const user = await User.findById(sub.userId)
                .select("email")
                .lean<LeanUser | null>();
            if (!user?.email) { skipped++; continue; }

            const plan = sub.plan ?? "monthly";
            const { subject, html } = buildRenewalReminderEmail(plan, daysLeft);
            const result = await sendEmail({ to: user.email, subject, html });

            if (result.success) {
                sent++;
                await ConversionEvent.create({
                    eventName: eventKey,
                    userId: sub.userId,
                    pageType: "email",
                    plan,
                    source: "cron_renewal_reminders",
                    metadata: { subId: String(sub._id), daysLeft, email: user.email },
                    date: new Date().toISOString().slice(0, 10),
                    createdAt: now,
                });
            } else {
                skipped++;
            }
        }
    }

    return NextResponse.json({ success: true, sent, skipped });
}
