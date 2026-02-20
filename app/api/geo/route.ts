import { NextRequest, NextResponse } from "next/server";
import { getGeoMultiplier } from "@/lib/geo-pricing";

// In-memory cache: IP → { country, ts }
const cache = new Map<string, { country: string; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getClientIP(req: NextRequest): string {
    // Try common proxy headers
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    return "unknown";
}

async function lookupCountry(ip: string): Promise<string | null> {
    // Check cache first
    const cached = cache.get(ip);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.country;
    }

    try {
        // ip-api.com free tier (no key needed, 45 req/min)
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.status === "success" && data.countryCode) {
            cache.set(ip, { country: data.countryCode, ts: Date.now() });
            // Prune cache if it gets too large
            if (cache.size > 10000) {
                const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts).slice(0, 5000);
                for (const [key] of oldest) cache.delete(key);
            }
            return data.countryCode;
        }
    } catch {
        // Silently fail — return null (default pricing)
    }
    return null;
}

export async function GET(req: NextRequest) {
    const ip = getClientIP(req);
    const country = await lookupCountry(ip);
    const multiplier = getGeoMultiplier(country);

    return NextResponse.json(
        { country, multiplier },
        {
            headers: {
                "Cache-Control": "private, max-age=3600",
            },
        }
    );
}
