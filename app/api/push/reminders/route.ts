import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { MatchReminder, Match } from "@/lib/models";

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        // Get pending reminders (not yet notified, with matches starting soon)
        const now = Date.now();
        const reminderWindow = 30 * 60 * 1000; // 30 minutes before match

        const reminders = await MatchReminder.find({
            notified: { $ne: true },
        }).lean() as any[];

        // Enrich with match data
        const pendingReminders: any[] = [];
        for (const reminder of reminders) {
            const match = await Match.findById(reminder.matchId).lean() as any;
            if (match && match.kickoffAt && match.kickoffAt - now <= reminderWindow && match.kickoffAt > now) {
                pendingReminders.push({
                    ...reminder,
                    teamA: match.teamA,
                    teamB: match.teamB,
                    slug: match.slug,
                    reminderId: reminder._id,
                    subscriptionId: reminder.pushSubscriptionId,
                });
            }
        }

        let sent = 0;
        let failed = 0;

        for (const reminder of pendingReminders) {
            try {
                const res = await fetch(`${request.nextUrl.origin}/api/push`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: "Ciyaar ayaa bilaabanaysa!",
                        body: `${reminder.teamA} vs ${reminder.teamB} ayaa bilaabanaysa dhawaan. Daawo hadda!`,
                        url: `/match/${reminder.slug}`,
                        subscriptionId: reminder.subscriptionId,
                    }),
                });

                if (res.ok) {
                    await MatchReminder.findByIdAndUpdate(reminder.reminderId, { notified: true });
                    sent++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error("Failed to send reminder:", reminder.reminderId, error);
                failed++;
            }
        }

        return NextResponse.json({
            success: true,
            remindersProcessed: pendingReminders.length,
            sent,
            failed
        });
    } catch (error: any) {
        console.error("Reminder process error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
