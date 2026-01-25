import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const getUserByDevice = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const device = await ctx.db
            .query("devices")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!device) return null;
        return await ctx.db.get(device.userId);
    },
});

export const getUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

export const getUserDevices = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("devices")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const listUsers = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const users = await ctx.db.query("users").order("desc").collect();
        return args.limit ? users.slice(0, args.limit) : users;
    },
});

// ============================================
// MUTATIONS
// ============================================

export const getOrCreateUser = mutation({
    args: {
        deviceId: v.string(),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if device exists
        const existingDevice = await ctx.db
            .query("devices")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (existingDevice) {
            // Update last seen
            await ctx.db.patch(existingDevice._id, { lastSeenAt: Date.now() });
            return existingDevice.userId;
        }

        // Create new user with 7-day free trial
        const now = Date.now();
        const trialDays = 7;
        const trialExpiresAt = now + (trialDays * 24 * 60 * 60 * 1000);

        const userId = await ctx.db.insert("users", {
            createdAt: now,
            trialExpiresAt,
            isTrialUsed: false,
        });

        // Register device
        await ctx.db.insert("devices", {
            userId,
            deviceId: args.deviceId,
            userAgent: args.userAgent,
            lastSeenAt: now,
        });

        return userId;
    },
});

export const registerDevice = mutation({
    args: {
        userId: v.id("users"),
        deviceId: v.string(),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if device already registered
        const existing = await ctx.db
            .query("devices")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (existing) {
            if (existing.userId !== args.userId) {
                throw new Error("Device already registered to another user");
            }
            await ctx.db.patch(existing._id, { lastSeenAt: Date.now() });
            return existing._id;
        }

        return await ctx.db.insert("devices", {
            userId: args.userId,
            deviceId: args.deviceId,
            userAgent: args.userAgent,
            lastSeenAt: Date.now(),
        });
    },
});

export const checkDeviceLimit = query({
    args: {
        userId: v.id("users"),
        maxDevices: v.number(),
    },
    handler: async (ctx, args) => {
        const devices = await ctx.db
            .query("devices")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        return {
            currentCount: devices.length,
            maxAllowed: args.maxDevices,
            isWithinLimit: devices.length <= args.maxDevices,
        };
    },
});

export const removeDevice = mutation({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const device = await ctx.db
            .query("devices")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (device) {
            await ctx.db.delete(device._id);
        }
    },
});

export const logout = mutation({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const device = await ctx.db
            .query("devices")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (device) {
            await ctx.db.delete(device._id);
        }
    },
});

export const updateProfile = mutation({
    args: {
        userId: v.id("users"),
        displayName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        await ctx.db.patch(args.userId, {
            ...(args.displayName !== undefined && { displayName: args.displayName }),
            ...(args.avatarUrl !== undefined && { avatarUrl: args.avatarUrl }),
        });
    },
});
