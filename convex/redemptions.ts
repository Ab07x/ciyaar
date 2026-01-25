import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================
// QUERIES
// ============================================

export const listCodes = query({
    args: {
        plan: v.optional(
            v.union(
                v.literal("match"),
                v.literal("weekly"),
                v.literal("monthly"),
                v.literal("yearly")
            )
        ),
        used: v.optional(v.boolean()),
        revoked: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let codes = await ctx.db.query("redemptions").order("desc").collect();

        if (args.plan) {
            codes = codes.filter((c) => c.plan === args.plan);
        }
        if (args.used !== undefined) {
            codes = codes.filter((c) =>
                args.used ? c.usedByUserId !== undefined : c.usedByUserId === undefined
            );
        }
        if (args.revoked !== undefined) {
            codes = codes.filter((c) =>
                args.revoked ? c.revokedAt !== undefined : c.revokedAt === undefined
            );
        }

        return args.limit ? codes.slice(0, args.limit) : codes;
    },
});

export const getCodeByCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("redemptions")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();
    },
});

export const getCodeStats = query({
    handler: async (ctx) => {
        const codes = await ctx.db.query("redemptions").collect();

        const total = codes.length;
        const used = codes.filter((c) => c.usedByUserId).length;
        const revoked = codes.filter((c) => c.revokedAt).length;
        const available = codes.filter((c) => !c.usedByUserId && !c.revokedAt).length;

        const byPlan = {
            match: codes.filter((c) => c.plan === "match").length,
            weekly: codes.filter((c) => c.plan === "weekly").length,
            monthly: codes.filter((c) => c.plan === "monthly").length,
            yearly: codes.filter((c) => c.plan === "yearly").length,
        };

        return { total, used, revoked, available, byPlan };
    },
});

// ============================================
// MUTATIONS
// ============================================

// Generate random code
function generateCode(length: number = 8): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Calculate code expiration time based on plan type
function getCodeExpirationMs(plan: string): number {
    const MS_PER_HOUR = 60 * 60 * 1000;
    const MS_PER_DAY = 24 * MS_PER_HOUR;

    switch (plan) {
        case "match": return MS_PER_HOUR * 24; // 24 hours
        case "weekly": return MS_PER_DAY * 7;   // 7 days
        case "monthly": return MS_PER_DAY * 30; // 30 days
        case "yearly": return MS_PER_DAY * 365; // 365 days
        default: return MS_PER_DAY * 30;
    }
}

export const generateCodes = mutation({
    args: {
        plan: v.union(
            v.literal("match"),
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("yearly")
        ),
        count: v.number(),
        durationDays: v.number(),
        maxDevices: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const generatedCodes: string[] = [];

        for (let i = 0; i < args.count; i++) {
            let code: string;
            let attempts = 0;

            // Ensure unique code
            do {
                code = generateCode();
                const existing = await ctx.db
                    .query("redemptions")
                    .withIndex("by_code", (q) => q.eq("code", code))
                    .first();
                if (!existing) break;
                attempts++;
            } while (attempts < 10);

            const expiresAt = now + getCodeExpirationMs(args.plan);

            await ctx.db.insert("redemptions", {
                code,
                plan: args.plan,
                durationDays: args.durationDays,
                maxDevices: args.maxDevices,
                expiresAt,
                createdAt: now,
            });

            generatedCodes.push(code);
        }

        return generatedCodes;
    },
});

