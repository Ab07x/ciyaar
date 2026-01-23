import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to get date string
const getDateString = (date: Date) => date.toISOString().split("T")[0];

// Generic increment for any table with a 'views' field
export const increment = mutation({
    args: {
        id: v.string(),
        collection: v.union(v.literal("matches"), v.literal("posts")),
    },
    handler: async (ctx, args) => {
        const id = ctx.db.normalizeId(args.collection, args.id);
        if (!id) return;

        const doc = await ctx.db.get(id);
        if (!doc) return;

        await ctx.db.patch(id, {
            views: ((doc as any).views || 0) + 1,
        });
    },
});

// ============================================
// DASHBOARD ANALYTICS
// ============================================

export const getDashboardStats = query({
    handler: async (ctx) => {
        const now = new Date();
        const today = getDateString(now);

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getDateString(yesterday);

        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = getDateString(weekAgo);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = getDateString(monthStart);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthStartStr = getDateString(lastMonthStart);
        const lastMonthEndStr = getDateString(lastMonthEnd);

        // Get all page views
        const allViews = await ctx.db.query("page_views").collect();

        // Calculate totals for each period
        const todayViews = allViews
            .filter((v) => v.date === today)
            .reduce((sum, v) => sum + v.views, 0);

        const yesterdayViews = allViews
            .filter((v) => v.date === yesterdayStr)
            .reduce((sum, v) => sum + v.views, 0);

        const lastWeekViews = allViews
            .filter((v) => v.date >= weekAgoStr && v.date <= today)
            .reduce((sum, v) => sum + v.views, 0);

        const thisMonthViews = allViews
            .filter((v) => v.date >= monthStartStr && v.date <= today)
            .reduce((sum, v) => sum + v.views, 0);

        const lastMonthViews = allViews
            .filter((v) => v.date >= lastMonthStartStr && v.date <= lastMonthEndStr)
            .reduce((sum, v) => sum + v.views, 0);

        // Top pages
        const pageTypeTotals: Record<string, number> = {};
        allViews
            .filter((v) => v.date >= weekAgoStr)
            .forEach((v) => {
                pageTypeTotals[v.pageType] = (pageTypeTotals[v.pageType] || 0) + v.views;
            });

        const topPageTypes = Object.entries(pageTypeTotals)
            .map(([type, views]) => ({ type, views }))
            .sort((a, b) => b.views - a.views);

        // Daily breakdown for chart (last 7 days)
        const dailyBreakdown: { date: string; views: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = getDateString(d);
            const dayViews = allViews
                .filter((v) => v.date === dateStr)
                .reduce((sum, v) => sum + v.views, 0);
            dailyBreakdown.push({ date: dateStr, views: dayViews });
        }

        return {
            today: todayViews,
            yesterday: yesterdayViews,
            lastWeek: lastWeekViews,
            thisMonth: thisMonthViews,
            lastMonth: lastMonthViews,
            topPageTypes,
            dailyBreakdown,
        };
    },
});

// ============================================
// PAGE VIEW TRACKING
// ============================================

export const trackPageView = mutation({
    args: {
        pageType: v.union(
            v.literal("home"),
            v.literal("movie"),
            v.literal("series"),
            v.literal("match"),
            v.literal("live"),
            v.literal("blog"),
            v.literal("pricing"),
            v.literal("other")
        ),
        pageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const today = getDateString(new Date());

        // Find existing record for this page today
        const existing = await ctx.db
            .query("page_views")
            .filter((q) =>
                q.and(
                    q.eq(q.field("date"), today),
                    q.eq(q.field("pageType"), args.pageType)
                )
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                views: existing.views + 1,
            });
        } else {
            await ctx.db.insert("page_views", {
                date: today,
                pageType: args.pageType,
                pageId: args.pageId,
                views: 1,
            });
        }
    },
});

export const seedSampleAnalytics = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("page_views").first();
        if (existing) return "already_exists";

        const now = new Date();

        // Generate sample data for the last 30 days
        for (let i = 0; i < 30; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = getDateString(d);

            const pageTypes = ["home", "movie", "series", "match", "live", "blog", "pricing"] as const;

            for (const pageType of pageTypes) {
                // Random views - more recent days have more views
                const baseViews = Math.floor(Math.random() * 300) + 50;
                const recencyBoost = Math.max(0, 30 - i) * 10;
                const views = baseViews + recencyBoost;

                await ctx.db.insert("page_views", {
                    date: dateStr,
                    pageType,
                    views,
                });
            }
        }

        return "seeded";
    },
});
