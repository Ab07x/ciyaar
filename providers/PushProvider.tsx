"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "./UserProvider";
import { getDeviceId } from "@/lib/device";

interface PushContextType {
    isSupported: boolean;
    isSubscribed: boolean;
    pushSubscription: PushSubscription | null;
    permission: NotificationPermission;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<void>;
}

const PushContext = createContext<PushContextType | null>(null);

export function PushProvider({ children }: { children: React.ReactNode }) {
    const { userId } = useUser();
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [deviceId, setDeviceId] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            // Use the same device ID as the rest of the app
            setDeviceId(getDeviceId());
        }
    }, []);

    const saveSubscription = useMutation(api.push.saveSubscription);
    const unsubscribeMutation = useMutation(api.push.unsubscribe);

    // Check if push is supported
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    // Register service worker
    useEffect(() => {
        if (!isSupported) return;

        navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
                console.log("Service Worker registered:", registration);
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    }, [isSupported]);

    // Check existing subscription
    useEffect(() => {
        if (!isSupported) return;

        navigator.serviceWorker.ready.then((registration) => {
            registration.pushManager.getSubscription().then((subscription) => {
                setIsSubscribed(!!subscription);
                setPushSubscription(subscription);
            });
        });
    }, [isSupported]);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            console.error("Push notifications not supported");
            return false;
        }

        try {
            // Request permission
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== "granted") {
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ) as any,
            });
            setPushSubscription(subscription);

            // Save subscription to backend
            const subscriptionJSON = subscription.toJSON();
            console.log("Saving subscription to Convex:", {
                endpoint: subscription.endpoint,
                userId: userId ?? "anonymous"
            });

            await saveSubscription({
                userId: userId ?? undefined,
                deviceId,
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscriptionJSON.keys!.p256dh!,
                    auth: subscriptionJSON.keys!.auth!,
                },
                userAgent: navigator.userAgent,
            });

            setIsSubscribed(true);
            console.log("Subscription saved successfully");
            return true;
        } catch (error) {
            console.error("Failed to subscribe to push:", error);
            // alert("Push subscription failed: " + (error instanceof Error ? error.message : String(error)));
            return false;
        }
    }, [isSupported, userId, deviceId, saveSubscription]);

    const unsubscribe = useCallback(async () => {
        if (!isSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                await unsubscribeMutation({ endpoint: subscription.endpoint });
                setIsSubscribed(false);
                setPushSubscription(null);
            }
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
        }
    }, [isSupported, unsubscribeMutation]);

    return (
        <PushContext.Provider
            value={{
                isSupported,
                isSubscribed,
                pushSubscription,
                permission,
                subscribe,
                unsubscribe,
            }}
        >
            {children}
        </PushContext.Provider>
    );
}

export function usePush() {
    const context = useContext(PushContext);
    if (!context) {
        throw new Error("usePush must be used within PushProvider");
    }
    return context;
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
