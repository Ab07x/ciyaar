import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ============================================
// AB-7: PUSH NOTIFICATION ENHANCEMENTS
// ============================================

/**
 * Get or create notification preferences for a device
 */
export const getNotificationPreferences = query({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const prefs = await ctx.db
            .query("notification_preferences")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        if (!prefs) {
            // Return defaults
            return {
                matchReminders: true,
                newReleases: true,
                promotions: true,
                contentRequests: true,
                reminderMinutesBefore: 15,
            };
        }

        return {
            matchReminders: prefs.matchReminders,
            newReleases: prefs.newReleases,
            promotions: prefs.promotions,
            contentRequests: prefs.contentRequests,
            reminderMinutesBefore: prefs.reminderMinutesBefore,
        };
    },
});

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = mutation({
    args: {
        deviceId: v.string(),
        userId: v.optional(v.id("users")),
        matchReminders: v.optional(v.boolean()),
        newReleases: v.optional(v.boolean()),
        promotions: v.optional(v.boolean()),
        contentRequests: v.optional(v.boolean()),
        reminderMinutesBefore: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("notification_preferences")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .first();

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...(args.matchReminders !== undefined && { matchReminders: args.matchReminders }),
                ...(args.newReleases !== undefined && { newReleases: args.newReleases }),
                ...(args.promotions !== undefined && { promotions: args.promotions }),
                ...(args.contentRequests !== undefined && { contentRequests: args.contentRequests }),
                ...(args.reminderMinutesBefore !== undefined && { reminderMinutesBefore: args.reminderMinutesBefore }),
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("notification_preferences", {
                userId: args.userId,
                deviceId: args.deviceId,
                matchReminders: args.matchReminders ?? true,
                newReleases: args.newReleases ?? true,
                promotions: args.promotions ?? true,
                contentRequests: args.contentRequests ?? true,
                reminderMinutesBefore: args.reminderMinutesBefore ?? 15,
                createdAt: now,
                updatedAt: now,
            });
        }

        return { success: true };
    },
});

/**
 * Internal: Send match reminders (called by cron)
 */
export const sendMatchReminders = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const fifteenMinutesFromNow = now + 15 * 60 * 1000;
        const twentyMinutesFromNow = now + 20 * 60 * 1000;

        // Find matches starting in ~15 minutes
        const upcomingMatches = await ctx.db
            .query("matches")
            .withIndex("by_status", (q) => q.eq("status", "upcoming"))
            .collect();

        const matchesToNotify = upcomingMatches.filter(
            (m) => m.kickoffAt >= fifteenMinutesFromNow && m.kickoffAt <= twentyMinutesFromNow
        );

        for (const match of matchesToNotify) {
            // Get all reminders for this match that haven't been notified
            const reminders = await ctx.db
                .query("match_reminders")
                .withIndex("by_match", (q) => q.eq("matchId", match._id))
                .filter((q) => q.eq(q.field("notified"), false))
                .collect();

            for (const reminder of reminders) {
                // Check user preferences
                const prefs = await ctx.db
                    .query("notification_preferences")
                    .withIndex("by_device", (q) => q.eq("deviceId", reminder.deviceId))
                    .first();

                if (prefs && !prefs.matchReminders) continue;

                // Send push notification
                if (reminder.userId) {
                    await ctx.scheduler.runAfter(0, api.pushActions.sendPush, {
                        userId: reminder.userId,
                        title: "⚽ Ciyaarta waa bilaabanaysaa!",
                        body: `${match.teamA} vs ${match.teamB} - 15 daqiiqo kadib!`,
                        url: `/match/${match.slug}`,
                    });
                }

                // Mark as notified
                await ctx.db.patch(reminder._id, { notified: true });
            }
        }

        return { matchesProcessed: matchesToNotify.length };
    },
});

/**
 * Admin: Send broadcast notification
 */
