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
 * Get most searched/clicked content for "Trending Now" section
 * Falls back to most-viewed movies if not enough search data
 */
export const getMostSearchedContent = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

        const recentSearches = await ctx.db
            .query("search_analytics")
            .withIndex("by_created")
            .filter((q) => q.gte(q.field("createdAt"), cutoff))
            .collect();

        // 1. Count clicks per slug+type (strongest signal)
        const clickCounts = new Map<string, { slug: string; type: "movie" | "series"; count: number }>();
        for (const search of recentSearches) {
            if (search.clickedItem && search.clickedItemType && search.clickedItemType !== "match") {
                const key = `${search.clickedItemType}:${search.clickedItem}`;
                const existing = clickCounts.get(key);
                if (existing) {
                    existing.count++;
                } else {
                    clickCounts.set(key, {
                        slug: search.clickedItem,
                        type: search.clickedItemType as "movie" | "series",
                        count: 1,
                    });
                }
            }
        }

        // Sort by click frequency
        const topClicked = Array.from(clickCounts.values()).sort((a, b) => b.count - a.count);

        // 2. Fetch actual documents for top clicked slugs
        const results: any[] = [];
        const seenSlugs = new Set<string>();

        for (const item of topClicked) {
            if (results.length >= limit) break;
            if (seenSlugs.has(item.slug)) continue;

            let doc = null;
            if (item.type === "movie") {
                doc = await ctx.db.query("movies").withIndex("by_slug", (q) => q.eq("slug", item.slug)).first();
            } else {
                doc = await ctx.db.query("series").withIndex("by_slug", (q) => q.eq("slug", item.slug)).first();
            }
            if (doc && (doc as any).isPublished) {
                seenSlugs.add(item.slug);
                results.push({ ...doc, type: item.type });
            }
        }

        // 3. If not enough, supplement with top query string matches against titles
        if (results.length < limit) {
            // Get top search queries by frequency
            const queryMap = new Map<string, number>();
            for (const search of recentSearches) {
                if (search.hasResults) {
                    queryMap.set(search.queryLower, (queryMap.get(search.queryLower) || 0) + 1);
                }
            }
            const topQueries = Array.from(queryMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([q]) => q);

            // Fetch all published movies/series once, then match against top queries
            const allMovies = await ctx.db.query("movies").withIndex("by_published", (qb) => qb.eq("isPublished", true)).collect();
            const allSeries = await ctx.db.query("series").withIndex("by_published", (qb) => qb.eq("isPublished", true)).collect();

            for (const q of topQueries) {
                if (results.length >= limit) break;

                for (const movie of allMovies) {
                    if (results.length >= limit) break;
                    if (seenSlugs.has(movie.slug)) continue;
                    if (movie.title.toLowerCase().includes(q) || movie.titleSomali?.toLowerCase().includes(q)) {
                        seenSlugs.add(movie.slug);
                        results.push({ ...movie, type: "movie" as const });
                    }
                }

                for (const s of allSeries) {
                    if (results.length >= limit) break;
                    if (seenSlugs.has(s.slug)) continue;
                    if (s.title.toLowerCase().includes(q) || s.titleSomali?.toLowerCase().includes(q)) {
                        seenSlugs.add(s.slug);
                        results.push({ ...s, type: "series" as const });
                    }
                }
            }
        }

        // 4. Fallback: most-viewed movies if still not enough
        if (results.length < limit) {
            const allMovies = await ctx.db
                .query("movies")
                .withIndex("by_published", (q) => q.eq("isPublished", true))
                .collect();

            const sorted = allMovies
                .filter((m) => !seenSlugs.has(m.slug))
                .sort((a, b) => (b.views || 0) - (a.views || 0) || b.createdAt - a.createdAt);

            for (const movie of sorted) {
                if (results.length >= limit) break;
                seenSlugs.add(movie.slug);
                results.push({ ...movie, type: "movie" as const });
            }
        }

        return results.slice(0, limit);
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
