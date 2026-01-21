import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save playback progress
export const saveProgress = mutation({
    args: {
        userId: v.id("users"),
        contentType: v.union(v.literal("movie"), v.literal("episode"), v.literal("match")),
        contentId: v.string(), // slug (movie), episodeId (series), matchId
        seriesId: v.optional(v.string()), // Optional slug of series if it's an episode
        progressSeconds: v.number(),
        durationSeconds: v.number(),
    },
    handler: async (ctx, args) => {
        // Authenticated via client

        const isFinished = args.progressSeconds / args.durationSeconds > 0.95;

        // Check for existing progress
        const existing = await ctx.db
            .query("user_watch_progress")
            .withIndex("by_user_content", (q) =>
                q.eq("userId", args.userId)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                progressSeconds: args.progressSeconds,
                durationSeconds: args.durationSeconds,
                isFinished,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("user_watch_progress", {
                userId: args.userId,
                contentType: args.contentType,
                contentId: args.contentId,
                seriesId: args.seriesId,
                progressSeconds: args.progressSeconds,
                durationSeconds: args.durationSeconds,
                isFinished,
                updatedAt: Date.now(),
            });
        }
    },
});

// Get resume point for specific content
export const getResumePoint = query({
    args: {
        userId: v.optional(v.id("users")),
        contentType: v.union(v.literal("movie"), v.literal("episode"), v.literal("match")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.userId) return 0;

        const progress = await ctx.db
            .query("user_watch_progress")
            .withIndex("by_user_content", (q) =>
                q.eq("userId", args.userId!)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        if (progress && !progress.isFinished) {
            return progress.progressSeconds;
        }
        return 0;
    },
});

// Get "Continue Watching" list
export const getContinueWatching = query({
    args: {
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        if (!args.userId) return [];

        // Fetch last 10 updated items that are NOT finished
        const progressItems = await ctx.db
            .query("user_watch_progress")
            .withIndex("by_user_updated", (q) => q.eq("userId", args.userId!))
            .order("desc")
            .take(20);

        const unfinished = progressItems.filter(item => !item.isFinished);

        // Hydrate data
        const hydrated = await Promise.all(unfinished.map(async (item) => {
            let details = null;
            if (item.contentType === "movie") {
                details = await ctx.db.query("movies")
                    .withIndex("by_slug", (q) => q.eq("slug", item.contentId))
                    .first();
            } else if (item.contentType === "match") {
                details = await ctx.db.get(item.contentId as any);
            } else if (item.contentType === "episode") {
                // For episodes, fetching the Series details is usually better for the card visual
                if (item.seriesId) {
                    details = await ctx.db.query("series")
                        .withIndex("by_slug", (q) => q.eq("slug", item.seriesId!))
                        .first();
                }
                // We could also fetch specific episode info if needed
            }

            return {
                ...item,
                details
            };
        }));

        return hydrated.filter(i => i.details !== null).slice(0, 10);
    },
});
