import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all channels
export const list = query({
    args: {
        category: v.optional(v.string()),
        isLive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const q = args.isLive !== undefined
            ? ctx.db.query("channels").withIndex("by_live", (q) => q.eq("isLive", args.isLive!))
            : ctx.db.query("channels");

        let channels = await q.collect();

        // Sort by priority (descending)
        channels.sort((a, b) => b.priority - a.priority);

        // Filter category manually if needed
        if (args.category) {
            channels = channels.filter((c) => c.category === args.category);
        }

        return channels;
    },
});

// Alias for UI consistency
export const listChannels = list;

// Get single channel by slug
export const getChannelBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("channels")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const getBySlug = getChannelBySlug;

// Create Channel (Admin)
export const createChannel = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        category: v.union(v.literal("sports"), v.literal("entertainment"), v.literal("news"), v.literal("movies")),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        streamUrl: v.optional(v.string()),
        embeds: v.optional(v.array(v.object({
            label: v.string(),
            url: v.string(),
            type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
            isProtected: v.optional(v.boolean()),
        }))),
        isLive: v.boolean(),
        isPremium: v.boolean(),
        priority: v.number(),
    },
    handler: async (ctx, args) => {
        // Check if slug exists
        const existing = await ctx.db
            .query("channels")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) throw new Error("Slug already exists");

        const channelId = await ctx.db.insert("channels", {
            name: args.name,
            slug: args.slug,
            category: args.category,
            description: args.description,
            thumbnailUrl: args.thumbnailUrl,
            embeds: args.embeds || [
                {
                    label: "Main Stream",
                    url: args.streamUrl || "",
                    type: "m3u8",
                },
            ],
            isLive: args.isLive,
            isPremium: args.isPremium,
            priority: args.priority,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return channelId;
    },
});

export const create = createChannel;

// Update Channel (Admin)
export const updateChannel = mutation({
    args: {
        id: v.id("channels"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        category: v.optional(v.union(v.literal("sports"), v.literal("entertainment"), v.literal("news"), v.literal("movies"))),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        streamUrl: v.optional(v.string()),
        embeds: v.optional(v.array(v.object({
            label: v.string(),
            url: v.string(),
            type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
            isProtected: v.optional(v.boolean()),
        }))),
        isLive: v.optional(v.boolean()),
        isPremium: v.optional(v.boolean()),
        priority: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, streamUrl, ...fields } = args;

        const updates: any = {
            ...fields,
            updatedAt: Date.now(),
        };

        // If stream URL is provided, update the first embed
        if (streamUrl) {
            updates.embeds = [
                {
                    label: "Main Stream",
                    url: streamUrl,
                    type: "m3u8",
                },
            ];
        }

        await ctx.db.patch(id, updates);
    },
});

export const update = updateChannel;

// Delete Channel (Admin)
export const deleteChannel = mutation({
    args: { id: v.id("channels") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const remove = deleteChannel;
