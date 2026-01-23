import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const listCategories = query({
    args: { activeOnly: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        let categories = await ctx.db.query("categories").collect();

        if (args.activeOnly) {
            categories = categories.filter((c) => c.isActive);
        }

        return categories.sort((a, b) => a.order - b.order);
    },
});

export const getCategoryBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("categories")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

// ============================================
// MUTATIONS
// ============================================

export const createCategory = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        iconUrl: v.optional(v.string()),
        color: v.optional(v.string()),
        order: v.number(),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("categories", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const updateCategory = mutation({
    args: {
        id: v.id("categories"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        iconUrl: v.optional(v.string()),
        color: v.optional(v.string()),
        order: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        return await ctx.db.patch(id, filteredUpdates);
    },
});

export const deleteCategory = mutation({
    args: { id: v.id("categories") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

export const seedDefaultCategories = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("categories").first();
        if (existing) return "already_exists";

        const now = Date.now();
        const defaults = [
            { name: "Fanproj", slug: "fanproj", color: "#9AE600", order: 1 },
            { name: "Hindi AF Somali", slug: "hindi-af-somali", color: "#FF6B35", order: 2 },
            { name: "Fanproj Play", slug: "fanproj-play", color: "#3B82F6", order: 3 },
            { name: "Fanproj TV", slug: "fanproj-tv", color: "#8B5CF6", order: 4 },
        ];

        for (const cat of defaults) {
            await ctx.db.insert("categories", {
                ...cat,
                isActive: true,
                createdAt: now,
            });
        }

        return "seeded";
    },
});
