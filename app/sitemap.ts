
import { fetchQuery } from "convex/nextjs";
import { MetadataRoute } from "next";
import { api } from "@/convex/_generated/api";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fanbroj.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let movies: any[] = [];

    try {
        // 1. Fetch Dynamic Content (Lightweight Query)
        movies = await fetchQuery(api.movies.getSitemapData, {});
    } catch (error) {
        console.error("Sitemap failed to fetch movies:", error);
        // Continue with static routes if DB fails
    }

    // 2. Static Routes
    const routes = [
        "",
        "/movies",
        "/series",
        // "/live",
        "/blog",
        "/pricing",
        "/login",
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    // 3. Dynamic Routes (Movies)
    const movieRoutes = movies.map((movie) => ({
        url: `${BASE_URL}/movies/${movie.slug}`,
        lastModified: new Date(movie.updatedAt || Date.now()).toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // Combine
    return [...routes, ...movieRoutes];
}
