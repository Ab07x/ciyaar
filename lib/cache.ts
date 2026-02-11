/**
 * API Cache Layer
 * Server-side cache layer for reducing database bandwidth
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// In-memory cache for serverless - works within same instance
const cache = new Map<string, CacheEntry<unknown>>();

// Cache TTLs in milliseconds
export const CACHE_TTL = {
    MOVIES_LIST: 5 * 60 * 1000,        // 5 minutes
    MOVIE_DETAIL: 10 * 60 * 1000,      // 10 minutes
    FEATURED: 5 * 60 * 1000,           // 5 minutes
    TOP10: 5 * 60 * 1000,              // 5 minutes
    MATCHES: 2 * 60 * 1000,            // 2 minutes (more dynamic)
    SETTINGS: 15 * 60 * 1000,          // 15 minutes
    CATEGORIES: 30 * 60 * 1000,        // 30 minutes
    SERIES: 10 * 60 * 1000,            // 10 minutes
} as const;

/**
 * Get cached data or fetch from source
 */
export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
): Promise<T> {
    const now = Date.now();
    const cached = cache.get(key) as CacheEntry<T> | undefined;

    // Return cached data if still valid
    if (cached && now - cached.timestamp < cached.ttl) {
        return cached.data;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    cache.set(key, {
        data,
        timestamp: now,
        ttl: ttlMs,
    });

    return data;
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
    cache.delete(key);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
    };
}
