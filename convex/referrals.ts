import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// AB-27: REFERRAL ANALYTICS
// ============================================

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
