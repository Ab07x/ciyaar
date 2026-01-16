import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const listPosts = query({
    args: {
        category: v.optional(
            v.union(
                v.literal("News"),
                v.literal("Market"),
                v.literal("Match Preview"),
                v.literal("Analysis")
            )
        ),
        isPublished: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let posts = await ctx.db.query("posts").order("desc").collect();

        if (args.category) {
            posts = posts.filter((p) => p.category === args.category);
        }
        if (args.isPublished !== undefined) {
            posts = posts.filter((p) => p.isPublished === args.isPublished);
        }

        if (args.limit) {
            posts = posts.slice(0, args.limit);
        }

        return posts;
    },
});

export const getPostBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("posts")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const getPostById = query({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getPostsByTag = query({
    args: { tag: v.string() },
    handler: async (ctx, args) => {
        const posts = await ctx.db
            .query("posts")
            .withIndex("by_published", (q) => q.eq("isPublished", true))
            .collect();
        return posts.filter((p) => p.tags.includes(args.tag));
    },
});

// ============================================
// MUTATIONS
// ============================================

export const createPost = mutation({
    args: {
        slug: v.string(),
        title: v.string(),
        excerpt: v.string(),
        content: v.string(),
        featuredImageUrl: v.optional(v.string()),
        category: v.union(
            v.literal("News"),
            v.literal("Market"),
            v.literal("Match Preview"),
            v.literal("Analysis")
        ),
        tags: v.array(v.string()),
        isPublished: v.boolean(),
        publishedAt: v.optional(v.number()),
        seoTitle: v.optional(v.string()),
        seoDescription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("posts", {
            ...args,
            publishedAt: args.isPublished ? args.publishedAt || now : undefined,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updatePost = mutation({
    args: {
        id: v.id("posts"),
        slug: v.optional(v.string()),
        title: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        content: v.optional(v.string()),
        featuredImageUrl: v.optional(v.string()),
        category: v.optional(
            v.union(
                v.literal("News"),
                v.literal("Market"),
                v.literal("Match Preview"),
                v.literal("Analysis")
            )
        ),
        tags: v.optional(v.array(v.string())),
        isPublished: v.optional(v.boolean()),
        publishedAt: v.optional(v.number()),
        seoTitle: v.optional(v.string()),
        seoDescription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const deletePost = mutation({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const publishPost = mutation({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.patch(args.id, {
            isPublished: true,
            publishedAt: now,
            updatedAt: now,
        });
    },
});

export const unpublishPost = mutation({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            isPublished: false,
            updatedAt: Date.now(),
        });
    },
});
