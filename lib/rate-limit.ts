type RateLimitRecord = { count: number; resetAt: number };

const store = new Map<string, RateLimitRecord>();

// Purge stale entries every 10 minutes to prevent memory growth
let cleanupScheduled = false;
function scheduleCleanup() {
    if (cleanupScheduled) return;
    cleanupScheduled = true;
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of store.entries()) {
            if (now > record.resetAt) store.delete(key);
        }
    }, 10 * 60 * 1000);
}
if (typeof globalThis !== "undefined") scheduleCleanup();

/**
 * Check if a key has exceeded the rate limit.
 * @param key       Unique key (e.g. "redeem:1.2.3.4")
 * @param max       Maximum allowed requests in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
    key: string,
    max: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = store.get(key);

    if (!record || now > record.resetAt) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: max - 1, resetAt };
    }

    if (record.count >= max) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return { allowed: true, remaining: max - record.count, resetAt: record.resetAt };
}

/** Extract the real client IP from Next.js request headers. */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
}
