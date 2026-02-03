import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Reactivate ALL FCM tokens (for fixing incorrectly deactivated tokens)
export const reactivateAllFcmTokens = mutation({
    handler: async (ctx) => {
        const subs = await ctx.db
            .query("push_subscriptions")
            .filter((q) => q.neq(q.field("fcmToken"), undefined))
            .collect();

        let count = 0;
        for (const sub of subs) {
            if (sub.fcmToken && !sub.isActive) {
                await ctx.db.patch(sub._id, { isActive: true });
                count++;
            }
        }
        return { reactivated: count };
    },
});


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

// ============================================
// FCM TOKEN SUPPORT (Firebase Cloud Messaging)
// ============================================

// Save FCM token for push notifications
export const saveFcmToken = mutation({
    args: {
        token: v.string(),
        deviceId: v.string(),
        userId: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Check if this device already has a subscription
        const existingByDevice = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (existingByDevice) {
            // Update existing subscription with new FCM token
            await ctx.db.patch(existingByDevice._id, {
                fcmToken: args.token,
                endpoint: `fcm://${args.token.substring(0, 50)}`, // Use FCM token as endpoint for compatibility
                userAgent: args.userAgent,
                isActive: true,
                lastUsedAt: now,
            });
            return existingByDevice._id;
        }

        // Check if this token already exists
        const existingByToken = await ctx.db
            .query("push_subscriptions")
            .filter((q) => q.eq(q.field("fcmToken"), args.token))
            .first();

        if (existingByToken) {
            await ctx.db.patch(existingByToken._id, {
                deviceId: args.deviceId,
                userAgent: args.userAgent,
                isActive: true,
                lastUsedAt: now,
            });
            return existingByToken._id;
        }

        // Create new subscription with FCM token
        return await ctx.db.insert("push_subscriptions", {
            deviceId: args.deviceId,
            fcmToken: args.token,
            endpoint: `fcm://${args.token.substring(0, 50)}`,
            keys: { p256dh: "", auth: "" }, // Empty for FCM
            userAgent: args.userAgent,
            isActive: true,
            createdAt: now,
            lastUsedAt: now,
        });
    },
});

// Remove FCM token
export const removeFcmToken = mutation({
    args: { deviceId: v.string() },
    handler: async (ctx, { deviceId }) => {
        const subscription = await ctx.db
            .query("push_subscriptions")
            .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
            .first();

        if (subscription) {
            await ctx.db.patch(subscription._id, { isActive: false });
        }
    },
});

// Get all active FCM tokens (for broadcast)
export const getAllFcmTokens = query({
    handler: async (ctx) => {
        const subs = await ctx.db
            .query("push_subscriptions")
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Return only subscriptions with FCM tokens
        return subs
            .filter((s) => s.fcmToken)
            .map((s) => ({
                _id: s._id,
                token: s.fcmToken!,
                deviceId: s.deviceId,
            }));
    },
});

// Mark FCM token as invalid
export const markFcmTokenInvalid = mutation({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        const subscription = await ctx.db
            .query("push_subscriptions")
            .filter((q) => q.eq(q.field("fcmToken"), token))
            .first();

        if (subscription) {
            await ctx.db.patch(subscription._id, { isActive: false });
        }
    },
});

