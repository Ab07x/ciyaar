import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// REFERRAL SYSTEM (Core + Analytics)
// ============================================

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// --------------------------------------------
// Core Functions (for ReferralCard.tsx)
// --------------------------------------------

export const createReferralCode = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");
        if (user.referralCode) return user.referralCode;

        let code = generateReferralCode();
        // Simple collision check (could be better)
        const existing = await ctx.db
            .query("users")
            .withIndex("by_referral_code", (q) => q.eq("referralCode", code))
            .first();

        if (existing) code = generateReferralCode(); // Try once more

        await ctx.db.patch(args.userId, {
            referralCode: code,
            referralCount: 0,
            referralEarnings: 0,
        });

        return code;
    },
});

export const getStats = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        // If analytics are used, sync them?
        // For now, rely on user fields
        return {
            code: user.referralCode,
            count: user.referralCount || 0,
            earnings: user.referralEarnings || 0,
        };
    },
});

export const getLeaderboard = query({
    args: {
        limit: v.number(),
    },
    handler: async (ctx, args) => {
        // This is inefficient if many users, but fine for now
        // Ideally should have an index on referralCount
        // Currently schema doesn't have index on referralCount, only referralCode.
        // We might need to index referralCount in schema for scalability.
        // For now, fetch all users with referralCount > 0
        const users = await ctx.db.query("users").collect();
        const referrers = users.filter(u => (u.referralCount || 0) > 0);

        referrers.sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));

        return referrers.slice(0, args.limit).map(u => ({
            userId: u._id,
            name: u.displayName || u.phoneOrId || "User",
            count: u.referralCount || 0
        }));
    },
});

export const redeemReferral = mutation({
    args: {
        userId: v.id("users"),
        code: v.string(),
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");
        if (user.referredBy) return { success: false, message: "Horey ayaa laguu casuumay" };

        // Find referrer
        const referrer = await ctx.db
            .query("users")
            .withIndex("by_referral_code", (q) => q.eq("referralCode", args.code.toUpperCase()))
            .first();

        if (!referrer) return { success: false, message: "Code-kan ma jiro" };
        if (referrer._id === user._id) return { success: false, message: "Isma casuumi kartid!" };

        // Mark as referred
        await ctx.db.patch(user._id, {
            referredBy: referrer._id,
            isReferralCredited: false, // Credit happens when they subscribe/pay usually? Or just free trial extension?
        });

        // Credit referrer (e.g. +7 days free premium or similar reward)
        // For now, just increment count
        await ctx.db.patch(referrer._id, {
            referralCount: (referrer.referralCount || 0) + 1,
            referralEarnings: (referrer.referralEarnings || 0) + 7, // 7 days reward
        });

        // Mark user as having used a referral (maybe give them 3 days?)
        // Example logic:
        const currentTrial = user.trialExpiresAt || Date.now();
        await ctx.db.patch(user._id, {
            trialExpiresAt: currentTrial + (3 * 24 * 60 * 60 * 1000), // +3 days
        });

        return { success: true, message: "Hambalyo! Waxaad heshay 3 maalmood oo dheeraad ah." };
    },
});

// --------------------------------------------
// Analytical Functions (AB-27)
// --------------------------------------------

/**
 * Track a referral link click (before signup)
 */
export const trackReferralClick = mutation({
    args: {
        referralCode: v.string(),
        deviceId: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Find the referrer
        const referrer = await ctx.db
            .query("users")
            .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode))
            .first();

        await ctx.db.insert("referral_clicks", {
            referralCode: args.referralCode,
            referrerId: referrer?._id,
            deviceId: args.deviceId,
            userAgent: args.userAgent,
            converted: false,
            createdAt: Date.now(),
        });

        return { tracked: true };
    },
});

/**
 * Mark a referral click as converted (when user signs up)
 */
export const markReferralConverted = mutation({
    args: {
        referralCode: v.string(),
        deviceId: v.string(),
        newUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Find the unconverted click for this device
        const click = await ctx.db
            .query("referral_clicks")
            .withIndex("by_code", (q) => q.eq("referralCode", args.referralCode))
            .filter((q) => q.eq(q.field("deviceId"), args.deviceId))
            .filter((q) => q.eq(q.field("converted"), false))
            .first();

        if (click) {
            await ctx.db.patch(click._id, {
                converted: true,
                convertedUserId: args.newUserId,
            });
        }

        return { converted: !!click };
    },
});

/**
 * Get referral analytics for a user
 */
export const getReferralAnalytics = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user?.referralCode) return null;

        const clicks = await ctx.db
            .query("referral_clicks")
            .withIndex("by_code", (q) => q.eq("referralCode", user.referralCode!))
            .collect();

        const totalClicks = clicks.length;
        const conversions = clicks.filter((c) => c.converted).length;
        const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : "0";

        // Last 7 days breakdown
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const recentClicks = clicks.filter((c) => c.createdAt >= sevenDaysAgo);

        return {
            referralCode: user.referralCode,
            totalClicks,
            conversions,
            conversionRate: `${conversionRate}%`,
            referralEarnings: user.referralEarnings || 0,
            last7Days: {
                clicks: recentClicks.length,
                conversions: recentClicks.filter((c) => c.converted).length,
            },
        };
    },
});

/**
 * Get global referral stats (admin)
 */
export const getGlobalReferralStats = query({
    args: {},
    handler: async (ctx) => {
        const allClicks = await ctx.db.query("referral_clicks").collect();

        const totalClicks = allClicks.length;
        const conversions = allClicks.filter((c) => c.converted).length;
        const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : "0";

        // Top referrers
        const referrerCounts: Record<string, { clicks: number; conversions: number }> = {};
        for (const click of allClicks) {
            const code = click.referralCode;
            if (!referrerCounts[code]) {
                referrerCounts[code] = { clicks: 0, conversions: 0 };
            }
            referrerCounts[code].clicks++;
            if (click.converted) {
                referrerCounts[code].conversions++;
            }
        }

        const topReferrers = Object.entries(referrerCounts)
            .map(([code, stats]) => ({ code, ...stats }))
            .sort((a, b) => b.conversions - a.conversions)
            .slice(0, 10);

        return {
            totalClicks,
            conversions,
            conversionRate: `${conversionRate}%`,
            topReferrers,
        };
    },
});
