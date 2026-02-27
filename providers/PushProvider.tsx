"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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

/** Race a promise against a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        ),
    ]);
}

export function PushProvider({ children }: { children: React.ReactNode }) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useUser();
    const initRef = useRef(false);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        const checkSupport = async () => {
            if (typeof window === "undefined") return;

            const supported =
                "Notification" in window &&
                "serviceWorker" in navigator &&
                "PushManager" in window;

            setIsSupported(supported);

            if (supported) {
                const wasSubscribed = localStorage.getItem("fanbroj_push_subscribed") === "true";
                const wasUnsubscribed = localStorage.getItem("fanbroj_push_unsubscribed");
                if (wasSubscribed && !wasUnsubscribed) {
                    setIsSubscribed(true);
                }

                if (Notification.permission === "granted") {
                    try {
                        const token = await withTimeout(initializeFirebase(), 15000, "Firebase init");
                        if (token) {
                            setFcmToken(token);
                            setIsSubscribed(true);
                        }
                    } catch (err) {
                        console.warn("[Push] Background init failed:", err);
                    }
                }
            }
            setIsLoading(false);
        };

        const timer = setTimeout(checkSupport, 1500);
        return () => clearTimeout(timer);
    }, []);

    const initializeFirebase = async (): Promise<string | null> => {
        try {
            // Register or get existing service worker
            let registration: ServiceWorkerRegistration;
            try {
                // Look up by scope "/" (where the SW lives)
                const existing = await navigator.serviceWorker.getRegistration("/");
                if (existing?.active?.scriptURL?.includes("firebase-messaging-sw.js")) {
                    registration = existing;
                    existing.update().catch(() => { });
                } else {
                    registration = await withTimeout(
                        navigator.serviceWorker.register("/firebase-messaging-sw.js"),
                        10000,
                        "SW register"
                    );
                }
            } catch (swError) {
                console.error("[Push] Service worker registration failed:", swError);
                return null;
            }

            // Wait for SW to be ready
            await withTimeout(navigator.serviceWorker.ready, 10000, "SW ready");

            // Dynamic import Firebase SDK
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

            // Get FCM token with timeout (this is where it usually hangs)
            const token = await withTimeout(
                getToken(messaging, {
                    vapidKey: "BJD2T_koPJSUI8rUgD12066OE1KRmVjcBUcIKeHR3N2deAiVCeHe-_0q5qwY3V6BQOFCxJk-6phhjEA1Lex8ss4",
                    serviceWorkerRegistration: registration,
                }),
                15000,
                "FCM getToken"
            );

            if (token) {
                setFcmToken(token);
                setIsSubscribed(true);
                localStorage.setItem("fanbroj_push_subscribed", "true");
                localStorage.removeItem("fanbroj_push_unsubscribed");

                // Listen for foreground messages
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
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("[Push] Firebase initialization error:", msg);
            return null;
        }
    };

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        try {
            // Step 1: Request permission — this shows the browser Allow/Block bar
            // No timeout here — user needs time to decide
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                return false;
            }

            // Step 2: Initialize Firebase and get token (with overall timeout)
            const token = await withTimeout(initializeFirebase(), 20000, "Subscribe Firebase");
            if (!token) {
                return false;
            }

            // Step 3: Save token to backend
            const deviceId = getDeviceId();
            fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    deviceId,
                    userId: userId || undefined,
                    userAgent: navigator.userAgent,
                }),
            }).catch(() => { });

            setIsSubscribed(true);
            setFcmToken(token);
            localStorage.setItem("fanbroj_push_subscribed", "true");
            localStorage.removeItem("fanbroj_push_unsubscribed");

            return true;
        } catch (error) {
            console.error("[Push] Subscribe error:", error);
            return false;
        }
    }, [isSupported, userId]);

    const unsubscribe = useCallback(async () => {
        try {
            const deviceId = getDeviceId();

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
