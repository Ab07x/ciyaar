import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const getSettings = query({
    handler: async (ctx) => {
        const settings = await ctx.db.query("settings").first();
        if (!settings) {
            // Return defaults if no settings exist
            return {
                whatsappNumber: "+252",
                siteName: "Fanbroj",
                adsEnabled: false,
                priceMatch: 0.2,
                priceWeekly: 1,
                priceMonthly: 3.5,
                priceYearly: 11,
                maxDevicesMatch: 1,
                maxDevicesWeekly: 2,
                maxDevicesMonthly: 3,
                maxDevicesYearly: 5,
            };
        }
        return settings;
    },
});

// ============================================
// MUTATIONS
// ============================================

export const updateSettings = mutation({
    args: {
        whatsappNumber: v.optional(v.string()),
        siteName: v.optional(v.string()),
        adsEnabled: v.optional(v.boolean()),
        priceMatch: v.optional(v.number()),
        priceWeekly: v.optional(v.number()),
        priceMonthly: v.optional(v.number()),
        priceYearly: v.optional(v.number()),
        maxDevicesMatch: v.optional(v.number()),
        maxDevicesWeekly: v.optional(v.number()),
        maxDevicesMonthly: v.optional(v.number()),
        maxDevicesYearly: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("settings").first();

        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("settings", {
                whatsappNumber: args.whatsappNumber || "+252",
                siteName: args.siteName || "Fanbroj",
                adsEnabled: args.adsEnabled ?? false,
                priceMatch: args.priceMatch ?? 0.2,
                priceWeekly: args.priceWeekly ?? 1,
                priceMonthly: args.priceMonthly ?? 3.5,
                priceYearly: args.priceYearly ?? 11,
                maxDevicesMatch: args.maxDevicesMatch ?? 1,
                maxDevicesWeekly: args.maxDevicesWeekly ?? 2,
                maxDevicesMonthly: args.maxDevicesMonthly ?? 3,
                maxDevicesYearly: args.maxDevicesYearly ?? 5,
            });
        }
    },
});

export const seedSettings = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("settings").first();
        if (existing) return "already_exists";

        await ctx.db.insert("settings", {
            whatsappNumber: "+252618274188",
            siteName: "Fanbroj",
            adsEnabled: false,
            priceMatch: 0.2,
            priceWeekly: 1,
            priceMonthly: 3.5,
            priceYearly: 11,
            maxDevicesMatch: 1,
            maxDevicesWeekly: 2,
            maxDevicesMonthly: 3,
            maxDevicesYearly: 5,
        });

        return "seeded";
    },
});
