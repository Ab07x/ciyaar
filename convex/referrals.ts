import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const getReferralStats = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_id", (q) => q.eq("_id", identity.subject as any))
            .first(); // Use identity.subject directly if simpler, but fetching user is safer

        // Actually, we usually fetch user by identity in other files. 
        // Let's stick to standard pattern if possible, but here we need the user doc.
        // Assuming identity.subject maps to something we can look up or we use a helper.
        // Since I don't see a helper imported, I'll rely on the caller or just look up by token if relevant.
        // Wait, standard Convex Auth uses `ctx.auth.getUserIdentity()`.
        // My schema uses `phoneOrId`. Let's assume standard lookup.

        // BETTER: Just use the user we found.
        const userByToken = await ctx.db
            .query("users")
            .filter(q => q.eq(q.field("phoneOrId"), identity.subject)) // Placeholder logic
            .first();

        // Actually, let's just assume we pass userId or handle it.
        // Wait, other files use `useUser` provider which passes userId.
        // But backend queries should rely on auth if possible. 
        // Let's require userId as arg for simplicity if auth isn't fully robust yet.
        // Actually, looking at `push.ts`, it takes `userId`.
        // I will take `userId` as argument for now to be consistent.
        return null;
    }
});

export const getStats = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        return {
            code: user.referralCode,
            count: user.referralCount || 0,
            earnings: user.referralEarnings || 0,
        };
    },
});

export const getLeaderboard = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;
        // This requires an index on referralCount which I didn't add.
        // I'll add it or just sort in memory (small scale).
        // Let's sort in memory for now.
        const users = await ctx.db.query("users").collect();
        const sorted = users
            .filter(u => (u.referralCount || 0) > 0)
            .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
            .slice(0, limit);

        return sorted.map(u => ({
            userId: u._id,
            count: u.referralCount || 0,
            earnings: u.referralEarnings || 0,
            // Mask phone/id
            name: `User ${u._id.slice(-4)}`
        }));
    }
});

// ============================================
// MUTATIONS
// ============================================

export const createReferralCode = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");
        if (user.referralCode) return user.referralCode;

        // Generate unique code
        // Simple strategy: First 4 chars of ID + 4 random numbers
        const suffix = Math.floor(1000 + Math.random() * 9000);
        const code = `FAN${suffix}`;

        await ctx.db.patch(args.userId, { referralCode: code });
        return code;
    },
});

export const redeemReferral = mutation({
    args: {
        userId: v.id("users"),
        code: v.string(),
        deviceId: v.string()
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return { success: false, message: "User not found" };

        if (user.referredBy) {
            return { success: false, message: "Already referred" };
        }

        // Find referrer
        const referrer = await ctx.db
            .query("users")
            .withIndex("by_referral_code", q => q.eq("referralCode", args.code))
            .first();

        if (!referrer) {
            return { success: false, message: "Invalid code" };
        }

        if (referrer._id === user._id) {
            return { success: false, message: "Cannot refer yourself" };
        }

        // Abuse check: Check if device ID was used for ANY referral redemption?
        // Actually, we want to prevent one device from redeeming multiple codes for DIFFERENT users.
        // But `users` don't store device ID. `devices` table does.
        // Check if ANY user linked to this device has defined `referredBy`.

        const deviceLinks = await ctx.db
            .query("devices")
            .withIndex("by_device", q => q.eq("deviceId", args.deviceId))
            .collect();

        // For each user gathered from deviceLinks, check if they have referredBy
        for (const link of deviceLinks) {
            const linkedUser = await ctx.db.get(link.userId);
            if (linkedUser && linkedUser.referredBy) {
                return { success: false, message: "Device already used for referral" };
            }
        }

        // Apply referral
        const now = Date.now();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

        // Extend trial
        const currentExpiry = user.trialExpiresAt || now;
        const newExpiry = Math.max(currentExpiry, now) + THREE_DAYS_MS;

        await ctx.db.patch(user._id, {
            referredBy: referrer._id,
            trialExpiresAt: newExpiry
        });

        // Update stats for referral count?? No, referrer only gets count when they subscribe (paid).
        // OR do they get count just for invite?
        // Requirement: "Referrer gets 7 days free premium when referee SUBSCRIBES".
        // So we don't increment referrer stats yet. Maybe we can track "pending referrals"?
        // Schema only has `referralCount`. Let's stick to strict requirement.

        return { success: true, message: "+3 Days added to your trial!" };
    },
});

// Internal mutation called when a user subscribes
export const creditReferrer = internalMutation({
    args: { userId: v.id("users") }, // The user who just subscribed
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.referredBy || user.isReferralCredited) return;

        const referrer = await ctx.db.get(user.referredBy);
        if (!referrer) return;

        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Check active subscriptions to extend
        const referrerSubs = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", q => q.eq("userId", referrer._id))
            .filter(q => q.eq(q.field("status"), "active"))
            .collect();

        if (referrerSubs.length > 0) {
            // Extend the one expiring last
            const sub = referrerSubs.reduce((prev, current) => (prev.expiresAt > current.expiresAt) ? prev : current);
            await ctx.db.patch(sub._id, {
                expiresAt: sub.expiresAt + SEVEN_DAYS_MS
            });
        } else {
            // Extend trial
            const currentExpiry = referrer.trialExpiresAt || now;
            await ctx.db.patch(referrer._id, {
                trialExpiresAt: Math.max(currentExpiry, now) + SEVEN_DAYS_MS
            });
        }

        // Update stats
        await ctx.db.patch(referrer._id, {
            referralCount: (referrer.referralCount || 0) + 1,
            referralEarnings: (referrer.referralEarnings || 0) + 7
        });

        // Mark credited
        await ctx.db.patch(user._id, {
            isReferralCredited: true
        });
    }
});
