import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(request: NextRequest) {
    try {
        const pendingReminders = await fetchQuery(api.reminders.getPendingReminders);

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
                    await fetchMutation(api.reminders.markNotified, { id: reminder.reminderId });
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
