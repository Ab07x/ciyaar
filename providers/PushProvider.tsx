"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "./UserProvider";

interface PushContextType {
    isSupported: boolean;
    isSubscribed: boolean;
    fcmToken: string | null;
    isLoading: boolean;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<void>;
}

const PushContext = createContext<PushContextType>({
    isSupported: false,
    isSubscribed: false,
    fcmToken: null,
    isLoading: true,
    subscribe: async () => false,
    unsubscribe: async () => { },
});

export const usePush = () => useContext(PushContext);

export function PushProvider({ children }: { children: React.ReactNode }) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useUser();

    const saveFcmToken = useMutation(api.push.saveFcmToken);
    const removeFcmToken = useMutation(api.push.removeFcmToken);

    // Check if push is supported
    useEffect(() => {
        const checkSupport = async () => {
            if (typeof window === "undefined") return;

            const supported =
                "Notification" in window &&
                "serviceWorker" in navigator &&
                "PushManager" in window;

            setIsSupported(supported);

            if (supported) {
                // Check existing permission
                if (Notification.permission === "granted") {
                    // Try to get existing token
                    await initializeFirebase();
                }
            }
            setIsLoading(false);
        };

        // Delay initialization to avoid blocking hydration
        const timer = setTimeout(() => {
            checkSupport();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Initialize Firebase and get token
    const initializeFirebase = async (): Promise<string | null> => {
        try {
            console.log("[Push] Starting Firebase initialization...");

            // Register service worker - use existing if available
            let registration: ServiceWorkerRegistration;
            try {
                const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
                if (existing) {
                    registration = existing;
                    console.log("[Push] Using existing service worker");
                    // Ensure it's up to date
                    existing.update().catch(() => { });
                } else {
                    console.log("[Push] Registering new service worker...");
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log("[Push] Service worker registered successfully");
                }
            } catch (swError) {
                console.error("[Push] Service worker registration failed:", swError);
                return null;
            }

            // Wait for the service worker to be ready with timeout
            console.log("[Push] Waiting for service worker to be ready...");
            const swReady = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error("Service worker ready timeout")), 10000)
                )
            ]);

            if (!swReady) {
                console.error("[Push] Service worker not ready after timeout");
                return null;
            }
            console.log("[Push] Service worker is ready");

            // Dynamic import to avoid SSR issues
            const { initializeApp, getApps } = await import("firebase/app");
            const { getMessaging, getToken } = await import("firebase/messaging");

            const firebaseConfig = {
                apiKey: "AIzaSyBkVkGdm-nP9LfNMzlFyDd9CxHWsdogfP0",
                authDomain: "fanproj-push.firebaseapp.com",
                projectId: "fanproj-push",
                storageBucket: "fanproj-push.firebasestorage.app",
                messagingSenderId: "1061582318142",
                appId: "1:1061582318142:web:aaf8d78697ec9b465fbf6f",
                measurementId: "G-1FM2LLEFNX"
            };

            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
            console.log("[Push] Firebase app initialized");

            const messaging = getMessaging(app);
            console.log("[Push] Firebase messaging initialized");

            // Get FCM token with more retries and longer delays
            let token: string | null = null;
            const maxAttempts = 3;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    console.log(`[Push] Attempting to get FCM token (attempt ${attempt + 1}/${maxAttempts})...`);
                    token = await getToken(messaging, {
                        vapidKey: "BJD2T_koPJSUI8rUgD12066OE1KRmVjcBUcIKeHR3N2deAiVCeHe-_0q5qwY3V6BQOFCxJk-6phhjEA1Lex8ss4",
                        serviceWorkerRegistration: registration,
                    });
                    if (token) {
                        console.log("[Push] FCM token obtained successfully!");
                        break;
                    } else {
                        console.warn(`[Push] getToken returned null on attempt ${attempt + 1}`);
                    }
                } catch (tokenErr: any) {
                    console.error(`[Push] FCM token attempt ${attempt + 1} failed:`, tokenErr?.message || tokenErr);
                    if (attempt < maxAttempts - 1) {
                        const delay = (attempt + 1) * 1500; // 1.5s, 3s, 4.5s
                        console.log(`[Push] Retrying in ${delay}ms...`);
                        await new Promise(r => setTimeout(r, delay));
                    }
                }
            }

            if (token) {
                console.log("[Push] FCM Token:", token.substring(0, 30) + "...");
                setFcmToken(token);
                setIsSubscribed(true);

                // Mark as subscribed in localStorage
                if (typeof window !== "undefined") {
                    localStorage.setItem("fanbroj_push_subscribed", "true");
                    localStorage.removeItem("fanbroj_push_unsubscribed");
                }

                // Listen for foreground messages
                const { onMessage } = await import("firebase/messaging");
                onMessage(messaging, (payload) => {
                    console.log("[Push] Foreground message:", payload);
                    // Show notification manually for foreground
                    if (payload.notification) {
                        new Notification(payload.notification.title || "Fanbroj", {
                            body: payload.notification.body,
                            icon: "/icon-192.png",
                        });
                    }
                });

                return token;
            }

            console.error("[Push] Failed to get FCM token after all retries");
            return null;
        } catch (error: any) {
            console.error("[Push] Firebase initialization error:", error?.message || error);
            return null;
        }
    };

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            console.log("Push not supported");
            return false;
        }

        try {
            setIsLoading(true);

            // Request permission
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.log("Notification permission denied");
                setIsLoading(false);
                return false;
            }

            // Get FCM token
            const token = await initializeFirebase();
            if (!token) {
                console.error("Failed to get FCM token");
                setIsLoading(false);
                return false;
            }

            // Save token to Convex
            const deviceId = getDeviceId();
            await saveFcmToken({
                token,
                deviceId,
                userId: userId?.toString() || undefined,
                userAgent: navigator.userAgent,
            });

            console.log("Push subscription saved successfully");
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("Subscribe error:", error);
            setIsLoading(false);
            return false;
        }
    }, [isSupported, saveFcmToken, userId]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        try {
            const deviceId = getDeviceId();

            // Remove token from Convex database
            if (fcmToken || deviceId) {
                await removeFcmToken({ deviceId });
            }

            // Clear local subscription state
            setIsSubscribed(false);
            setFcmToken(null);

            // Clear localStorage flags used by NotificationOptIn
            if (typeof window !== "undefined") {
                localStorage.removeItem("fanbroj_push_subscribed");
                localStorage.removeItem("notificationPromptState");

                // Store unsubscribed timestamp to prevent re-prompting immediately
                localStorage.setItem("fanbroj_push_unsubscribed", Date.now().toString());
            }

            // Try to delete the FCM token from Firebase
            try {
                const { getApps } = await import("firebase/app");
                if (getApps().length > 0) {
                    const { getMessaging, deleteToken } = await import("firebase/messaging");
                    const app = getApps()[0];
                    const messaging = getMessaging(app);
                    await deleteToken(messaging);
                    console.log("FCM token deleted from Firebase");
                }
            } catch (firebaseErr) {
                console.warn("Could not delete FCM token from Firebase:", firebaseErr);
            }

            console.log("Unsubscribed from push notifications successfully");
        } catch (error) {
            console.error("Unsubscribe error:", error);
            // Still clear local state even if server fails
            setIsSubscribed(false);
            setFcmToken(null);
        }
    }, [fcmToken, removeFcmToken]);

    return (
        <PushContext.Provider
            value={{
                isSupported,
                isSubscribed,
                fcmToken,
                isLoading,
                subscribe,
                unsubscribe,
            }}
        >
            {children}
        </PushContext.Provider>
    );
}

// Generate a unique device ID
function getDeviceId(): string {
    if (typeof window === "undefined") return "";

    let deviceId = localStorage.getItem("fanbroj_device_id");
    if (!deviceId) {
        deviceId = "device_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem("fanbroj_device_id", deviceId);
    }
    return deviceId;
}