export const redeemCode = mutation({
    args: {
        code: v.string(),
        deviceId: v.string(),
        userAgent: v.optional(v.string()),
        matchId: v.optional(v.id("matches")),
    },
    handler: async (ctx, args) => {
        // Find code
        const redemption = await ctx.db
            .query("redemptions")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .first();

        if (!redemption) {
            return { success: false, error: "Code-ka lama helin" };
        }

        if (redemption.revokedAt) {
            return { success: false, error: "Code-kan waa la joojiyay" };
        }

        if (redemption.usedByUserId) {
            // Logic change: Allow re-use if the same user (or slots available)
            // But we don't know the user from the code alone easily without querying.
            // Let's check if the code was used by a user, and if that user has space.

            // Get the user who used the code
            const user = await ctx.db.get(redemption.usedByUserId);
            if (!user) {
                // Anomaly: User deleted?
                return { success: false, error: "Cillad farsamo: User-ka lama helin" };
            }

            // Check device limit for this user
            const currentDevices = await ctx.db
                .query("devices")
                .withIndex("by_user", (q) => q.eq("userId", redemption.usedByUserId!))
                .collect();

            if (currentDevices.length >= redemption.maxDevices) {
                return { success: false, error: "Code-kan hore ayaa loo isticmaalay waxaana buuxa devices-ka" };
            }

            // Slots available!
            // IMPORTANT: If this device was already associated with another user (e.g. anonymous),
            // we must remove that link so `getOrCreateUser` finds the NEW correct link.
            const existingDevice = await ctx.db
                .query("devices")
                .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
                .first();

            if (existingDevice) {
                await ctx.db.delete(existingDevice._id);
            }

            // Add this new device to the EXISTING user.
            await ctx.db.insert("devices", {
                userId: redemption.usedByUserId!,
                deviceId: args.deviceId,
                userAgent: args.userAgent,
                lastSeenAt: Date.now(),
            });

            // We don't need to create a new subscription, just link to existing.
            // But wait, the client expects "success: true" to redirect.

            // Fetch active subscription for this user to return details
            const activeSub = await ctx.db
                .query("subscriptions")
                .withIndex("by_user", (q) => q.eq("userId", redemption.usedByUserId!))
                .filter((q) => q.eq(q.field("status"), "active"))
                .first();

            return {
                success: true,
                plan: redemption.plan,
                expiresAt: activeSub?.expiresAt || 0,
                message: "Kusoo dhawaada mar kale! Device-ka waa lagu daray.",
            };
        }

        // Check if code is expired
        if (redemption.expiresAt && Date.now() > redemption.expiresAt) {
            return { success: false, error: "Code-kan wuxuu dhacay (expired)" };
        }

        // Get or create user
        let device = await ctx.db
            .query("devices")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        let userId: any;

        if (device) {
            userId = device.userId;
            await ctx.db.patch(device._id, { lastSeenAt: Date.now() });
        } else {
            // Create new user
            userId = await ctx.db.insert("users", { createdAt: Date.now() });
            await ctx.db.insert("devices", {
                userId,
                deviceId: args.deviceId,
                userAgent: args.userAgent,
                lastSeenAt: Date.now(),
            });
        }

        // Check device limit for this user
        const userDevices = await ctx.db
            .query("devices")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        if (userDevices.length > redemption.maxDevices) {
            return {
                success: false,
                error: "Xadka qalabka waa buuxsamay — la xiriir WhatsApp",
            };
        }

        // Mark code as used
        const now = Date.now();
        await ctx.db.patch(redemption._id, {
            usedByUserId: userId,
            usedAt: now,
        });

        // Create subscription
        const expiresAt = now + redemption.durationDays * 24 * 60 * 60 * 1000;
        await ctx.db.insert("subscriptions", {
            userId,
            plan: redemption.plan,
            matchId: redemption.plan === "match" ? args.matchId : undefined,
            expiresAt,
            maxDevices: redemption.maxDevices,
            status: "active",
            codeId: redemption._id,
            createdAt: now,
        });

        return {
            success: true,
            plan: redemption.plan,
            expiresAt,
            message: "Mahadsanid! Subscription-kaaga wuu shaqeynayaa.",
        };
    },
});

export const revokeCode = mutation({
    args: { id: v.id("redemptions") },
    handler: async (ctx, args) => {
        const code = await ctx.db.get(args.id);
        if (!code) return { success: false };

        await ctx.db.patch(args.id, { revokedAt: Date.now() });

        // Also revoke any subscription created from this code
        const subs = await ctx.db.query("subscriptions").collect();
        const relatedSub = subs.find((s) => s.codeId === args.id);
        if (relatedSub) {
            await ctx.db.patch(relatedSub._id, { status: "revoked" });
        }

        return { success: true };
    },

});

export const deleteCode = mutation({
    args: { id: v.id("redemptions") },
    handler: async (ctx, args) => {
        const code = await ctx.db.get(args.id);
        if (!code) return { success: false };

        await ctx.db.delete(args.id);

        // Also revoke any subscription created from this code (optional cleanup)
        // Since code is gone, sub might remain active unless we kill it.
        // Let's kill it just to be safe.
        const subs = await ctx.db.query("subscriptions").collect();
        const relatedSub = subs.find((s) => s.codeId === args.id);
        if (relatedSub) {
            await ctx.db.delete(relatedSub._id);
        }

        return { success: true };
    },
});

export const exportCodesCSV = query({
    args: {
        plan: v.optional(
            v.union(
                v.literal("match"),
                v.literal("weekly"),
                v.literal("monthly"),
                v.literal("yearly")
            )
        ),
    },
    handler: async (ctx, args) => {
        let codes = await ctx.db.query("redemptions").collect();

        if (args.plan) {
            codes = codes.filter((c) => c.plan === args.plan);
        }

        return codes.map((c) => ({
            code: c.code,
            plan: c.plan,
            durationDays: c.durationDays,
            maxDevices: c.maxDevices,
            used: c.usedByUserId ? "Yes" : "No",
            revoked: c.revokedAt ? "Yes" : "No",
            createdAt: new Date(c.createdAt).toISOString(),
        }));
    },
});
