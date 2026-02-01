
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Generate Upload URL
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// 2. Save Media Metadata
export const saveMedia = mutation({
    args: {
        storageId: v.optional(v.id("_storage")),
        url: v.optional(v.string()),
        name: v.string(),
        type: v.string(),
        size: v.number(),
    },
    handler: async (ctx, args) => {
        let url = args.url;
        if (args.storageId) {
            url = await ctx.storage.getUrl(args.storageId) || undefined;
        }

        if (!url) throw new Error("Failed to get media URL");

        await ctx.db.insert("media", {
            storageId: args.storageId,
            url,
            name: args.name,
            type: args.type,
            size: args.size,
            uploadedAt: Date.now(),
        });
    },
});

// 3. List Media
export const listMedia = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        return await ctx.db
            .query("media")
            .withIndex("by_uploaded")
            .order("desc")
            .take(limit);
    },
});

// 4. Get Media URL by Storage ID
export const getMediaUrl = query({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

// 5. Delete Media
export const deleteMedia = mutation({
    args: {
        id: v.id("media"),
        storageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        // Delete from storage if exists
        if (args.storageId) {
            await ctx.storage.delete(args.storageId);
        }
        // Delete from DB
        await ctx.db.delete(args.id);
    },
});
