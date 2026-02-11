"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import useSWR from "swr";
import { getDeviceId, getUserAgent } from "@/lib/device";

interface UserContextType {
    deviceId: string;
    userId: string | null;
    isLoading: boolean;
    isPremium: boolean;
    subscription: any;
    checkMatchAccess: (matchId: string) => boolean;
    redeemCode: (code: string, matchId?: string) => Promise<any>;
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

    // Fetch subscription status (only when userId is set)
    const { data: subData } = useSWR(
        userId ? `/api/subscriptions?userId=${userId}` : null,
        (url: string) => fetch(url).then((r) => r.json()),
        { refreshInterval: 30000 } // Check every 30s
    );

    const subscription = subData?.subscription || null;
    const isPremium = subData?.active ?? false;

    const checkMatchAccess = (matchId: string) => {
        if (!userId) return false;
        if (isPremium) return true;
        return false;
    };

    const redeemCode = async (code: string, matchId?: string) => {
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
        } catch (error) {
            return { success: false, error: "Network error" };
        }
    };

    const logout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("fanbroj_device_id");
            localStorage.removeItem("fanbroj_subscription");
            setDeviceId("");
            setUserId(null);
            window.location.href = "/";
        }
    };

    return (
        <UserContext.Provider
            value={{
                deviceId,
                userId,
                isLoading: !isInitialized || (userId !== null && subData === undefined),
                isPremium,
                subscription,
                checkMatchAccess,
                redeemCode,
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
