"use client";

import { useEffect, useState } from "react";

interface OfflineStatus {
    isOnline: boolean;
    isOffline: boolean;
    downlink: number | null;
    effectiveType: string | null;
    saveData: boolean;
}

/**
 * Hook to detect online/offline status and connection quality
 *
 * @returns Online status and connection information
 */
export function useOffline(): OfflineStatus {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [downlink, setDownlink] = useState<number | null>(null);
    const [effectiveType, setEffectiveType] = useState<string | null>(null);
    const [saveData, setSaveData] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Network Information API
        const connection = (navigator as any).connection
            || (navigator as any).mozConnection
            || (navigator as any).webkitConnection;

        if (connection) {
            const updateConnectionInfo = () => {
                setDownlink(connection.downlink || null);
                setEffectiveType(connection.effectiveType || null);
                setSaveData(connection.saveData || false);
            };

            updateConnectionInfo();
            connection.addEventListener('change', updateConnectionInfo);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                connection.removeEventListener('change', updateConnectionInfo);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        isOffline: !isOnline,
        downlink,
        effectiveType,
        saveData
    };
}
