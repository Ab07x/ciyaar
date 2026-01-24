import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggleReminder = mutation({
    args: {
        matchId: v.id("matches"),
        userId: v.optional(v.id("users")),
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const { matchId, userId, deviceId } = args;

        const existing = userId
            ? await ctx.db.query("match_reminders")
                .withIndex("by_user_match", q => q.eq("userId", userId).eq("matchId", matchId))
                .first()
            : await ctx.db.query("match_reminders")
                .withIndex("by_device_match", q => q.eq("deviceId", deviceId).eq("matchId", matchId))
                .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { action: "removed" };
        } else {
            await ctx.db.insert("match_reminders", {
                userId,
                deviceId,
                matchId,
                notified: false,
                createdAt: Date.now(),
            });
            return { action: "added" };
        }
    },
});

export const getReminderStatus = query({
    args: {
        matchId: v.id("matches"),
        userId: v.optional(v.id("users")),
        deviceId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { matchId, userId, deviceId } = args;
        if (!userId && !deviceId) return false;

        const existing = userId
            ? await ctx.db.query("match_reminders")
                .withIndex("by_user_match", q => q.eq("userId", userId).eq("matchId", matchId))
                .first()
            : await ctx.db.query("match_reminders")
                .withIndex("by_device_match", q => q.eq("deviceId", deviceId!).eq("matchId", matchId))
                .first();

        return !!existing;
    },
});

export const getPendingReminders = query({
    handler: async (ctx) => {
        const now = Date.now();
        // Look for matches starting in the next 30 minutes
        const windowEnd = now + 45 * 60 * 1000; // 45m for safety

        const pendingReminders = await ctx.db.query("match_reminders")
            .filter(q => q.eq(q.field("notified"), false))
            .collect();

        const remindersWithMatch = [];
        for (const reminder of pendingReminders) {
            const match = await ctx.db.get(reminder.matchId);
            if (match && match.status === "upcoming" && match.kickoffAt <= windowEnd) {
                // Get the user's subscription for this reminder
                const subscription = reminder.userId
                    ? await ctx.db.query("push_subscriptions")
                        .withIndex("by_user", q => q.eq("userId", reminder.userId!))
                        .filter(q => q.eq(q.field("isActive"), true))
                        .first()
                    : await ctx.db.query("push_subscriptions")
                        .withIndex("by_device", q => q.eq("deviceId", reminder.deviceId))
                        .filter(q => q.eq(q.field("isActive"), true))
                        .first();

                if (subscription) {
                    remindersWithMatch.push({
                        reminderId: reminder._id,
                        matchId: match._id,
                        teamA: match.teamA,
                        teamB: match.teamB,
                        slug: match.slug,
                        subscriptionId: subscription._id,
                    });
                }
            }
        }

        return remindersWithMatch;
    }
});

export const markNotified = mutation({
    args: { id: v.id("match_reminders") },
    handler: async (ctx, { id }) => {
        await ctx.db.patch(id, { notified: true });
    }
});
