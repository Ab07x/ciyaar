import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

// Get user's push subscriptions
export const getUserSubscriptions = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, { userId }) => {
        if (!userId) return [];

        return await ctx.db
            .query("push_subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

// Get all active subscriptions (admin)
export const getAllSubscriptions = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("push_subscriptions")
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

// Get subscription by ID
export const getSubscriptionById = query({
    args: { id: v.id("push_subscriptions") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

// ============================================
// MUTATIONS
// ============================================

// Save or update push subscription
export const saveSubscription = mutation({
    args: {
        userId: v.optional(v.id("users")),
        deviceId: v.string(),
        endpoint: v.string(),
        keys: v.object({
            p256dh: v.string(),
            auth: v.string(),
        }),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Check if subscription already exists
        const existing = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .first();

        if (existing) {
            // Update existing subscription
            await ctx.db.patch(existing._id, {
                userId: args.userId,
                deviceId: args.deviceId,
                keys: args.keys,
                userAgent: args.userAgent,
                isActive: true,
                lastUsedAt: now,
            });
            return existing._id;
        }

        // Create new subscription
        return await ctx.db.insert("push_subscriptions", {
            userId: args.userId,
            deviceId: args.deviceId,
            endpoint: args.endpoint,
            keys: args.keys,
            userAgent: args.userAgent,
            isActive: true,
            createdAt: now,
            lastUsedAt: now,
        });
    },
});

// Unsubscribe
export const unsubscribe = mutation({
    args: { endpoint: v.string() },
    handler: async (ctx, { endpoint }) => {
        const subscription = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
            .first();

        if (subscription) {
            await ctx.db.patch(subscription._id, { isActive: false });
        }
    },
});

// Mark subscription as inactive (called when push fails)
export const markInactive = mutation({
    args: { id: v.id("push_subscriptions") },
    handler: async (ctx, { id }) => {
        await ctx.db.patch(id, { isActive: false });
    },
});

