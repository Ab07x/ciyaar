// Firebase Client-Side Configuration
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBkVkGdm-nP9LfNMzlFyDd9CxHWsdogfP0",
    authDomain: "fanproj-push.firebaseapp.com",
    projectId: "fanproj-push",
    storageBucket: "fanproj-push.firebasestorage.app",
    messagingSenderId: "1061582318142",
    appId: "1:1061582318142:web:aaf8d78697ec9b465fbf6f",
    measurementId: "G-1FM2LLEFNX"
};

// Initialize Firebase App (client-side only)
let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;

export function getFirebaseApp() {
    if (typeof window === "undefined") return null;

    if (!app && getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else if (!app) {
        app = getApps()[0];
    }
    return app;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
    if (typeof window === "undefined") return null;

    const supported = await isSupported();
    if (!supported) {
        console.warn("Firebase Messaging is not supported in this browser");
        return null;
    }

    if (!messaging) {
        const app = getFirebaseApp();
        if (app) {
            messaging = getMessaging(app);
        }
    }
    return messaging;
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
    try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return null;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.log("Notification permission denied");
            return null;
        }

        // Get FCM token
        const token = await getToken(messaging, {
            vapidKey: "BJD2T_koPJSUI8rUgD12066OE1KRmVjcBUcIKeHR3N2deAiVCeHe-_0q5qwY3V6BQOFCxJk-6phhjEA1Lex8ss4"
        });

        console.log("FCM Token:", token);
        return token;
    } catch (error) {
        console.error("Error getting FCM token:", error);
        return null;
    }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
    if (typeof window === "undefined") return null;

    getFirebaseMessaging().then((messaging) => {
        if (messaging) {
            onMessage(messaging, (payload) => {
                console.log("Foreground message received:", payload);
                callback(payload);
            });
        }
    });

    return () => {
        // Cleanup if needed
    };
}
