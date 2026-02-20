import { NextRequest } from "next/server";
import { getGeoMultiplier } from "./geo-pricing";

// In-memory cache: IP → { country, ts }
const cache = new Map<string, { country: string; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getClientIP(req: NextRequest): string {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    return "unknown";
}

export async function lookupCountry(ip: string): Promise<string | null> {
    const cached = cache.get(ip);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.country;
    }

    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.status === "success" && data.countryCode) {
            cache.set(ip, { country: data.countryCode, ts: Date.now() });
            if (cache.size > 10000) {
                const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts).slice(0, 5000);
                for (const [key] of oldest) cache.delete(key);
            }
            return data.countryCode;
        }
    } catch {
        // Silently fail — default pricing
    }
    return null;
}

/** Get the geo multiplier for the request's IP. Returns { country, multiplier }. */
export async function getRequestGeo(req: NextRequest): Promise<{ country: string | null; multiplier: number }> {
    const ip = getClientIP(req);
    const country = await lookupCountry(ip);
    const multiplier = getGeoMultiplier(country);
    return { country, multiplier };
}
