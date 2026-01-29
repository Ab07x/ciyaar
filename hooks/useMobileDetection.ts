"use client";

import { useState, useEffect } from "react";

export interface MobileCapabilities {
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isSafari: boolean;
    isChrome: boolean;
    supportsTouch: boolean;
    isStandalone: boolean; // PWA installed
    hasNotch: boolean;
    screenSize: 'small' | 'medium' | 'large';
    orientation: 'portrait' | 'landscape';
    connectionType: 'slow' | 'fast' | 'unknown';
}

export function useMobileDetection(): MobileCapabilities {
    const [capabilities, setCapabilities] = useState<MobileCapabilities>({
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isSafari: false,
        isChrome: false,
        supportsTouch: false,
        isStandalone: false,
        hasNotch: false,
        screenSize: 'large',
        orientation: 'portrait',
        connectionType: 'unknown'
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        // Detect device type
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        const isAndroid = /Android/i.test(userAgent);

        // Detect browser
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);

        // Touch support
        const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // PWA detection
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        // Notch detection (iPhone X+)
        const hasNotch = isIOS && (
            window.screen.height === 812 || // iPhone X/XS/11 Pro
            window.screen.height === 896 || // iPhone XR/XS Max/11/11 Pro Max
            window.screen.height === 844 || // iPhone 12/12 Pro/13/13 Pro/14
            window.screen.height === 926 || // iPhone 12/13/14 Pro Max
            window.screen.height === 932    // iPhone 14 Pro Max
        );

        // Screen size
        const width = window.innerWidth;
        const screenSize: 'small' | 'medium' | 'large' =
            width < 640 ? 'small' :
            width < 1024 ? 'medium' : 'large';

        // Orientation
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

        // Connection type
        let connectionType: 'slow' | 'fast' | 'unknown' = 'unknown';
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
            const effectiveType = connection.effectiveType;
            connectionType = (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') ? 'slow' : 'fast';
        }

        setCapabilities({
            isMobile,
            isIOS,
            isAndroid,
            isSafari,
            isChrome,
            supportsTouch,
            isStandalone,
            hasNotch,
            screenSize,
            orientation,
            connectionType
        });

        // Listen for orientation changes
        const handleOrientationChange = () => {
            setCapabilities(prev => ({
                ...prev,
                orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
            }));
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', handleOrientationChange);
        };
    }, []);

    return capabilities;
}

// Haptic feedback (iOS only)
export function useHaptic() {
    const { isIOS } = useMobileDetection();

    const vibrate = (pattern: number | number[] = 10) => {
        if (!isIOS && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    const lightImpact = () => vibrate(10);
    const mediumImpact = () => vibrate(20);
    const heavyImpact = () => vibrate(30);

    return {
        vibrate,
        lightImpact,
        mediumImpact,
        heavyImpact
    };
}
