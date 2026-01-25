import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Helper to calculate similarity score between two items
function calculateSimilarity(
    itemA: { genres: string[]; tags?: string[]; category?: string },
    itemB: { genres: string[]; tags?: string[]; category?: string }
): number {
    let score = 0;

    // Genre overlap (+2 per match)
    const commonGenres = (itemA.genres || []).filter(g => (itemB.genres || []).includes(g));
    score += commonGenres.length * 2;

    // Tag overlap (+3 per match)
    const commonTags = (itemA.tags || []).filter(t => (itemB.tags || []).includes(t));
    score += commonTags.length * 3;

    // Category match (+2)
    if (itemA.category && itemA.category === itemB.category) {
        score += 2;
    }

    return score;
}

export const getTrending = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;

        const movies = await ctx.db
            .query("movies")
            .withIndex("by_published", (q) => q.eq("isPublished", true))
            .collect();

        const series = await ctx.db
            .query("series")
            .withIndex("by_published", (q) => q.eq("isPublished", true))
            .collect();

        // Combine and sort by views
        const combined = [
            ...movies.map(m => ({ ...m, type: "movie" })),
            ...series.map(s => ({ ...s, type: "series" }))
        ];

        return combined
            .sort((a, b) => (b.views || 0) - (a.views || 0) || b.createdAt - a.createdAt)
            .slice(0, limit);
    },
});

export const getSimilarContent = query({
    args: {
        contentId: v.string(), // slug or id
        contentType: v.union(v.literal("movie"), v.literal("series")),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        let currentItem: any;

        if (args.contentType === "movie") {
            currentItem = await ctx.db
                .query("movies")
                .withIndex("by_slug", q => q.eq("slug", args.contentId))
                .first();
        } else {
            currentItem = await ctx.db
                .query("series")
                .withIndex("by_slug", q => q.eq("slug", args.contentId))
                .first();
        }

        if (!currentItem) return [];

        const movies = await ctx.db
            .query("movies")
            .withIndex("by_published", q => q.eq("isPublished", true))
            .collect();

        const series = await ctx.db
            .query("series")
            .withIndex("by_published", q => q.eq("isPublished", true))
            .collect();

        const allContent = [
            ...movies.map(m => ({ ...m, type: "movie" })),
            ...series.map(s => ({ ...s, type: "series" }))
        ].filter(item => item.slug !== args.contentId);

        const scored = allContent.map(item => ({
            ...item,
            similarity: calculateSimilarity(currentItem, item)
        }));

        return scored
            .filter(item => item.similarity > 0)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, args.limit || 10);
    },
});

export const getPersonalizedHome = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        if (!args.userId) return null;

        // 1. Get recent watch history to find "Because you watched"
        const recentHistory = await ctx.db
            .query("user_watch_progress")
            .withIndex("by_user_updated", q => q.eq("userId", args.userId!))
            .order("desc")
            .take(5);

        if (recentHistory.length === 0) return null;

        const lastItem = recentHistory[0];
        let lastFullItem: any;

        if (lastItem.contentType === "movie") {
            lastFullItem = await ctx.db
                .query("movies")
                .withIndex("by_slug", q => q.eq("slug", lastItem.contentId))
                .first();
        } else if (lastItem.contentType === "episode" && lastItem.seriesId) {
            lastFullItem = await ctx.db
                .query("series")
                .withIndex("by_slug", q => q.eq("slug", lastItem.seriesId!))
                .first();
        }

        if (!lastFullItem) return null;

        // Find similar items for "Because you watched"
        const movies = await ctx.db
            .query("movies")
            .withIndex("by_published", q => q.eq("isPublished", true))
            .collect();

        const series = await ctx.db
            .query("series")
            .withIndex("by_published", q => q.eq("isPublished", true))
            .collect();

        const allContent = [
            ...movies.map(m => ({ ...m, type: "movie" })),
            ...series.map(s => ({ ...s, type: "series" }))
        ].filter(item => item.slug !== lastFullItem.slug);

        const recommendations = allContent
            .map(item => ({
                ...item,
                similarity: calculateSimilarity(lastFullItem, item)
            }))
            .filter(item => item.similarity > 0)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);

        // 2. Personalize "New Arrivals" based on preferred genres
        // Count genres in history
        const genreCounts: Record<string, number> = {};
        for (const historyItem of recentHistory) {
            let itemDetails: any;
            if (historyItem.contentType === "movie") {
                itemDetails = await ctx.db.query("movies").withIndex("by_slug", q => q.eq("slug", historyItem.contentId)).first();
            } else if (historyItem.seriesId) {
                itemDetails = await ctx.db.query("series").withIndex("by_slug", q => q.eq("slug", historyItem.seriesId!)).first();
            }

            if (itemDetails?.genres) {
                for (const g of itemDetails.genres) {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                }
            }
        }

        const favoriteGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([genre]) => genre)
            .slice(0, 3);

        const newArrivals = [
            ...movies.map(m => ({ ...m, type: "movie" })),
            ...series.map(s => ({ ...s, type: "series" }))
        ].sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 30);

        const personalizedNewArrivals = newArrivals
            .map(item => {
                const preferenceScore = (item.genres || []).filter(g => favoriteGenres.includes(g)).length;
                return { ...item, preferenceScore };
            })
            .sort((a, b) => b.preferenceScore - a.preferenceScore || b.createdAt - a.createdAt)
            .slice(0, 10);

        return {
            becauseYouWatched: {
                title: lastFullItem.title,
                items: recommendations
            },
            personalizedNewArrivals
        };
    },
});
