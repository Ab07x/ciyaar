import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// MUTATIONS
// ============================================

/**
 * Track a search query
 */
export const trackSearch = mutation({
    args: {
        query: v.string(),
        resultsCount: v.number(),
        deviceId: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        userAgent: v.optional(v.string()),
        sessionId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Don't track very short queries
        if (args.query.length < 2) return null;

        return await ctx.db.insert("search_analytics", {
            query: args.query,
            queryLower: args.query.toLowerCase().trim(),
            resultsCount: args.resultsCount,
            hasResults: args.resultsCount > 0,
            deviceId: args.deviceId,
            userId: args.userId,
            userAgent: args.userAgent,
            sessionId: args.sessionId,
            createdAt: now,
        });
    },
});

/**
 * Track when user clicks a search result
 */
export const trackSearchClick = mutation({
    args: {
        searchId: v.id("search_analytics"),
        clickedItem: v.string(),
        clickedItemType: v.union(
            v.literal("match"),
            v.literal("movie"),
            v.literal("series")
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.searchId, {
            clickedItem: args.clickedItem,
            clickedItemType: args.clickedItemType,
        });
    },
});

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * Get search analytics summary
 */
export const getAnalyticsSummary = query({
    args: {
        days: v.optional(v.number()), // Default 7 days
    },
    handler: async (ctx, args) => {
        const days = args.days || 7;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        const allSearches = await ctx.db
            .query("search_analytics")
            .withIndex("by_created")
            .filter((q) => q.gte(q.field("createdAt"), cutoff))
            .collect();

        const totalSearches = allSearches.length;
        const zeroResultSearches = allSearches.filter((s) => !s.hasResults).length;
        const clickedSearches = allSearches.filter((s) => s.clickedItem).length;
        const uniqueDevices = new Set(allSearches.map((s) => s.deviceId).filter(Boolean)).size;

        return {
            totalSearches,
            zeroResultSearches,
            zeroResultRate: totalSearches > 0 ? Math.round((zeroResultSearches / totalSearches) * 100) : 0,
            clickedSearches,
            clickThroughRate: totalSearches > 0 ? Math.round((clickedSearches / totalSearches) * 100) : 0,
            uniqueDevices,
            periodDays: days,
        };
    },
});

/**
 * Get top search queries
 */
export const getTopQueries = query({
    args: {
        days: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const days = args.days || 7;
        const limit = args.limit || 20;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        const allSearches = await ctx.db
            .query("search_analytics")
            .withIndex("by_created")
            .filter((q) => q.gte(q.field("createdAt"), cutoff))
            .collect();

        // Aggregate by query
        const queryMap = new Map<string, { count: number; clicks: number; noResults: number }>();

        for (const search of allSearches) {
            const key = search.queryLower;
            const existing = queryMap.get(key) || { count: 0, clicks: 0, noResults: 0 };
            existing.count++;
            if (search.clickedItem) existing.clicks++;
            if (!search.hasResults) existing.noResults++;
            queryMap.set(key, existing);
        }

        // Sort by count and take top
        const sorted = Array.from(queryMap.entries())
            .map(([query, stats]) => ({ query, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return sorted;
    },
});

/**
 * Get zero-result searches (content gaps)
 */
export const getZeroResultQueries = query({
    args: {
        days: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const days = args.days || 7;
        const limit = args.limit || 30;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        const zeroResultSearches = await ctx.db
            .query("search_analytics")
            .withIndex("by_has_results")
            .filter((q) =>
                q.and(
                    q.eq(q.field("hasResults"), false),
                    q.gte(q.field("createdAt"), cutoff)
                )
            )
            .collect();

        // Aggregate by query
        const queryMap = new Map<string, number>();

        for (const search of zeroResultSearches) {
            const key = search.queryLower;
            queryMap.set(key, (queryMap.get(key) || 0) + 1);
        }

        // Sort by count
        const sorted = Array.from(queryMap.entries())
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return sorted;
    },
});

/**
 * Get recent searches
 */
export const getRecentSearches = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;

        const searches = await ctx.db
            .query("search_analytics")
            .withIndex("by_created")
            .order("desc")
            .take(limit);

        return searches.map((s) => ({
            id: s._id,
            query: s.query,
            resultsCount: s.resultsCount,
            hasResults: s.hasResults,
            clickedItem: s.clickedItem,
            clickedItemType: s.clickedItemType,
            createdAt: s.createdAt,
        }));
    },
});

/**
 * Get search trend data (for charts)
 */
export const getSearchTrend = query({
    args: {
        days: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const days = args.days || 7;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        const allSearches = await ctx.db
            .query("search_analytics")
            .withIndex("by_created")
            .filter((q) => q.gte(q.field("createdAt"), cutoff))
            .collect();

        // Group by day
        const dailyData: Record<string, { searches: number; zeroResults: number; clicks: number }> = {};

        for (const search of allSearches) {
            const date = new Date(search.createdAt).toISOString().split("T")[0];
            if (!dailyData[date]) {
                dailyData[date] = { searches: 0, zeroResults: 0, clicks: 0 };
            }
            dailyData[date].searches++;
            if (!search.hasResults) dailyData[date].zeroResults++;
            if (search.clickedItem) dailyData[date].clicks++;
        }

        // Convert to array sorted by date
        return Object.entries(dailyData)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
    },
});
