import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const listAds = query({
    handler: async (ctx) => {
        return await ctx.db.query("ads").collect();
    },
});

export const getAdBySlot = query({
    args: { slotKey: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("ads")
            .withIndex("by_slot", (q) => q.eq("slotKey", args.slotKey))
            .first();
    },
});

export const getAdsForPage = query({
    args: { page: v.string() },
    handler: async (ctx, args) => {
        const ads = await ctx.db.query("ads").collect();
        return ads.filter((ad) => ad.enabled && ad.showOn.includes(args.page));
    },
});

// ============================================
// MUTATIONS
// ============================================

export const createAd = mutation({
    args: {
        slotKey: v.string(),
        network: v.union(
            v.literal("adsense"),
            v.literal("adsterra"),
            v.literal("monetag"),
            v.literal("custom"),
            v.literal("vast"),
            v.literal("video"),
            v.literal("popup"),
            v.literal("ppv")
        ),
        format: v.union(
            v.literal("responsive"),
            v.literal("banner"),
            v.literal("native"),
            v.literal("interstitial"),
            v.literal("video_preroll"),
            v.literal("video_midroll"),
            v.literal("popunder"),
            v.literal("social_bar")
        ),
        // General
        codeHtml: v.optional(v.string()),
        // AdSense
        adsenseClient: v.optional(v.string()),
        adsenseSlot: v.optional(v.string()),
        // Adsterra
        adsterraKey: v.optional(v.string()),
        adsterraDomain: v.optional(v.string()),
        // VAST/VPAID
        vastUrl: v.optional(v.string()),
        vpaidEnabled: v.optional(v.boolean()),
        // Video Ad
        videoUrl: v.optional(v.string()),
        videoSkipAfter: v.optional(v.number()),
        videoDuration: v.optional(v.number()),
        // Popup/Popunder
        popupUrl: v.optional(v.string()),
        popupWidth: v.optional(v.number()),
        popupHeight: v.optional(v.number()),
        // Monetag
        monetagId: v.optional(v.string()),
        // Display
        showOn: v.array(v.string()),
        enabled: v.boolean(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("ads", args);
    },
});

export const updateAd = mutation({
    args: {
        id: v.id("ads"),
        slotKey: v.optional(v.string()),
        network: v.optional(
            v.union(
                v.literal("adsense"),
                v.literal("adsterra"),
                v.literal("monetag"),
                v.literal("custom"),
                v.literal("vast"),
                v.literal("video"),
                v.literal("popup"),
                v.literal("ppv")
            )
        ),
        format: v.optional(
            v.union(
                v.literal("responsive"),
                v.literal("banner"),
                v.literal("native"),
                v.literal("interstitial"),
                v.literal("video_preroll"),
                v.literal("video_midroll"),
                v.literal("popunder"),
                v.literal("social_bar")
            )
        ),
        // General
        codeHtml: v.optional(v.string()),
        // AdSense
        adsenseClient: v.optional(v.string()),
        adsenseSlot: v.optional(v.string()),
        // Adsterra
        adsterraKey: v.optional(v.string()),
        adsterraDomain: v.optional(v.string()),
        // VAST/VPAID
        vastUrl: v.optional(v.string()),
        vpaidEnabled: v.optional(v.boolean()),
        // Video Ad
        videoUrl: v.optional(v.string()),
        videoSkipAfter: v.optional(v.number()),
        videoDuration: v.optional(v.number()),
        // Popup/Popunder
        popupUrl: v.optional(v.string()),
        popupWidth: v.optional(v.number()),
        popupHeight: v.optional(v.number()),
        // Monetag
        monetagId: v.optional(v.string()),
        // Display
        showOn: v.optional(v.array(v.string())),
        enabled: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const deleteAd = mutation({
    args: { id: v.id("ads") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const toggleAd = mutation({
    args: { id: v.id("ads") },
    handler: async (ctx, args) => {
        const ad = await ctx.db.get(args.id);
        if (ad) {
            await ctx.db.patch(args.id, { enabled: !ad.enabled });
        }
    },
});

// Seed default ad slots
export const seedAds = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("ads").first();
        if (existing) return "already_seeded";

        const defaultSlots = [
            { slotKey: "home_top", showOn: ["home"], format: "responsive" as const },
            { slotKey: "home_middle", showOn: ["home"], format: "banner" as const },
            { slotKey: "match_below_player", showOn: ["match"], format: "responsive" as const },
            { slotKey: "match_sidebar", showOn: ["match"], format: "banner" as const },
            { slotKey: "blog_in_content_1", showOn: ["blog"], format: "native" as const },
            { slotKey: "blog_in_content_2", showOn: ["blog"], format: "native" as const },
            { slotKey: "archive_sidebar", showOn: ["archive", "blog"], format: "banner" as const },
        ];

        for (const slot of defaultSlots) {
            await ctx.db.insert("ads", {
                ...slot,
                network: "custom",
                enabled: false,
            });
        }

        return "seeded";
    },
});
