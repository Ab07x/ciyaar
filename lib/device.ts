/**
 * Device fingerprinting utility
 * Generates a stable device ID based on browser characteristics
 */

const DEVICE_ID_KEY = "fanbroj_device_id";

function generateFingerprint(): string {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || "unknown",
        navigator.platform,
    ];

    const str = components.join("|");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    // Convert to base36 and add random suffix for uniqueness
    const base = Math.abs(hash).toString(36);
    const random = Math.random().toString(36).substring(2, 8);

    return `${base}-${random}`;
}

export function getDeviceId(): string {
    if (typeof window === "undefined") {
        return "server-render";
    }

    // Check localStorage first
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        deviceId = generateFingerprint();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
}

export function clearDeviceId(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(DEVICE_ID_KEY);
    }
}

export function getUserAgent(): string {
    if (typeof window === "undefined") {
        return "server-render";
    }
    return navigator.userAgent;
}
