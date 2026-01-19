import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const listChannels = query({
    args: {
        category: v.optional(
            v.union(
                v.literal("sports"),
                v.literal("entertainment"),
                v.literal("news"),
                v.literal("movies")
            )
        ),
        isPremium: v.optional(v.boolean()),
        isLive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let channels = await ctx.db.query("channels").collect();

        if (args.category) {
            channels = channels.filter((c) => c.category === args.category);
        }
        if (args.isPremium !== undefined) {
            channels = channels.filter((c) => c.isPremium === args.isPremium);
        }
        if (args.isLive !== undefined) {
            channels = channels.filter((c) => c.isLive === args.isLive);
        }

        // Sort by priority (featured first), then by name
        return channels.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
    },
});

export const getChannelBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("channels")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const getChannelsByStatus = query({
    args: {},
    handler: async (ctx) => {
        const channels = await ctx.db.query("channels").collect();

        const live = channels.filter((c) => c.isLive).sort((a, b) => b.priority - a.priority);
        const free = channels.filter((c) => !c.isPremium).sort((a, b) => b.priority - a.priority);
        const premium = channels.filter((c) => c.isPremium).sort((a, b) => b.priority - a.priority);

        return { live, free, premium, all: channels };
    },
});

// ============================================
// MUTATIONS (Admin)
// ============================================

export const createChannel = mutation({
    args: {
        slug: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        category: v.union(
            v.literal("sports"),
            v.literal("entertainment"),
            v.literal("news"),
            v.literal("movies")
        ),
        embeds: v.array(
            v.object({
                label: v.string(),
                url: v.string(),
                type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                isProtected: v.optional(v.boolean()),
            })
        ),
        isPremium: v.boolean(),
        isLive: v.boolean(),
        priority: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("channels", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateChannel = mutation({
    args: {
        id: v.id("channels"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        category: v.optional(
            v.union(
                v.literal("sports"),
                v.literal("entertainment"),
                v.literal("news"),
                v.literal("movies")
            )
        ),
        embeds: v.optional(
            v.array(
                v.object({
                    label: v.string(),
                    url: v.string(),
                    type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                    isProtected: v.optional(v.boolean()),
                })
            )
        ),
        isPremium: v.optional(v.boolean()),
        isLive: v.optional(v.boolean()),
        priority: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        return await ctx.db.patch(id, {
            ...filteredUpdates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteChannel = mutation({
    args: { id: v.id("channels") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

export const toggleChannelLive = mutation({
    args: { id: v.id("channels") },
    handler: async (ctx, args) => {
        const channel = await ctx.db.get(args.id);
        if (!channel) throw new Error("Channel not found");
        return await ctx.db.patch(args.id, {
            isLive: !channel.isLive,
            updatedAt: Date.now(),
        });
    },
});
