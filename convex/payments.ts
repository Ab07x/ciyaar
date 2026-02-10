import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// MUTATIONS
// ============================================

export const createPayment = mutation({
    args: {
        deviceId: v.string(),
        plan: v.union(
            v.literal("match"),
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("yearly")
        ),
        amount: v.number(),
        currency: v.string(),
        orderId: v.string(),
        gateway: v.string(),
        sifaloKey: v.optional(v.string()),
        sifaloToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("payments", {
            deviceId: args.deviceId,
            plan: args.plan,
            amount: args.amount,
            currency: args.currency,
            orderId: args.orderId,
            gateway: args.gateway,
            sifaloKey: args.sifaloKey,
            sifaloToken: args.sifaloToken,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

export const completePayment = mutation({
    args: {
        orderId: v.string(),
        sifaloSid: v.string(),
        paymentType: v.optional(v.string()),
        userId: v.id("users"),
        subscriptionId: v.id("subscriptions"),
    },
    handler: async (ctx, args) => {
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
            .first();

        if (!payment) throw new Error("Payment not found");

        await ctx.db.patch(payment._id, {
            status: "success",
            sifaloSid: args.sifaloSid,
            paymentType: args.paymentType,
            userId: args.userId,
            subscriptionId: args.subscriptionId,
            verifiedAt: Date.now(),
        });

        return payment._id;
    },
});

export const failPayment = mutation({
    args: {
        orderId: v.string(),
        sifaloSid: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
            .first();

        if (!payment) throw new Error("Payment not found");

        await ctx.db.patch(payment._id, {
            status: "failed",
            sifaloSid: args.sifaloSid,
            verifiedAt: Date.now(),
        });
    },
});

// ============================================
// QUERIES
// ============================================

export const getPaymentByOrder = query({
    args: { orderId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("payments")
            .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
            .first();
    },
});

export const getPaymentBySid = query({
    args: { sid: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("payments")
            .withIndex("by_sid", (q) => q.eq("sifaloSid", args.sid))
            .first();
    },
});

export const getUserPayments = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("payments")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .order("desc")
            .collect();
    },
});
