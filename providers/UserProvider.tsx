"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import useSWR from "swr";
import { getDeviceId, getUserAgent } from "@/lib/device";

type GenericResponse = { success?: boolean; error?: string; [key: string]: unknown };
type UserProfile = { username?: string; displayName?: string; [key: string]: unknown };
type UserSubscription = Record<string, unknown>;
type LocalStoredSubscription = { plan?: string; expiresAt?: number; activatedAt?: number };

const LOCAL_SUBSCRIPTION_KEY = "fanbroj_subscription";

function readLocalSubscription(): LocalStoredSubscription | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(LOCAL_SUBSCRIPTION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as LocalStoredSubscription;
    } catch {
        return null;
    }
}

interface UserContextType {
    deviceId: string;
    userId: string | null;
    username: string | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isPremium: boolean;
    subscription: UserSubscription | null;
    checkMatchAccess: (matchId: string) => boolean;
    redeemCode: (code: string, matchId?: string) => Promise<GenericResponse>;
    updateUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
    const [deviceId, setDeviceId] = useState<string>("");
    const [userId, setUserId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize user on mount
    useEffect(() => {
        const initUser = async () => {
            const id = getDeviceId();
            setDeviceId(id);

            try {
                const res = await fetch("/api/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        deviceId: id,
                        userAgent: getUserAgent(),
                    }),
                });
                const data = await res.json();
                if (data?.user?._id) {
                    setUserId(data.user._id);
                }
            } catch (error) {
                console.error("Failed to init user:", error);
            }
            setIsInitialized(true);
        };

        initUser();
    }, []);

    // Clean up stale local premium cache on first load.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const localSub = readLocalSubscription();
        const localExpiresAt = Number(localSub?.expiresAt || 0);
        if (localExpiresAt > 0 && localExpiresAt <= Date.now()) {
            window.localStorage.removeItem(LOCAL_SUBSCRIPTION_KEY);
        }
    }, []);

    // Fetch subscription status bound to the current device.
    const { data: subData } = useSWR(
        deviceId ? `/api/subscriptions?deviceId=${encodeURIComponent(deviceId)}` : null,
        (url: string) => fetch(url).then((r) => r.json()),
        { refreshInterval: 30000 } // Check every 30s
    );
    const {
        data: profileData,
        mutate: mutateProfile,
    } = useSWR(
        userId ? `/api/users?userId=${userId}` : null,
        (url: string) => fetch(url).then((r) => r.json())
    );

    const subscription = (subData?.subscription || null) as UserSubscription | null;
    const isPremium = subData?.active ?? false;
    const username = (profileData?.username || profileData?.displayName || null) as string | null;

    // Persist premium login/session state until expiry, and drop to login when session is no longer valid.
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (subData === undefined) return;

        const sub = subData?.subscription as { plan?: string; expiresAt?: number; createdAt?: number } | null;
        const expiresAt = Number(sub?.expiresAt || 0);
        const activeNow = Boolean(subData?.active) && expiresAt > Date.now();

        if (activeNow && sub) {
            window.localStorage.setItem(
                LOCAL_SUBSCRIPTION_KEY,
                JSON.stringify({
                    plan: sub.plan || "premium",
                    expiresAt,
                    activatedAt: Number(sub.createdAt || Date.now()),
                })
            );
            return;
        }

        const hadStoredSub = Boolean(window.localStorage.getItem(LOCAL_SUBSCRIPTION_KEY));
        if (hadStoredSub) {
            window.localStorage.removeItem(LOCAL_SUBSCRIPTION_KEY);
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
    }, [subData]);

    const checkMatchAccess = (_matchId: string) => {
        void _matchId;
        if (!userId) return false;
        if (isPremium) return true;
        return false;
    };

    const redeemCode = async (code: string, _matchId?: string): Promise<GenericResponse> => {
        void _matchId;
        if (!deviceId) return { success: false, error: "Device not initialized" };

        try {
            const res = await fetch("/api/redemptions/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, deviceId }),
            });
            const result = await res.json();

            if (result.success) {
                // Re-init user to refresh subscription
                const userRes = await fetch("/api/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        deviceId,
                        userAgent: getUserAgent(),
                    }),
                });
                const userData = await userRes.json();
                if (userData?.user?._id) {
                    setUserId(userData.user._id);
                }
            }

            return result;
        } catch {
            return { success: false, error: "Network error" };
        }
    };

    const updateUsername = async (nextUsername: string) => {
        if (!userId) return { success: false, error: "User not found" };

        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: userId,
                    username: nextUsername,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data?.error || "Failed to update username" };
            }

            mutateProfile(data, false);
            return { success: true };
        } catch {
            return { success: false, error: "Network error" };
        }
    };

    const logout = () => {
        if (typeof window !== "undefined") {
            // Keep device id so user can always recover/login on this same device.
            localStorage.removeItem(LOCAL_SUBSCRIPTION_KEY);
            setUserId(null);
            window.location.href = "/login";
        }
    };

    return (
        <UserContext.Provider
            value={{
                deviceId,
                userId,
                username,
                profile: profileData || null,
                isLoading: !isInitialized || (deviceId !== "" && subData === undefined),
                isPremium,
                subscription,
                checkMatchAccess,
                redeemCode,
                updateUsername,
                logout,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within UserProvider");
    }
    return context;
}
