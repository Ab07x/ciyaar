import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://fanbroj.net";

    // Static routes
    const routes = [
        "",
        "/ciyaar",
        "/live",
        "/movies",
        "/series",
        "/blog",
        "/pricing",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    return [...routes];
}
