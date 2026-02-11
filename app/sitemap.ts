

import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fanbroj.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {


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
    // 3. Dynamic Routes (Movies & Series)
    const [movies, series] = await Promise.all([
        fetch(`${BASE_URL}/api/movies/sitemap`, { cache: 'no-store' }).then(res => res.ok ? res.json() : []).catch(() => []),
        fetch(`${BASE_URL}/api/series`, { cache: 'no-store' }).then(res => res.ok ? res.json() : []).catch(() => [])
    ]);

    const movieRoutes = movies.map((movie: any) => ({
        url: `${BASE_URL}/movies/${movie.slug}-af-somali`,
        lastModified: new Date(movie.updatedAt || Date.now()).toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    const seriesRoutes = series.map((s: any) => ({
        url: `${BASE_URL}/series/${s.slug}`,
        lastModified: new Date(s.updatedAt || Date.now()).toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // Combine
    return [...routes, ...movieRoutes, ...seriesRoutes];
}
