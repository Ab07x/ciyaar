/**
 * Computes a deterministic "boosted" view count based on the item's ID.
 * This ensures public users see a large, stable number that grows with real engagement,
 * while the admin dashboard can still track accurate analytics.
 */
export function getBoostedViews(id: string, realViews: number = 0): number {
    if (!id) return realViews;

    // Simple deterministic hash from string ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    // Range: 10,000 to 20,000
    const boostBase = 10000 + (Math.abs(hash) % 10001);

    return (realViews || 0) + boostBase;
}

/**
 * Formats a number into a human-readable compact string (e.g., 10.5K, 1.2M)
 */
export function formatViews(views: number): string {
    return new Intl.NumberFormat("en-US", { notation: "compact" }).format(views);
}
