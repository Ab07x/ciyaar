/**
 * Optimize TMDB image URLs by replacing /original/ with sized versions.
 * /original/ serves full-res images (1261x1892px, 400KB+).
 * For poster cards displayed at ~320px wide, /w500/ is plenty.
 *
 * This is a shared utility usable from both server and client components.
 */
export function optimizeImageUrl(url: string | null | undefined, size: "poster" | "backdrop" = "poster"): string | null | undefined {
  if (!url) return url;
  if (url.includes("image.tmdb.org/t/p/original")) {
    const tmdbSize = size === "backdrop" ? "w1280" : "w500";
    return url.replace("/t/p/original", `/t/p/${tmdbSize}`);
  }
  return url;
}