export const sendBroadcastNotification = mutation({
    args: {
        adminPass: v.string(),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
        targetAudience: v.union(
            v.literal("all"),
            v.literal("premium"),
            v.literal("trial"),
            v.literal("free")
        ),
    },
    handler: async (ctx, args) => {
        // Verify admin
        const settings = await ctx.db.query("settings").first();
        if (!settings || settings.adminPassword !== args.adminPass) {
            throw new Error("Unauthorized");
        }

        // Get target users based on audience
        let targetUsers: any[] = [];
        const now = Date.now();

        if (args.targetAudience === "all") {
            targetUsers = await ctx.db.query("users").collect();
        } else if (args.targetAudience === "premium") {
            const activeSubs = await ctx.db
                .query("subscriptions")
                .withIndex("by_status", (q) => q.eq("status", "active"))
                .filter((q) => q.gt(q.field("expiresAt"), now))
                .collect();
            const userIds = [...new Set(activeSubs.map((s) => s.userId))];
            targetUsers = await Promise.all(userIds.map((id) => ctx.db.get(id)));
        } else if (args.targetAudience === "trial") {
            targetUsers = await ctx.db
                .query("users")
                .filter((q) => q.gt(q.field("trialExpiresAt"), now))
                .collect();
        } else if (args.targetAudience === "free") {
            // Users without active subscription or trial
            const allUsers = await ctx.db.query("users").collect();
            const activeSubs = await ctx.db
                .query("subscriptions")
                .withIndex("by_status", (q) => q.eq("status", "active"))
                .filter((q) => q.gt(q.field("expiresAt"), now))
                .collect();
            const premiumUserIds = new Set(activeSubs.map((s) => s.userId.toString()));
            targetUsers = allUsers.filter(
                (u) =>
                    !premiumUserIds.has(u._id.toString()) &&
                    (!u.trialExpiresAt || u.trialExpiresAt <= now)
            );
        }

        // Filter users with promotions enabled
        const userIdsToNotify: any[] = [];
        for (const user of targetUsers) {
            if (!user) continue;
            // Get any device for this user
            const device = await ctx.db
                .query("devices")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .first();
            if (device) {
                const prefs = await ctx.db
                    .query("notification_preferences")
                    .withIndex("by_device", (q) => q.eq("deviceId", device.deviceId))
                    .first();
                // Send if no prefs (default on) or promotions enabled
                if (!prefs || prefs.promotions) {
                    userIdsToNotify.push(user._id);
                }
            }
        }

        // Send batch notification
        if (userIdsToNotify.length > 0) {
            await ctx.scheduler.runAfter(0, api.pushActions.sendBatchPush, {
                userIds: userIdsToNotify,
                title: args.title,
                body: args.body,
                url: args.url,
            });
        }

        // Log the notification
        await ctx.db.insert("notification_logs", {
            type: "admin_broadcast",
            title: args.title,
            body: args.body,
            url: args.url,
            targetAudience: args.targetAudience,
            sentCount: userIdsToNotify.length,
            createdAt: now,
            sentBy: "admin",
        });

        return { sentTo: userIdsToNotify.length };
    },
});

/**
 * Get notification history (admin)
 */
export const getNotificationHistory = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const logs = await ctx.db
            .query("notification_logs")
            .withIndex("by_created")
            .order("desc")
            .take(args.limit || 50);

        return logs;
    },
});

/**
 * Send new release notification (called when movie/series published)
 */
export const sendNewReleaseNotification = mutation({
    args: {
        contentType: v.union(v.literal("movie"), v.literal("series")),
        title: v.string(),
        slug: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Get all users with newReleases enabled (or default)
        const allDevices = await ctx.db.query("push_subscriptions").collect();
        const userIdsToNotify: any[] = [];

        for (const sub of allDevices) {
            if (!sub.userId || !sub.isActive) continue;

            const prefs = await ctx.db
                .query("notification_preferences")
                .withIndex("by_device", (q) => q.eq("deviceId", sub.deviceId))
                .first();

            if (!prefs || prefs.newReleases) {
                userIdsToNotify.push(sub.userId);
            }
        }

        const uniqueUserIds = [...new Set(userIdsToNotify.map((id) => id.toString()))].map(
            (id) => userIdsToNotify.find((u) => u.toString() === id)
        );

        if (uniqueUserIds.length > 0) {
            await ctx.scheduler.runAfter(0, api.pushActions.sendBatchPush, {
                userIds: uniqueUserIds,
                title: args.contentType === "movie" ? "🎬 Film Cusub!" : "📺 Musalsal Cusub!",
                body: `${args.title} hadda waa diyaar. Daawo hadda!`,
                url: args.contentType === "movie" ? `/movies/${args.slug}` : `/series/${args.slug}`,
            });
        }

        // Log
        await ctx.db.insert("notification_logs", {
            type: "new_release",
            title: args.contentType === "movie" ? "Film Cusub" : "Musalsal Cusub",
            body: args.title,
            url: args.contentType === "movie" ? `/movies/${args.slug}` : `/series/${args.slug}`,
            targetAudience: "all",
            sentCount: uniqueUserIds.length,
            createdAt: now,
            sentBy: "system",
        });

        return { sentTo: uniqueUserIds.length };
    },
});
