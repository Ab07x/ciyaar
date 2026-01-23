
import { fetchQuery } from "convex/nextjs";
import { MetadataRoute } from "next";
import { api } from "@/convex/_generated/api";

const BASE_URL = "https://fanbroj.net"; // In production, this should be env var

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Fetch Dynamic Content
    const movies = await fetchQuery(api.movies.getAllMovies, {});
    // const series = await fetchQuery(api.series.getAllSeries, {}); // Assuming this exists or similar

    // 2. Static Routes
    const routes = [
        "",
        "/movies",
        "/series",
        "/live",
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
