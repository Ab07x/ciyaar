/**
 * Optimize image URLs for faster loading and better SEO.
 * 
 * Handles:
 * - TMDB /original/ → sized versions (w500 for posters, w1280 for backdrops)
 * - BunnyCDN URLs → add width parameter
 * - Null/undefined → returns null
 * 
 * This is a shared utility usable from both server and client components.
 */
export function optimizeImageUrl(url: string | null | undefined, size: "poster" | "backdrop" | "thumb" = "poster"): string | null | undefined {
  if (!url) return url;

  // TMDB original → sized versions
  if (url.includes("image.tmdb.org/t/p/original")) {
    const tmdbSize = size === "backdrop" ? "w1280" : size === "thumb" ? "w342" : "w500";
    return url.replace("/t/p/original", `/t/p/${tmdbSize}`);
  }

  // TMDB already sized but too large → downsize
  if (url.includes("image.tmdb.org/t/p/w1280") && size === "poster") {
    return url.replace("/t/p/w1280", "/t/p/w500");
  }

  // BunnyCDN → add width optimization
  if (url.includes("b-cdn.net") && !url.includes("?width=")) {
    const width = size === "backdrop" ? 1280 : size === "thumb" ? 342 : 500;
    return `${url}?width=${width}&quality=80`;
  }

  return url;
}

/**
 * Generate a fallback image URL for broken images.
 * Returns a data URI with a simple gradient placeholder.
 */
export function getFallbackImageUrl(): string {
  return "/img/icons/background.png";
}
