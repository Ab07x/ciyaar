import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const getUserPrediction = query({
    args: {
        matchId: v.id("matches"),
        userId: v.optional(v.id("users"))
    },
    handler: async (ctx, args) => {
        if (!args.userId) return null;

        return await ctx.db
            .query("predictions")
            .withIndex("by_user_match", (q) => q.eq("userId", args.userId!).eq("matchId", args.matchId))
            .unique();
    },
});

export const getMatchPredictionStats = query({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const predictions = await ctx.db
            .query("predictions")
            .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
            .collect();

        const total = predictions.length;
        if (total === 0) return { home: 0, draw: 0, away: 0, total: 0 };

        const home = predictions.filter((p) => p.prediction === "home").length;
        const draw = predictions.filter((p) => p.prediction === "draw").length;
        const away = predictions.filter((p) => p.prediction === "away").length;

        return {
            home: Math.round((home / total) * 100),
            draw: Math.round((draw / total) * 100),
            away: Math.round((away / total) * 100),
            total,
        };
    },
});

export const getLeaderboard = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const leaderboard = await ctx.db
            .query("leaderboards")
            .withIndex("by_total_points")
            .order("desc")
            .take(limit);

        // Fetch user details for display
        const results = await Promise.all(
            leaderboard.map(async (entry) => {
                const user = await ctx.db.get(entry.userId);
                // Mask the ID or use a display name (users doesn't have display name required)
                // Use first 6 chars of ID or something else if no username
                // Schema has `phoneOrId`
                const displayName = user?.phoneOrId
                    ? (user.phoneOrId.length > 10 ? `User ${user.phoneOrId.substring(0, 4)}` : user.phoneOrId)
                    : `User ${entry.userId.substring(0, 4)}`;

                return {
                    ...entry,
                    username: displayName,
                };
            })
        );

        return results;
    },
});

export const getUserStats = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        if (!args.userId) return null;

        return await ctx.db
            .query("leaderboards")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .unique();
    },
});


// ============================================
// MUTATIONS
// ============================================

export const submitPrediction = mutation({
    args: {
        matchId: v.id("matches"),
        prediction: v.union(v.literal("home"), v.literal("away"), v.literal("draw")),
        userId: v.id("users"), // Passed from client
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User profile not found");

        // Check Match Status
        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        const now = Date.now();
        if (match.status !== "upcoming" && match.kickoffAt <= now) {
            throw new Error("Match has already started. Prediction closed.");
        }

        // Check existing prediction
        const existing = await ctx.db
            .query("predictions")
            .withIndex("by_user_match", (q) => q.eq("userId", user._id).eq("matchId", args.matchId))
            .unique();

        if (existing) {
            // Update existing
            await ctx.db.patch(existing._id, {
                prediction: args.prediction,
            });
        } else {
            // Create new
            await ctx.db.insert("predictions", {
                userId: user._id,
                matchId: args.matchId,
                prediction: args.prediction,
                status: "pending",
                createdAt: now,
            });

            // Update/Create Leaderboard Entry
            const stats = await ctx.db
                .query("leaderboards")
                .filter((q) => q.eq(q.field("userId"), user._id))
                .unique();

            if (stats) {
                await ctx.db.patch(stats._id, {
                    predictionsCount: stats.predictionsCount + 1,
                    lastPredictionAt: now,
                    updatedAt: now,
                });
            } else {
                await ctx.db.insert("leaderboards", {
                    userId: user._id,
                    totalPoints: 0,
                    weeklyPoints: 0,
                    monthlyPoints: 0,
                    streakCount: 0,
                    bestStreak: 0,
                    predictionsCount: 1,
                    correctPredictionsCount: 0,
                    lastPredictionAt: now,
                    updatedAt: now,
                });
            }
        }
    },
});
