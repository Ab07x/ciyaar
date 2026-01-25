import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const crons = cronJobs();

// Rotate free movie every week
crons.weekly(
    "Rotate Free Movie",
    { hourUTC: 0, minuteUTC: 0, dayOfWeek: "monday" },
    internal.crons.rotateFreeMovie
);

// Check trial expiry daily
crons.daily(
    "Check Trial Expiry",
    { hourUTC: 12, minuteUTC: 0 },
    internal.crons.checkTrialExpiry
);

// Send match reminders every 5 minutes (AB-7)
crons.interval(
    "Send Match Reminders",
    { minutes: 5 },
    internal.notifications.sendMatchReminders
);

export const rotateFreeMovie = internalMutation({
    handler: async (ctx) => {
        // 1. Get all published movies
        const movies = await ctx.db
            .query("movies")
            .filter((q) => q.eq(q.field("isPublished"), true))
            .collect();

        if (movies.length === 0) return;

        // 2. Pick a random movie
        const randomIndex = Math.floor(Math.random() * movies.length);
        const selectedMovie = movies[randomIndex];

        // 3. Update settings
        const settings = await ctx.db.query("settings").first();
        if (settings) {
            await ctx.db.patch(settings._id, {
                freeMovieOfWeek: selectedMovie.slug,
            });
            console.log(`Updated free movie of week to: ${selectedMovie.title}`);
        }
    },
});

export const checkTrialExpiry = internalMutation({
    handler: async (ctx) => {
        const now = Date.now();
        // Scanning all users is acceptable for < 10k users
        const users = await ctx.db.query("users").collect();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        for (const user of users) {
            if (!user.trialExpiresAt) continue;

            const msUntilExpiry = user.trialExpiresAt - now;
            const daysLeft = msUntilExpiry / MS_PER_DAY;

            // 1. Day 5 Reminder (approx 2 days left)
            // We check if it's between 1.5 and 2.5 days left to catch it once
            if (daysLeft > 1.5 && daysLeft < 2.5) {
                // Check if user has active paid subscription
                const subs = await ctx.db
                    .query("subscriptions")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect();

                const hasActivePaid = subs.some(s => s.status === "active" && s.expiresAt > now);
                if (hasActivePaid) continue;

                await ctx.scheduler.runAfter(0, api.pushActions.sendPush, {
                    userId: user._id,
                    title: "🔥 3 days left!",
                    body: "Don't lose your Premium access. Lock in $1.50/week now!",
                    url: "/pricing"
                });
            }

            // 2. Day 7 Expiry (recently expired)
            // Check if it expired within the last 24 hours (between -1 and 0 days)
            if (daysLeft < 0 && daysLeft > -1) {
                // Check if user has active paid subscription
                const subs = await ctx.db
                    .query("subscriptions")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect();

                const hasActivePaid = subs.some(s => s.status === "active" && s.expiresAt > now);
                if (hasActivePaid) continue;

                await ctx.scheduler.runAfter(0, api.pushActions.sendPush, {
                    userId: user._id,
                    title: "❌ Trial ended",
                    body: "Unlock full access (Live Matches + Movies) for just $0.25!",
                    url: "/pricing"
                });
            }
        }
    }
});

export default crons;
