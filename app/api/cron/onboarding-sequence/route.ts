/**
 * Cron endpoint: send onboarding sequence emails.
 *
 * Schedule via cron-job.org or Vercel Cron — run once per day.
 * Header required: Authorization: Bearer <CRON_SECRET>
 *
 * Sends at these milestones after subscription creation:
 *   - Day 3: Tips & features they may have missed
 *   - Day 7: New arrivals + share prompt
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Subscription, User, ConversionEvent } from "@/lib/models";
import {
    sendEmail,
    buildOnboardingDay3Email,
    buildOnboardingDay7Email,
} from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

interface LeanSub {
    _id: unknown;
    userId?: string;
    plan?: string;
    createdAt?: number;
}

interface LeanUser {
    email?: string;
}

type SequenceStep = {
    dayOffset: number;
    eventName: string;
    build: () => { subject: string; html: string };
};

const SEQUENCE: SequenceStep[] = [
    { dayOffset: 3, eventName: "onboarding_day3", build: buildOnboardingDay3Email },
    { dayOffset: 7, eventName: "onboarding_day7", build: buildOnboardingDay7Email },
];

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization") ?? "";
    if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const WINDOW = 12 * 60 * 60 * 1000; // ±12 hour window around each milestone
    let sent = 0;
    let skipped = 0;

    for (const step of SEQUENCE) {
        const milestoneMs = step.dayOffset * DAY;
        // Subscriptions created between (dayOffset - 0.5) and (dayOffset + 0.5) days ago
        const windowStart = now - milestoneMs - WINDOW;
        const windowEnd   = now - milestoneMs + WINDOW;

        const subs = await Subscription.find({
            status: "active",
            createdAt: { $gte: windowStart, $lte: windowEnd },
        })
            .select("_id userId plan createdAt")
            .lean<LeanSub[]>();

        for (const sub of subs) {
            if (!sub.userId) { skipped++; continue; }

            // Skip if already sent
            const alreadySent = await ConversionEvent.exists({
                eventName: step.eventName,
                "metadata.subId": String(sub._id),
            });
            if (alreadySent) { skipped++; continue; }

            const user = await User.findById(sub.userId)
                .select("email")
                .lean<LeanUser | null>();
            if (!user?.email) { skipped++; continue; }

            const { subject, html } = step.build();
            const result = await sendEmail({ to: user.email, subject, html });

            if (result.success) {
                sent++;
                await ConversionEvent.create({
                    eventName: step.eventName,
                    userId: sub.userId,
                    pageType: "email",
                    plan: sub.plan ?? "monthly",
                    source: "cron_onboarding_sequence",
                    metadata: {
                        subId: String(sub._id),
                        dayOffset: step.dayOffset,
                        email: user.email,
                    },
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
