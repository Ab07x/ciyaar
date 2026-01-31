"use client";

import { useEffect, useState } from "react";
import { useMobileDetection } from "./useMobileDetection";

interface PerformanceMetrics {
    connectionSpeed: 'slow' | 'fast' | 'unknown';
    deviceMemory: number | null;
    hardwareConcurrency: number;
    isLowEndDevice: boolean;
    batteryLevel: number | null;
    isCharging: boolean | null;
    enableAnimations: boolean;
    enableAutoplay: boolean;
    preferredImageQuality: 'low' | 'medium' | 'high';
}

/**
 * Hook to detect device performance capabilities and adjust features accordingly
 *
 * @returns Performance metrics and recommendations
 */
export function useMobilePerformance(): PerformanceMetrics {
    const mobileInfo = useMobileDetection();
    const connectionType = mobileInfo.connectionType as 'slow' | 'fast' | 'unknown';
    const isMobile = mobileInfo.isMobile;
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [isCharging, setIsCharging] = useState<boolean | null>(null);

    // Get device memory (if available)
    const deviceMemory = typeof navigator !== 'undefined' && 'deviceMemory' in navigator
        ? (navigator as any).deviceMemory
        : null;

    // Get hardware concurrency (CPU cores)
    const hardwareConcurrency = typeof navigator !== 'undefined'
        ? navigator.hardwareConcurrency || 2
        : 2;

    // Check if connection is slow
    const isSlowConnection = connectionType === 'slow';
    const isFastConnection = connectionType === 'fast';

    // Determine if it's a low-end device
    const isLowEndDevice = (
        deviceMemory !== null && deviceMemory < 4 ||
        hardwareConcurrency < 4 ||
        isSlowConnection
    );

    // Battery API
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('getBattery' in navigator)) return;

        (navigator as any).getBattery().then((battery: any) => {
            const updateBattery = () => {
                setBatteryLevel(battery.level);
                setIsCharging(battery.charging);
            };

            updateBattery();

            battery.addEventListener('levelchange', updateBattery);
            battery.addEventListener('chargingchange', updateBattery);

            return () => {
                battery.removeEventListener('levelchange', updateBattery);
                battery.removeEventListener('chargingchange', updateBattery);
            };
        }).catch(() => {
            // Battery API not supported
        });
    }, []);

    // Performance recommendations
    const enableAnimations = !isLowEndDevice && !isSlowConnection;
    const enableAutoplay = isFastConnection && (isCharging || batteryLevel === null || batteryLevel > 0.2);

    let preferredImageQuality: 'low' | 'medium' | 'high' = 'high';
    if (isLowEndDevice || isSlowConnection) {
        preferredImageQuality = 'low';
    } else if (connectionType === 'unknown' && isMobile) {
        preferredImageQuality = 'medium';
    }

    return {
        connectionSpeed: connectionType,
        deviceMemory,
        hardwareConcurrency,
        isLowEndDevice,
        batteryLevel,
        isCharging,
        enableAnimations,
        enableAutoplay,
        preferredImageQuality
    };
}
