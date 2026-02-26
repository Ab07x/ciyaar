/**
 * BunnyCDN Image Utility
 * Transforms image URLs to use BunnyCDN for faster delivery
 */

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.fanbroj.net";

/**
 * Transform an image URL to use BunnyCDN
 * BunnyCDN acts as a pull zone, so we just need to route through it
 */
export function getCdnImageUrl(originalUrl: string): string {
    if (!originalUrl) return "";

    // If already using CDN, return as-is
    if (originalUrl.includes("b-cdn.net") || originalUrl.includes("cdn.fanbroj.net")) {
        return originalUrl;
    }

    // If it's a relative URL (starts with /), prepend CDN URL
    if (originalUrl.startsWith("/")) {
        return `${CDN_URL}${originalUrl}`;
    }

    // For TMDB images, we can optionally route through our proxy
    // or use BunnyCDN's image processing
    if (originalUrl.includes("image.tmdb.org")) {
        // Use TMDB directly for now - it's already a CDN
        // You can enable proxy by uncommenting below:
        // return `${CDN_URL}/tmdb${new URL(originalUrl).pathname}`;
        return originalUrl;
    }

    // For other external URLs, return as-is
    return originalUrl;
}

/**
 * Get optimized image URL with BunnyCDN query params
 * BunnyCDN supports on-the-fly image optimization
 */
export function getOptimizedImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: "webp" | "avif" | "auto";
    } = {}
): string {
    const cdnUrl = getCdnImageUrl(url);

    // If not using our CDN, return original
    if (!cdnUrl.includes("b-cdn.net") && !cdnUrl.includes("cdn.fanbroj.net")) {
        return cdnUrl;
    }

    const params = new URLSearchParams();

    if (options.width) {
        params.set("width", options.width.toString());
    }
    if (options.height) {
        params.set("height", options.height.toString());
    }
    if (options.quality) {
        params.set("quality", options.quality.toString());
    }
    if (options.format) {
        params.set("format", options.format);
    }

    const queryString = params.toString();
    return queryString ? `${cdnUrl}?${queryString}` : cdnUrl;
}

/**
 * Preload critical images via CDN
 */
export function preloadImage(url: string): void {
    if (typeof window === "undefined") return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = getCdnImageUrl(url);
    document.head.appendChild(link);
}
