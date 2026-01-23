import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

// Get PPV config for specific content
export const getContentConfig = query({
    args: {
        contentType: v.union(v.literal("match"), v.literal("movie")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("ppv_content")
            .withIndex("by_content", (q) =>
                q.eq("contentType", args.contentType).eq("contentId", args.contentId)
            )
            .first();
    },
});

// Get user's PPV purchase for specific content
export const getUserPurchase = query({
    args: {
        userId: v.id("users"),
        contentType: v.union(v.literal("match"), v.literal("movie")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        const purchase = await ctx.db
            .query("ppv_purchases")
            .withIndex("by_user_content", (q) =>
                q
                    .eq("userId", args.userId)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        if (purchase && purchase.expiresAt < Date.now()) {
            return null;
        }

        return purchase;
    },
});

// Check if user has access to PPV content
export const checkAccess = query({
    args: {
        userId: v.optional(v.id("users")),
        contentType: v.union(v.literal("match"), v.literal("movie")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        const ppvConfig = await ctx.db
            .query("ppv_content")
            .withIndex("by_content", (q) =>
                q.eq("contentType", args.contentType).eq("contentId", args.contentId)
            )
            .first();

        if (!ppvConfig || !ppvConfig.isActive) {
            return { hasAccess: true, isPPV: false };
        }

        if (!args.userId) {
            return { hasAccess: false, isPPV: true, config: ppvConfig };
        }

        const purchase = await ctx.db
            .query("ppv_purchases")
            .withIndex("by_user_content", (q) =>
                q
                    .eq("userId", args.userId!)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        if (purchase && purchase.expiresAt > Date.now()) {
            return {
                hasAccess: true,
                isPPV: true,
                accessType: purchase.accessType,
                expiresAt: purchase.expiresAt,
            };
        }

        return { hasAccess: false, isPPV: true, config: ppvConfig };
    },
});

// List all PPV content (admin)
export const listPPVContent = query({
    args: {
        contentType: v.optional(v.union(v.literal("match"), v.literal("movie"))),
    },
    handler: async (ctx, args) => {
        let ppvContent = await ctx.db.query("ppv_content").collect();

        if (args.contentType) {
            ppvContent = ppvContent.filter((p) => p.contentType === args.contentType);
        }

        return ppvContent.sort((a, b) => b.createdAt - a.createdAt);
    },
});

// Check if user has any active PPV purchase (for hiding ads)
export const hasActivePPV = query({
    args: {
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        if (!args.userId) return false;

        const activePurchase = await ctx.db
            .query("ppv_purchases")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
            .first();

        return !!activePurchase;
    },
});

// Get PPV purchase stats (admin)
export const getPPVStats = query({
    handler: async (ctx) => {
        const purchases = await ctx.db.query("ppv_purchases").collect();
        const now = Date.now();

        const totalPurchases = purchases.length;
        const activePurchases = purchases.filter((p) => p.expiresAt > now).length;
        const paidPurchases = purchases.filter((p) => p.accessType === "paid").length;
        const adSupportedPurchases = purchases.filter((p) => p.accessType === "ad_supported").length;
        const totalRevenue = purchases
            .filter((p) => p.accessType === "paid")
            .reduce((sum, p) => sum + p.price, 0);

        return {
            totalPurchases,
            activePurchases,
            paidPurchases,
            adSupportedPurchases,
            totalRevenue,
        };
    },
});

// ============================================
// MUTATIONS
// ============================================

// Create/Update PPV content config (admin)
export const upsertPPVContent = mutation({
    args: {
        id: v.optional(v.id("ppv_content")),
        contentType: v.union(v.literal("match"), v.literal("movie")),
        contentId: v.string(),
        title: v.string(),
        price: v.number(),
        adSupportedEnabled: v.boolean(),
        minAdsRequired: v.number(),
        accessDuration: v.number(),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        if (args.id) {
            await ctx.db.patch(args.id, {
                title: args.title,
                price: args.price,
                adSupportedEnabled: args.adSupportedEnabled,
                minAdsRequired: args.minAdsRequired,
                accessDuration: args.accessDuration,
                isActive: args.isActive,
                updatedAt: now,
            });
            return args.id;
        } else {
            const existing = await ctx.db
                .query("ppv_content")
                .withIndex("by_content", (q) =>
                    q.eq("contentType", args.contentType).eq("contentId", args.contentId)
                )
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, {
                    title: args.title,
                    price: args.price,
                    adSupportedEnabled: args.adSupportedEnabled,
                    minAdsRequired: args.minAdsRequired,
                    accessDuration: args.accessDuration,
                    isActive: args.isActive,
                    updatedAt: now,
                });
                return existing._id;
            }

            return await ctx.db.insert("ppv_content", {
                contentType: args.contentType,
                contentId: args.contentId,
                title: args.title,
                price: args.price,
                adSupportedEnabled: args.adSupportedEnabled,
                minAdsRequired: args.minAdsRequired,
                accessDuration: args.accessDuration,
                isActive: args.isActive,
                createdAt: now,
                updatedAt: now,
            });
        }
    },
});

// Delete PPV content config (admin)
export const deletePPVContent = mutation({
    args: { id: v.id("ppv_content") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Record ad watch for PPV unlock
export const recordAdWatch = mutation({
    args: {
        userId: v.id("users"),
        deviceId: v.string(),
        contentType: v.union(v.literal("match"), v.literal("movie")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("ad_impressions", {
            userId: args.userId,
            deviceId: args.deviceId,
            adType: "ppv_unlock",
            adSlot: "ppv_preroll",
            pageType: args.contentType,
            contentId: args.contentId,
            timestamp: Date.now(),
        });

        const existing = await ctx.db
            .query("ppv_purchases")
            .withIndex("by_user_content", (q) =>
                q
                    .eq("userId", args.userId)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        const ppvConfig = await ctx.db
            .query("ppv_content")
            .withIndex("by_content", (q) =>
                q.eq("contentType", args.contentType).eq("contentId", args.contentId)
            )
            .first();

        if (!ppvConfig) {
            return { success: false, error: "PPV config not found" };
        }

        const adsWatched = (existing?.adsWatched || 0) + 1;
        const isUnlocked = adsWatched >= ppvConfig.minAdsRequired;

        if (existing) {
            await ctx.db.patch(existing._id, {
                adsWatched,
                expiresAt: isUnlocked
                    ? Date.now() + ppvConfig.accessDuration * 60 * 60 * 1000
                    : 0,
            });
        } else {
            await ctx.db.insert("ppv_purchases", {
                userId: args.userId,
                contentType: args.contentType,
                contentId: args.contentId,
                ppvContentId: ppvConfig._id,
                price: 0,
                accessType: "ad_supported",
                adsWatched,
                expiresAt: isUnlocked
                    ? Date.now() + ppvConfig.accessDuration * 60 * 60 * 1000
                    : 0,
                createdAt: Date.now(),
            });
        }

        return {
            success: true,
            adsWatched,
            adsRequired: ppvConfig.minAdsRequired,
            isUnlocked,
        };
    },
});

// Create paid PPV purchase
export const createPaidPurchase = mutation({
    args: {
        userId: v.id("users"),
        contentType: v.union(v.literal("match"), v.literal("movie")),
        contentId: v.string(),
    },
    handler: async (ctx, args) => {
        const ppvConfig = await ctx.db
            .query("ppv_content")
            .withIndex("by_content", (q) =>
                q.eq("contentType", args.contentType).eq("contentId", args.contentId)
            )
            .first();

        if (!ppvConfig) {
            return { success: false, error: "PPV config not found" };
        }

        const existing = await ctx.db
            .query("ppv_purchases")
            .withIndex("by_user_content", (q) =>
                q
                    .eq("userId", args.userId)
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .first();

        const expiresAt = Date.now() + ppvConfig.accessDuration * 60 * 60 * 1000;

        if (existing) {
            await ctx.db.patch(existing._id, {
                accessType: "paid",
                price: ppvConfig.price,
                expiresAt,
            });
        } else {
            await ctx.db.insert("ppv_purchases", {
                userId: args.userId,
                contentType: args.contentType,
                contentId: args.contentId,
                ppvContentId: ppvConfig._id,
                price: ppvConfig.price,
                accessType: "paid",
                adsWatched: 0,
                expiresAt,
                createdAt: Date.now(),
            });
        }

        return {
            success: true,
            expiresAt,
            accessDuration: ppvConfig.accessDuration,
        };
    },
});

// Track ad impression
export const trackAdImpression = mutation({
    args: {
        userId: v.optional(v.id("users")),
        deviceId: v.string(),
        adType: v.union(
            v.literal("interstitial"),
            v.literal("banner"),
            v.literal("midroll"),
            v.literal("preroll"),
            v.literal("ppv_unlock")
        ),
        adSlot: v.string(),
        pageType: v.string(),
        contentId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("ad_impressions", {
            userId: args.userId,
            deviceId: args.deviceId,
            adType: args.adType,
            adSlot: args.adSlot,
            pageType: args.pageType,
            contentId: args.contentId,
            timestamp: Date.now(),
        });
    },
});
