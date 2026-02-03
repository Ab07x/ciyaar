// Firebase Admin SDK (Server-Side Only)
import admin from "firebase-admin";

// Initialize Firebase Admin with service account
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    // Check for required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || "fanproj-push";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@fanproj-push.iam.gserviceaccount.com";
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!privateKey) {
        console.error("FIREBASE_PRIVATE_KEY is not set!");
        throw new Error("Firebase Admin SDK: FIREBASE_PRIVATE_KEY environment variable is required");
    }

    const serviceAccount = {
        type: "service_account",
        project_id: projectId,
        private_key: privateKey,
        client_email: clientEmail,
    };

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: projectId,
    });
}

// Get Firebase Admin Messaging instance
export function getAdminMessaging() {
    initializeFirebaseAdmin();
    return admin.messaging();
}

// Send notification to a single FCM token
export async function sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string
) {
    const messaging = getAdminMessaging();

    // Only include imageUrl if it's a valid URL
    const hasImage = imageUrl && imageUrl.length > 0 && imageUrl.startsWith('http');

    const message: admin.messaging.Message = {
        token,
        notification: {
            title,
            body,
            ...(hasImage && { imageUrl }),
        },
        webpush: {
            notification: {
                title,
                body,
                icon: "/icon-192.png",
                badge: "/badge-72.png",
                ...(hasImage && { image: imageUrl }),
                requireInteraction: true,
            },
            fcmOptions: {
                link: data?.url || "/",
            },
        },
        data: data || {},
    };

    try {
        const response = await messaging.send(message);
        console.log("Successfully sent notification:", response);
        return { success: true, messageId: response };
    } catch (error: any) {
        console.error("Error sending notification:", error);
        return { success: false, error: error.message };
    }
}

// Send notification to multiple FCM tokens
export async function sendMulticastNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string
) {
    if (tokens.length === 0) {
        return { success: true, sent: 0, failed: 0 };
    }

    const messaging = getAdminMessaging();

    // Only include imageUrl if it's a valid URL
    const hasImage = imageUrl && imageUrl.length > 0 && imageUrl.startsWith('http');

    const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
            title,
            body,
            ...(hasImage && { imageUrl }),
        },
        webpush: {
            notification: {
                title,
                body,
                icon: "/icon-192.png",
                badge: "/badge-72.png",
                ...(hasImage && { image: imageUrl }),
                requireInteraction: true,
            },
            fcmOptions: {
                link: data?.url || "/",
            },
        },
        data: data || {},
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`Multicast sent: ${response.successCount} success, ${response.failureCount} failed`);

        // Collect ONLY tokens that are permanently invalid (not temporary failures)
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
                const errorCode = resp.error.code;
                // Only mark as invalid for permanent errors
                // messaging/registration-token-not-registered = token is no longer valid
                // messaging/invalid-registration-token = token format is wrong
                if (
                    errorCode === "messaging/registration-token-not-registered" ||
                    errorCode === "messaging/invalid-registration-token" ||
                    errorCode === "messaging/invalid-argument"
                ) {
                    failedTokens.push(tokens[idx]);
                    console.error(`Token ${idx} permanently invalid:`, errorCode);
                } else {
                    // Temporary error - don't mark as invalid
                    console.warn(`Token ${idx} temporary failure:`, resp.error?.message);
                }
            }
        });

        return {
            success: true,
            sent: response.successCount,
            failed: response.failureCount,
            failedTokens,
        };
    } catch (error: any) {
        console.error("Error sending multicast notification:", error);
        return { success: false, sent: 0, failed: tokens.length, error: error.message };
    }
}

// Send to a topic (e.g., "all", "premium", "news")
export async function sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string
) {
    const messaging = getAdminMessaging();

    const message: admin.messaging.Message = {
        topic,
        notification: {
            title,
            body,
            imageUrl,
        },
        webpush: {
            notification: {
                title,
                body,
                icon: "/icon-192.png",
                badge: "/badge-72.png",
                image: imageUrl,
            },
            fcmOptions: {
                link: data?.url || "/",
            },
        },
        data: data || {},
    };

    try {
        const response = await messaging.send(message);
        console.log("Successfully sent to topic:", response);
        return { success: true, messageId: response };
    } catch (error: any) {
        console.error("Error sending to topic:", error);
        return { success: false, error: error.message };
    }
}

// Subscribe tokens to a topic
export async function subscribeToTopic(tokens: string[], topic: string) {
    const messaging = getAdminMessaging();
    try {
        const response = await messaging.subscribeToTopic(tokens, topic);
        console.log(`Subscribed ${response.successCount} tokens to topic ${topic}`);
        return { success: true, count: response.successCount };
    } catch (error: any) {
        console.error("Error subscribing to topic:", error);
        return { success: false, error: error.message };
    }
}

// Unsubscribe tokens from a topic
export async function unsubscribeFromTopic(tokens: string[], topic: string) {
    const messaging = getAdminMessaging();
    try {
        const response = await messaging.unsubscribeFromTopic(tokens, topic);
        console.log(`Unsubscribed ${response.successCount} tokens from topic ${topic}`);
        return { success: true, count: response.successCount };
    } catch (error: any) {
        console.error("Error unsubscribing from topic:", error);
        return { success: false, error: error.message };
    }
}
