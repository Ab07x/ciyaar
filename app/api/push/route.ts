import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendMulticastNotification, sendNotification } from "@/lib/firebase-admin";

// CORS headers for direct server access
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// Handle CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            body: message,
            icon,
            image,
            url,
            broadcast,
            fcmToken,
        } = body;

        console.log("Push Request:", {
            title,
            message,
            broadcast,
            hasFcmToken: !!fcmToken,
        });

        if (!title || !message) {
            return NextResponse.json(
                { error: "Title and body are required" },
                { status: 400, headers: corsHeaders }
            );
        }

        const data = {
            url: url || "/",
        };

        const notificationIcon = icon || "/icon-192.png";

        // Send to single FCM token (for testing)
        if (fcmToken) {
            const result = await sendNotification(
                fcmToken,
                title,
                message,
                data,
                image,
                notificationIcon
            );

            if (result.success) {
                return NextResponse.json({ success: true, sent: 1 }, { headers: corsHeaders });
            } else {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500, headers: corsHeaders }
                );
            }
        }

        // Broadcast to all FCM subscribers
        if (broadcast) {
            console.log("Fetching FCM tokens from Convex...");
            console.log("CONVEX URL:", process.env.NEXT_PUBLIC_CONVEX_URL);

            const subscriptions = await fetchQuery(api.push.getAllFcmTokens);
            console.log(`Got ${subscriptions?.length || 0} subscriptions:`, JSON.stringify(subscriptions, null, 2));

            if (!subscriptions || subscriptions.length === 0) {
                return NextResponse.json({
                    success: true,
                    sent: 0,
                    failed: 0,
                    total: 0,
                    message: "No active subscribers found"
                }, { headers: corsHeaders });
            }

            const tokens = subscriptions.map((s: any) => s.token);

            const result = await sendMulticastNotification(
                tokens,
                title,
                message,
                data,
                image,
                notificationIcon
            );

            // Mark failed tokens as inactive
            if (result.failedTokens && result.failedTokens.length > 0) {
                for (const token of result.failedTokens) {
                    await fetchMutation(api.push.markFcmTokenInvalid, { token });
                }
            }

            console.log(`Broadcast complete. Sent: ${result.sent}, Failed: ${result.failed}`);
            return NextResponse.json({
                success: true,
                sent: result.sent,
                failed: result.failed,
                total: subscriptions.length,
            }, { headers: corsHeaders });
        }

        return NextResponse.json(
            { error: "Specify fcmToken or set broadcast: true" },
            { status: 400, headers: corsHeaders }
        );
    } catch (error: any) {
        console.error("Push notification error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send notification" },
            { status: 500, headers: corsHeaders }
        );
    }
}
