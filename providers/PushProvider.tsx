"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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

    useEffect(() => {
        const checkSupport = async () => {
            if (typeof window === "undefined") return;

            const supported =
                "Notification" in window &&
                "serviceWorker" in navigator &&
                "PushManager" in window;

            setIsSupported(supported);

            if (supported) {
                if (Notification.permission === "granted") {
                    await initializeFirebase();
                }
            }
            setIsLoading(false);
        };

        const timer = setTimeout(() => {
            checkSupport();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const initializeFirebase = async (): Promise<string | null> => {
        try {
            let registration: ServiceWorkerRegistration;
            try {
                const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
                if (existing) {
                    registration = existing;
                    existing.update().catch(() => { });
                } else {
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                }
            } catch (swError) {
                console.error("[Push] Service worker registration failed:", swError);
                return null;
            }

            const swReady = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error("Service worker ready timeout")), 10000)
                )
            ]);

            if (!swReady) return null;

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

            let token: string | null = null;
            const maxAttempts = 3;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    token = await getToken(messaging, {
                        vapidKey: "BJD2T_koPJSUI8rUgD12066OE1KRmVjcBUcIKeHR3N2deAiVCeHe-_0q5qwY3V6BQOFCxJk-6phhjEA1Lex8ss4",
                        serviceWorkerRegistration: registration,
                    });
                    if (token) break;
                } catch (tokenErr: any) {
                    if (attempt < maxAttempts - 1) {
                        await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
                    }
                }
            }

            if (token) {
                setFcmToken(token);
                setIsSubscribed(true);

                if (typeof window !== "undefined") {
                    localStorage.setItem("fanbroj_push_subscribed", "true");
                    localStorage.removeItem("fanbroj_push_unsubscribed");
                }

                const { onMessage } = await import("firebase/messaging");
                onMessage(messaging, (payload) => {
                    if (payload.notification) {
                        new Notification(payload.notification.title || "Fanbroj", {
                            body: payload.notification.body,
                            icon: "/icon-192.png",
                        });
                    }
                });

                return token;
            }

            return null;
        } catch (error: any) {
            console.error("[Push] Firebase initialization error:", error?.message || error);
            return null;
        }
    };

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        try {
            setIsLoading(true);

            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setIsLoading(false);
                return false;
            }

            const token = await initializeFirebase();
            if (!token) {
                setIsLoading(false);
                return false;
            }

            // Save token via API
            const deviceId = getDeviceId();
            await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    deviceId,
                    userId: userId || undefined,
                    userAgent: navigator.userAgent,
                }),
            });

            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("Subscribe error:", error);
            setIsLoading(false);
            return false;
        }
    }, [isSupported, userId]);

    const unsubscribe = useCallback(async () => {
        try {
            const deviceId = getDeviceId();

            // Remove token via API
            if (fcmToken || deviceId) {
                await fetch("/api/push", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deviceId }),
                });
            }

            setIsSubscribed(false);
            setFcmToken(null);

            if (typeof window !== "undefined") {
                localStorage.removeItem("fanbroj_push_subscribed");
                localStorage.removeItem("notificationPromptState");
                localStorage.setItem("fanbroj_push_unsubscribed", Date.now().toString());
            }

            try {
                const { getApps } = await import("firebase/app");
                if (getApps().length > 0) {
                    const { getMessaging, deleteToken } = await import("firebase/messaging");
                    const app = getApps()[0];
                    const messaging = getMessaging(app);
                    await deleteToken(messaging);
                }
            } catch (firebaseErr) {
                console.warn("Could not delete FCM token:", firebaseErr);
            }
        } catch (error) {
            console.error("Unsubscribe error:", error);
            setIsSubscribed(false);
            setFcmToken(null);
        }
    }, [fcmToken]);

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

function getDeviceId(): string {
    if (typeof window === "undefined") return "";

    let deviceId = localStorage.getItem("fanbroj_device_id");
    if (!deviceId) {
        deviceId = "device_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem("fanbroj_device_id", deviceId);
    }
    return deviceId;
}
