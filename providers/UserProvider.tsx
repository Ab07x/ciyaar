"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDeviceId, getUserAgent } from "@/lib/device";
import type { Id } from "@/convex/_generated/dataModel";

interface UserContextType {
    deviceId: string;
    userId: Id<"users"> | null;
    isLoading: boolean;
    isPremium: boolean;
    subscription: any;
    checkMatchAccess: (matchId: Id<"matches">) => boolean;
    redeemCode: (code: string, matchId?: Id<"matches">) => Promise<any>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
    const [deviceId, setDeviceId] = useState<string>("");
    const [userId, setUserId] = useState<Id<"users"> | null>(null);

    const getOrCreateUser = useMutation(api.users.getOrCreateUser);
    const redeemCodeMutation = useMutation(api.redemptions.redeemCode);

    const subscription = useQuery(
        api.subscriptions.getUserSubscription,
        userId ? { userId } : "skip"
    );

    const premiumAccess = useQuery(
        api.subscriptions.checkPremiumAccess,
        userId ? { userId } : "skip"
    );

    useEffect(() => {
        const initUser = async () => {
            const id = getDeviceId();
            setDeviceId(id);

            try {
                const uid = await getOrCreateUser({
                    deviceId: id,
                    userAgent: getUserAgent(),
                });
                setUserId(uid);
            } catch (error) {
                console.error("Failed to init user:", error);
            }
        };

        initUser();
    }, [getOrCreateUser]);

    const checkMatchAccess = (matchId: Id<"matches">) => {
        if (!userId) return false;
        if (premiumAccess?.hasAccess) return true;
        return false;
    };

    const redeemCode = async (code: string, matchId?: Id<"matches">) => {
        if (!deviceId) return { success: false, error: "Device not initialized" };

        return await redeemCodeMutation({
            code,
            deviceId,
            userAgent: getUserAgent(),
            matchId,
        });
    };

    return (
        <UserContext.Provider
            value={{
                deviceId,
                userId,
                isLoading: deviceId === "" || (userId !== null && subscription === undefined),
                isPremium: premiumAccess?.hasAccess ?? false,
                subscription,
                checkMatchAccess,
                redeemCode,
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
