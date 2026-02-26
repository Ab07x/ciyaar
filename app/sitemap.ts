import { MetadataRoute } from "next";
import connectDB from "@/lib/mongodb";
import { Movie, Series, Match, Post, Channel } from "@/lib/models";

// Force dynamic rendering - sitemap needs DB access
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

const BASE_URL = "https://fanbroj.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    await connectDB();

    // 1. Static Routes - high-value pages first
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
        // Content hub pages targeting high-impression keyword clusters (GSC data)
        { url: `${BASE_URL}/hindi-af-somali`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
        { url: `${BASE_URL}/hindi-af-somali/2025`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
        { url: `${BASE_URL}/hindi-af-somali/2026`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
        { url: `${BASE_URL}/movies`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
        { url: `${BASE_URL}/series`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${BASE_URL}/ciyaar`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
        { url: `${BASE_URL}/live`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
        { url: `${BASE_URL}/tags`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
        { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
        { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/apps`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/apps/android`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/apps/ios`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE_URL}/requests`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
    ];

    // 2. Dynamic Routes - fetch all from MongoDB
    const [movies, series, matches, posts, channels, tagAgg] = await Promise.all([
        Movie.find({ isPublished: true }, "slug updatedAt views").lean().catch(() => []),
        Series.find({ isPublished: true }, "slug updatedAt views numberOfSeasons").lean().catch(() => []),
        Match.find({ status: { $in: ["live", "upcoming"] } }, "slug updatedAt").lean().catch(() => []),
        Post.find({ isPublished: true }, "slug updatedAt").lean().catch(() => []),
        Channel.find({ isLive: true }, "slug updatedAt").lean().catch(() => []),
        Movie.aggregate([
            { $match: { isPublished: true, tags: { $exists: true, $ne: [] } } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]).catch(() => []),
    ]);

    // Movies with -af-somali suffix - boost popular movies
    const movieRoutes: MetadataRoute.Sitemap = (movies as any[]).map((movie) => ({
        url: `${BASE_URL}/movies/${movie.slug}-af-somali`,
        lastModified: new Date(movie.updatedAt || Date.now()),
        changeFrequency: "weekly" as const,
        priority: (movie.views || 0) > 100 ? 0.85 : 0.7,
    }));

    // Series - boost popular series
    const seriesRoutes: MetadataRoute.Sitemap = (series as any[]).map((s) => ({
        url: `${BASE_URL}/series/${s.slug}`,
        lastModified: new Date(s.updatedAt || Date.now()),
        changeFrequency: "weekly" as const,
        priority: (s.views || 0) > 100 ? 0.85 : 0.7,
    }));

    // Matches / Live
    const matchRoutes: MetadataRoute.Sitemap = (matches as any[]).map((m) => ({
        url: `${BASE_URL}/ciyaar/${m.slug}`,
        lastModified: new Date(m.updatedAt || Date.now()),
        changeFrequency: "hourly" as const,
        priority: 0.8,
    }));

    // Blog Posts
    const postRoutes: MetadataRoute.Sitemap = (posts as any[]).map((p) => ({
        url: `${BASE_URL}/blog/${p.slug}`,
        lastModified: new Date(p.updatedAt || Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.5,
    }));

    // Live Channels
    const channelRoutes: MetadataRoute.Sitemap = (channels as any[]).map((ch) => ({
        url: `${BASE_URL}/live/${ch.slug}`,
        lastModified: new Date(ch.updatedAt || Date.now()),
        changeFrequency: "daily" as const,
        priority: 0.6,
    }));

    // Tags - indexable keyword pages
    const tagRoutes: MetadataRoute.Sitemap = [
        { url: `${BASE_URL}/tags`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
        ...(tagAgg as any[]).map((t) => ({
            url: `${BASE_URL}/tags/${t._id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: t.count > 50 ? 0.8 : t.count > 10 ? 0.7 : 0.6,
        })),
    ];

    return [
        ...staticRoutes,
        ...tagRoutes,
        ...movieRoutes,
        ...seriesRoutes,
        ...matchRoutes,
        ...postRoutes,
        ...channelRoutes,
    ];
}
