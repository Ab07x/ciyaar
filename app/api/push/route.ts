import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Configure web-push with VAPID keys - Wrap in a check for build environments
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@fanbroj.net",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, body: message, icon, image, url, subscriptionId, broadcast, directSubscription } = body;

        console.log("Push Request:", { title, message, hasSubscriptionId: !!subscriptionId, broadcast, directSubscription: !!directSubscription });

        if (!title || !message) {
            return NextResponse.json(
                { error: "Title and body are required" },
                { status: 400 }
            );
        }

        const payload = JSON.stringify({
            title,
            body: message,
            icon: icon || "/icon-192.png",
            image: image || null,
            badge: "/badge-72.png",
            url: url || "/",
        });

        // Test Direct Subscription (Bypasses Admin DB Lookup)
        if (directSubscription) {
            const sub = directSubscription;
            if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
                return NextResponse.json({ error: "Invalid direct subscription object" }, { status: 400 });
            }

            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.keys.p256dh,
                            auth: sub.keys.auth,
                        },
                    },
                    payload
                );
                return NextResponse.json({ success: true, sent: 1, message: "Direct test notification sent" });
            } catch (error: any) {
                console.error("Direct push failed:", error);
                return NextResponse.json({ error: "Direct push failed: " + error.message, details: error }, { status: 500 });
            }
        }

        // Single subscription send via ID
        if (subscriptionId) {
            const subscription = await fetchQuery(api.push.getSubscriptionById, {
                id: subscriptionId,
            });

            if (!subscription || !subscription.isActive) {
                return NextResponse.json(
                    { error: "Subscription not found or inactive" },
                    { status: 404 }
                );
            }

            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.keys.p256dh,
                            auth: subscription.keys.auth,
                        },
                    },
                    payload
                );

                return NextResponse.json({ success: true, sent: 1 });
            } catch (error: any) {
                console.error("Single push failed:", error);
                // If subscription is invalid (410 Gone), mark as inactive
                if (error.statusCode === 410) {
                    await fetchMutation(api.push.markInactive, {
                        id: subscriptionId,
                    });
                }
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }
        }

        // Broadcast to all subscribers
        if (broadcast) {
            const subscriptions = await fetchQuery(api.push.getAllSubscriptions);
            console.log(`Broadcasting to ${subscriptions.length} subscribers...`);

            let sent = 0;
            let failed = 0;

            for (const sub of subscriptions) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.keys.p256dh,
                                auth: sub.keys.auth,
                            },
                        },
                        payload
                    );
                    sent++;
                } catch (error: any) {
                    console.error("Push failed for subscription:", sub._id, error.message);
                    failed++;

                    // Mark invalid subscriptions as inactive
                    if (error.statusCode === 410) {
                        await fetchMutation(api.push.markInactive, { id: sub._id });
                    }
                }
            }

            console.log(`Broadcast complete. Sent: ${sent}, Failed: ${failed}`);
            return NextResponse.json({
                success: true,
                sent,
                failed,
                total: subscriptions.length,
            });
        }

        return NextResponse.json(
            { error: "Specify subscriptionId, directSubscription, or set broadcast: true" },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("Push notification error:", error);

        // Handle missing VAPID keys specifically
        if (error.message?.includes("publicKey") || error.message?.includes("privateKey")) {
            return NextResponse.json(
                { error: "VAPID keys are missing. Please configure them in Vercel environment variables." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to send notification" },
            { status: 500 }
        );
    }
}
