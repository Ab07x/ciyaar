import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Toggle item in My List (Add/Remove)
export const toggle = mutation({
    args: {
        userId: v.id("users"),
        contentType: v.union(v.literal("movie"), v.literal("series"), v.literal("match")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        // Authenticated via client-provided userId (from UserProvider)
        // In a more strict env, we would validate this against a session token or similar.

        // Check if exists
        const existing = await ctx.db
            .query("user_mylist")
            .withIndex("by_user_content", (q) =>
                q.eq("userId", args.userId)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { action: "removed" };
        } else {
            await ctx.db.insert("user_mylist", {
                userId: args.userId,
                contentType: args.contentType,
                contentId: args.contentId,
                addedAt: Date.now(),
            });
            return { action: "added" };
        }
    },
});

// Check status of single item
export const checkStatus = query({
    args: {
        userId: v.optional(v.id("users")), // Optional to allow skipping query easily in hooks
        contentType: v.union(v.literal("movie"), v.literal("series"), v.literal("match")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.userId) return false;

        const existing = await ctx.db
            .query("user_mylist")
            .withIndex("by_user_content", (q) =>
                q.eq("userId", args.userId!)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        return !!existing;
    },
});

// Get user's full list
export const getMyList = query({
    args: {
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        if (!args.userId) return [];

        const items = await ctx.db
            .query("user_mylist")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .order("desc")
            .take(50);

        // Enhance with details - manual join
        const enhancedItems = await Promise.all(items.map(async (item) => {
            let details = null;
            if (item.contentType === "movie" || item.contentType === "series") {
                // Fetch from movies/series table by slug
                const table = item.contentType === "movie" ? "movies" : "series";
                details = await ctx.db.query(table as any)
                    .withIndex("by_slug", (q) => q.eq("slug", item.contentId))
                    .first();
            } else if (item.contentType === "match") {
                // Fetch match by ID
                details = await ctx.db.get(item.contentId as any);
            }

            return {
                ...item,
                details
            };
        }));

        // Filter out items where content was deleted
        return enhancedItems.filter(i => i.details !== null);
    },
});
