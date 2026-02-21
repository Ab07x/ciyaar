import { NextRequest } from "next/server";
import { getGeoMultiplier } from "./geo-pricing";

// In-memory cache: IP → { country, ts }
const cache = new Map<string, { country: string; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (was 24h — shorter to pick up geo changes)

export function getClientIP(req: NextRequest): string {
    // Priority order: most trustworthy first
    const candidates = [
        req.headers.get("cf-connecting-ip"),          // Cloudflare
        req.headers.get("x-real-ip"),                  // Nginx
        req.headers.get("x-forwarded-for"),            // Standard proxy (may be comma-list)
        req.headers.get("x-client-ip"),
        req.headers.get("true-client-ip"),             // Akamai / Cloudflare Enterprise
        req.headers.get("fastly-client-ip"),
        req.headers.get("x-cluster-client-ip"),
    ];

    for (const candidate of candidates) {
        if (!candidate) continue;
        // x-forwarded-for can be "client, proxy1, proxy2" — take the first
        const ip = candidate.split(",")[0].trim();
        if (ip && ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") {
            return ip;
        }
    }

    return "unknown";
}

async function lookupViaIpApi(ip: string): Promise<string | null> {
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return null;
        const data = await res.json() as { status?: string; countryCode?: string };
        if (data.status === "success" && data.countryCode) return data.countryCode;
    } catch {
        // timeout or network error — fall through to backup
    }
    return null;
}

async function lookupViaIpinfo(ip: string): Promise<string | null> {
    try {
        const res = await fetch(`https://ipinfo.io/${ip}/country`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return null;
        const code = (await res.text()).trim().toUpperCase();
        if (code && code.length === 2 && /^[A-Z]{2}$/.test(code)) return code;
    } catch {
        // silent fallback
    }
    return null;
}

export async function lookupCountry(ip: string): Promise<string | null> {
    if (!ip || ip === "unknown") return null;

    const cached = cache.get(ip);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.country;
    }

    // Try primary service
    let country = await lookupViaIpApi(ip);

    // Fallback to ipinfo.io if primary fails
    if (!country) {
        country = await lookupViaIpinfo(ip);
    }

    if (country) {
        cache.set(ip, { country, ts: Date.now() });
        // Prevent unbounded growth
        if (cache.size > 10000) {
            const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts).slice(0, 5000);
            for (const [key] of oldest) cache.delete(key);
        }
    }

    return country;
}

/** Get the geo multiplier for the request's IP. Returns { country, multiplier }. */
export async function getRequestGeo(req: NextRequest): Promise<{ country: string | null; multiplier: number }> {
    const ip = getClientIP(req);
    const country = await lookupCountry(ip);
    const multiplier = getGeoMultiplier(country);
    return { country, multiplier };
}
