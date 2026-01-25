import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// AB-13: GIFT SUBSCRIPTIONS
// ============================================

const GIFT_PLANS = {
    monthly: { durationDays: 30, maxDevices: 3 },
    "3month": { durationDays: 90, maxDevices: 3 },
    yearly: { durationDays: 365, maxDevices: 5 },
};

function generateGiftCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "GIFT-";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Create a gift code (after WhatsApp payment)
 */
export const createGiftCode = mutation({
    args: {
        purchaserId: v.id("users"),
        purchaserDeviceId: v.optional(v.string()),
        plan: v.union(v.literal("monthly"), v.literal("3month"), v.literal("yearly")),
        recipientName: v.optional(v.string()),
        senderMessage: v.optional(v.string()),
        occasion: v.optional(v.union(
            v.literal("ramadan"),
            v.literal("eid"),
            v.literal("birthday"),
            v.literal("general")
        )),
    },
    handler: async (ctx, args) => {
        const planConfig = GIFT_PLANS[args.plan];
        const code = generateGiftCode();

        // Gift code expires in 90 days if not redeemed
        const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;

        await ctx.db.insert("gift_codes", {
            code,
            purchaserId: args.purchaserId,
            purchaserDeviceId: args.purchaserDeviceId,
            plan: args.plan,
            durationDays: planConfig.durationDays,
            maxDevices: planConfig.maxDevices,
            recipientName: args.recipientName,
            senderMessage: args.senderMessage,
            occasion: args.occasion || "general",
            expiresAt,
            createdAt: Date.now(),
        });

        return { code, expiresAt };
    },
});

/**
 * Redeem a gift code
 */
export const redeemGiftCode = mutation({
    args: {
        code: v.string(),
        recipientId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const gift = await ctx.db
            .query("gift_codes")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .first();

        if (!gift) {
            return { success: false, error: "Code-kan ma jiro" };
        }

        if (gift.redeemedAt) {
            return { success: false, error: "Code-kan horey ayaa loo isticmaalay" };
        }

        if (gift.expiresAt < Date.now()) {
            return { success: false, error: "Code-kan wuu dhacay (expired)" };
        }

        // Mark as redeemed
        await ctx.db.patch(gift._id, {
            recipientId: args.recipientId,
            redeemedAt: Date.now(),
        });

        // Create subscription for recipient
        const expiresAt = Date.now() + gift.durationDays * 24 * 60 * 60 * 1000;

        await ctx.db.insert("subscriptions", {
            userId: args.recipientId,
            plan: gift.plan === "3month" ? "monthly" : gift.plan, // Map to valid plan type
            expiresAt,
            maxDevices: gift.maxDevices,
            status: "active",
            createdAt: Date.now(),
        });

        // Get purchaser name for message
        const purchaser = await ctx.db.get(gift.purchaserId);

        return {
            success: true,
            message: `Hadiyad! Waxaad heshay ${gift.durationDays} maalmood Premium!`,
            giftDetails: {
                senderMessage: gift.senderMessage,
                occasion: gift.occasion,
                durationDays: gift.durationDays,
            },
        };
    },
});

/**
 * Get gift codes purchased by a user
 */
export const getMyGifts = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const gifts = await ctx.db
            .query("gift_codes")
            .withIndex("by_purchaser", (q) => q.eq("purchaserId", args.userId))
            .order("desc")
            .collect();

        return gifts.map((g) => ({
            code: g.code,
            plan: g.plan,
            recipientName: g.recipientName,
            occasion: g.occasion,
            isRedeemed: !!g.redeemedAt,
            redeemedAt: g.redeemedAt,
            expiresAt: g.expiresAt,
            createdAt: g.createdAt,
        }));
    },
});

/**
 * Get gift details by code (for preview before redeeming)
 */
export const getGiftByCode = query({
    args: {
        code: v.string(),
    },
    handler: async (ctx, args) => {
        const gift = await ctx.db
            .query("gift_codes")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .first();

        if (!gift) return null;

        return {
            code: gift.code,
            plan: gift.plan,
            durationDays: gift.durationDays,
            senderMessage: gift.senderMessage,
            occasion: gift.occasion,
            recipientName: gift.recipientName,
            isRedeemed: !!gift.redeemedAt,
            isExpired: gift.expiresAt < Date.now(),
        };
    },
});

/**
 * Admin: Generate gift codes in bulk
 */
export const generateBulkGiftCodes = mutation({
    args: {
        adminPass: v.string(),
        plan: v.union(v.literal("monthly"), v.literal("3month"), v.literal("yearly")),
        count: v.number(),
        occasion: v.optional(v.union(
            v.literal("ramadan"),
            v.literal("eid"),
            v.literal("birthday"),
            v.literal("general")
        )),
    },
    handler: async (ctx, args) => {
        // Verify admin
        const settings = await ctx.db.query("settings").first();
        if (!settings || settings.adminPassword !== args.adminPass) {
            throw new Error("Unauthorized");
        }

        const planConfig = GIFT_PLANS[args.plan];
        const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;
        const codes: string[] = [];

        // Get a system user for bulk generation (first user or create placeholder)
        const systemUser = await ctx.db.query("users").first();
        if (!systemUser) throw new Error("No users exist");

        for (let i = 0; i < args.count; i++) {
            const code = generateGiftCode();
            codes.push(code);

            await ctx.db.insert("gift_codes", {
                code,
                purchaserId: systemUser._id, // System-generated
                plan: args.plan,
                durationDays: planConfig.durationDays,
                maxDevices: planConfig.maxDevices,
                occasion: args.occasion || "general",
                expiresAt,
                createdAt: Date.now(),
            });
        }

        return { codes };
    },
});
