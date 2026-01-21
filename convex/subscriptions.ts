import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const getUserSubscription = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const subs = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        // Find active, non-expired subscription
        const now = Date.now();
        const active = subs.find(
            (s) => s.status === "active" && s.expiresAt > now
        );

        return active || null;
    },
});

export const getUserSubscriptionDetails = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        // Find device and user
        const device = await ctx.db
            .query("devices")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!device) {
            return null;
        }

        const userId = device.userId;

        // Get all user's subscriptions
        const subs = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // Find active, non-expired subscription
        const now = Date.now();
        const activeSub = subs.find(
            (s) => s.status === "active" && s.expiresAt > now
        );

        if (!activeSub) {
            return null;
        }

        // Get all user's devices
        const devices = await ctx.db
            .query("devices")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // Get the redemption code if available
        let codeInfo = null;
        if (activeSub.codeId) {
            const redemption = await ctx.db.get(activeSub.codeId);
            if (redemption) {
                codeInfo = {
                    code: redemption.code,
                    codeExpiresAt: redemption.expiresAt,
                };
            }
        }

        return {
            subscription: {
                plan: activeSub.plan,
                status: activeSub.status,
                expiresAt: activeSub.expiresAt,
                createdAt: activeSub.createdAt,
                maxDevices: activeSub.maxDevices,
            },
            devices: devices.map((d) => ({
                deviceId: d.deviceId,
                userAgent: d.userAgent,
                lastSeenAt: d.lastSeenAt,
            })),
            code: codeInfo,
        };
    },
});

export const checkPremiumAccess = query({
    args: {
        userId: v.optional(v.id("users")),
        matchId: v.optional(v.id("matches")),
    },
    handler: async (ctx, args) => {
        if (!args.userId) {
            return { hasAccess: false, reason: "no_user" };
        }

        const subs = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .collect();

        const now = Date.now();

        // Check for active subscription
        for (const sub of subs) {
            if (sub.status !== "active" || sub.expiresAt <= now) continue;

            // Match-specific subscription
            if (sub.plan === "match") {
                if (args.matchId && sub.matchId === args.matchId) {
                    return { hasAccess: true, plan: sub.plan, expiresAt: sub.expiresAt };
                }
            } else {
                // Weekly/Monthly/Yearly grants access to all
                return { hasAccess: true, plan: sub.plan, expiresAt: sub.expiresAt };
            }
        }

        return { hasAccess: false, reason: "no_active_subscription" };
    },
});

export const listSubscriptions = query({
    args: {
        status: v.optional(
            v.union(v.literal("active"), v.literal("expired"), v.literal("revoked"))
        ),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let subs = await ctx.db.query("subscriptions").order("desc").collect();

        if (args.status) {
            subs = subs.filter((s) => s.status === args.status);
        }

        return args.limit ? subs.slice(0, args.limit) : subs;
    },
});

// ============================================
// MUTATIONS
// ============================================

export const createSubscription = mutation({
    args: {
        userId: v.id("users"),
        plan: v.union(
            v.literal("match"),
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("yearly")
        ),
        matchId: v.optional(v.id("matches")),
        durationDays: v.number(),
        maxDevices: v.number(),
        codeId: v.optional(v.id("redemptions")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiresAt = now + args.durationDays * 24 * 60 * 60 * 1000;

        return await ctx.db.insert("subscriptions", {
            userId: args.userId,
            plan: args.plan,
            matchId: args.matchId,
            expiresAt,
            maxDevices: args.maxDevices,
            status: "active",
            codeId: args.codeId,
            createdAt: now,
        });
    },
});

export const revokeSubscription = mutation({
    args: { id: v.id("subscriptions") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: "revoked" });
    },
});

export const expireOldSubscriptions = mutation({
    handler: async (ctx) => {
        const now = Date.now();
        const subs = await ctx.db
            .query("subscriptions")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        let expiredCount = 0;
        for (const sub of subs) {
            if (sub.expiresAt <= now) {
                await ctx.db.patch(sub._id, { status: "expired" });
                expiredCount++;
            }
        }

        return { expiredCount };
    },
});
