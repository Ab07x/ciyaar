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
            // Register service worker - use existing if available
            let registration: ServiceWorkerRegistration;
            const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            if (existing) {
                registration = existing;
                // Ensure it's up to date
                existing.update().catch(() => { });
            } else {
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            }

            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;

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
            const messaging = getMessaging(app);

            // Get FCM token with retry
            let token: string | null = null;
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    token = await getToken(messaging, {
                        vapidKey: "BJD2T_koPJSUI8rUgD12066OE1KRmVjcBUcIKeHR3N2deAiVCeHe-_0q5qwY3V6BQOFCxJk-6phhjEA1Lex8ss4",
                        serviceWorkerRegistration: registration,
                    });
                    if (token) break;
                } catch (tokenErr) {
                    console.warn(`FCM token attempt ${attempt + 1} failed:`, tokenErr);
                    if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (token) {
                console.log("FCM Token obtained:", token.substring(0, 20) + "...");
                setFcmToken(token);
                setIsSubscribed(true);

                // Listen for foreground messages
                const { onMessage } = await import("firebase/messaging");
                onMessage(messaging, (payload) => {
                    console.log("Foreground message:", payload);
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

            console.error("Failed to get FCM token after retries");
            return null;
        } catch (error) {
            console.error("Firebase initialization error:", error);
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
        if (!fcmToken) return;

        try {
            const deviceId = getDeviceId();
            await removeFcmToken({ deviceId });
            setIsSubscribed(false);
            setFcmToken(null);
            console.log("Unsubscribed from push notifications");
        } catch (error) {
            console.error("Unsubscribe error:", error);
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
