import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const getActiveBanner = query({
    args: { type: v.union(v.literal("main"), v.literal("small"), v.literal("popup"), v.literal("interstitial")) },
    handler: async (ctx, { type }) => {
        const now = Date.now();

        // Get all banners and filter
        const allBanners = await ctx.db.query("promo_banners").collect();

        // Filter by type, active status, and date range
        const validBanners = allBanners
            .filter((b) => b.type === type && b.isActive === true)
            .filter((b) => {
                if (b.startDate && now < b.startDate) return false;
                if (b.endDate && now > b.endDate) return false;
                return true;
            })
            .sort((a, b) => b.priority - a.priority);

        return validBanners[0] || null;
    },
});

export const getAllBanners = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("promo_banners")
            .order("desc")
            .collect();
    },
});

export const getBannerById = query({
    args: { id: v.id("promo_banners") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

// ============================================
// MUTATIONS
// ============================================

export const createBanner = mutation({
    args: {
        name: v.string(),
        type: v.union(v.literal("main"), v.literal("small"), v.literal("popup"), v.literal("interstitial")),
        headline: v.string(),
        subheadline: v.optional(v.string()),
        ctaText: v.string(),
        ctaLink: v.string(),
        leftImageUrl: v.optional(v.string()),
        rightImageUrl: v.optional(v.string()),
        backgroundImageUrl: v.optional(v.string()),
        backgroundColor: v.optional(v.string()),
        accentColor: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        isActive: v.boolean(),
        priority: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("promo_banners", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateBanner = mutation({
    args: {
        id: v.id("promo_banners"),
        name: v.optional(v.string()),
        type: v.optional(v.union(v.literal("main"), v.literal("small"), v.literal("popup"), v.literal("interstitial"))),
        headline: v.optional(v.string()),
        subheadline: v.optional(v.string()),
        ctaText: v.optional(v.string()),
        ctaLink: v.optional(v.string()),
        leftImageUrl: v.optional(v.string()),
        rightImageUrl: v.optional(v.string()),
        backgroundImageUrl: v.optional(v.string()),
        backgroundColor: v.optional(v.string()),
        accentColor: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
        priority: v.optional(v.number()),
    },
    handler: async (ctx, { id, ...args }) => {
        const existing = await ctx.db.get(id);
        if (!existing) throw new Error("Banner not found");

        // Filter out undefined values
        const updates: Record<string, any> = { updatedAt: Date.now() };
        Object.entries(args).forEach(([key, value]) => {
            if (value !== undefined) updates[key] = value;
        });

        await ctx.db.patch(id, updates);
    },
});

export const deleteBanner = mutation({
    args: { id: v.id("promo_banners") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});

export const seedDefaultBanner = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("promo_banners").first();
        if (existing) return "already_exists";

        const now = Date.now();

        // Create default main banner
        await ctx.db.insert("promo_banners", {
            name: "Default Premium Banner",
            type: "main",
            headline: "Ads suck but keep the site free.",
            subheadline: "Remove ads and get many features with Premium Membership",
            ctaText: "CHECK OPTIONS",
            ctaLink: "/pricing",
            leftImageUrl: "/img/dragon-left.png",
            rightImageUrl: "/img/right-cartoons.png",
            backgroundColor: "#1a3a5c",
            accentColor: "#9AE600",
            isActive: true,
            priority: 1,
            createdAt: now,
            updatedAt: now,
        });

        return "seeded";
    },
});

export const seedBannerByType = mutation({
    args: { type: v.union(v.literal("main"), v.literal("small"), v.literal("popup"), v.literal("interstitial")) },
    handler: async (ctx, { type }) => {
        const now = Date.now();

        const bannerDefaults: Record<string, {
            name: string;
            headline: string;
            subheadline: string;
            ctaText: string;
            ctaLink: string;
            leftImageUrl?: string;
            rightImageUrl?: string;
            backgroundImageUrl?: string;
            backgroundColor: string;
            accentColor: string;
        }> = {
            main: {
                name: "Default Main Banner",
                headline: "Ads suck but keep the site free.",
                subheadline: "Remove ads and get many features with Premium Membership",
                ctaText: "CHECK OPTIONS",
                ctaLink: "/pricing",
                leftImageUrl: "/img/dragon-left.png",
                rightImageUrl: "/img/right-cartoons.png",
                backgroundColor: "#1a3a5c",
                accentColor: "#9AE600",
            },
            small: {
                name: "Default Small Banner",
                headline: "Go Premium!",
                subheadline: "Unlock exclusive features and ad-free experience",
                ctaText: "UPGRADE NOW",
                ctaLink: "/pricing",
                leftImageUrl: "/img/dragon-left.png",
                backgroundColor: "#2a1a4c",
                accentColor: "#FFD700",
            },
            popup: {
                name: "Default Popup Banner",
                headline: "Qaybtan Waxaa loogu talagalay Macaamiisha",
                subheadline: "Markaad ku biirto Premium, waxaad heleysaa waxyaabo gaar ah, adigoo sidoo kale naga taageeraya in website-ka uu sii shaqeeyo.",
                ctaText: "EEG NOOCYADA",
                ctaLink: "/pricing",
                leftImageUrl: "/premium-ad/movie-celebraty-min.png",
                backgroundImageUrl: "", // No bg image for this specific clean design, just purple color
                backgroundColor: "#2D2640", // Dark purple from the Yoda image
                accentColor: "#FF8F8F", // Pinkish/Salmon color for button
            },
            interstitial: {
                name: "Default Interstitial",
                headline: "Premium",
                subheadline: "Membership ?",
                ctaText: "CHECK OUR PLANS",
                ctaLink: "/pricing",
                leftImageUrl: "/premium-ad/movie-celebraty-min.png",
                backgroundImageUrl: "/premium-ad/premium-bg.png",
                backgroundColor: "#000000",
                accentColor: "#9AE600",
            },
        };

        const defaults = bannerDefaults[type];

        const id = await ctx.db.insert("promo_banners", {
            ...defaults,
            type,
            isActive: true,
            priority: 1,
            createdAt: now,
            updatedAt: now,
        });

        return id;
    },
});
