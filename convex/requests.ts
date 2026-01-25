import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// ============================================
// MUTATIONS
// ============================================

export const submitRequest = mutation({
    args: {
        userId: v.id("users"),
        tmdbId: v.number(),
        type: v.union(v.literal("movie"), v.literal("tv")),
        title: v.string(),
        posterUrl: v.optional(v.string()),
        year: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        // Check if already exists
        const existing = await ctx.db
            .query("content_requests")
            .withIndex("by_tmdb", (q) => q.eq("tmdbId", args.tmdbId).eq("type", args.type))
            .unique();

        if (existing) {
            // Treat as a vote for the existing request
            // Check if user already voted
            const hasVoted = await ctx.db
                .query("content_request_votes")
                .withIndex("by_request_user", (q) => q.eq("requestId", existing._id).eq("userId", user._id))
                .first();

            if (hasVoted) {
                return { status: "already_voted", requestId: existing._id };
            }

            await ctx.db.insert("content_request_votes", {
                requestId: existing._id,
                userId: user._id,
                createdAt: Date.now(),
            });

            await ctx.db.patch(existing._id, {
                votes: existing.votes + 1,
            });

            return { status: "voted", requestId: existing._id };
        }

        // Create new request
        const requestId = await ctx.db.insert("content_requests", {
            userId: user._id,
            tmdbId: args.tmdbId,
            type: args.type,
            title: args.title,
            posterUrl: args.posterUrl,
            year: args.year,
            votes: 1,
            status: "pending",
            createdAt: Date.now(),
        });

        // Add initial vote
        await ctx.db.insert("content_request_votes", {
            requestId,
            userId: user._id,
            createdAt: Date.now(),
        });

        return { status: "created", requestId };
    },
});

export const voteRequest = mutation({
    args: {
        requestId: v.id("content_requests"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        const hasVoted = await ctx.db
            .query("content_request_votes")
            .withIndex("by_request_user", (q) => q.eq("requestId", args.requestId).eq("userId", user._id))
            .first();

        if (hasVoted) {
            throw new Error("Already voted");
        }

        await ctx.db.insert("content_request_votes", {
            requestId: args.requestId,
            userId: user._id,
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.requestId, {
            votes: request.votes + 1,
        });

        return { success: true };
    },
});

export const updateRequestStatus = mutation({
    args: {
        requestId: v.id("content_requests"),
        status: v.union(v.literal("pending"), v.literal("approved"), v.literal("fulfilled"), v.literal("rejected")),
        adminPass: v.string(), // Simple admin check
    },
    handler: async (ctx, args) => {
        // Verify Admin
        const settings = await ctx.db.query("settings").first();
        if (!settings || settings.adminPassword !== args.adminPass) {
            throw new Error("Unauthorized");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        await ctx.db.patch(args.requestId, {
            status: args.status,
        });

        // If fulfilled, schedule notifications
        if (args.status === "fulfilled" && request.status !== "fulfilled") {
            await ctx.scheduler.runAfter(0, api.requests.notifyVoters, {
                requestId: args.requestId,
                title: request.title,
            });
        }
    },
});

export const notifyVoters = mutation({
    args: {
        requestId: v.id("content_requests"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const votes = await ctx.db
            .query("content_request_votes")
            .withIndex("by_request_user", (q) => q.eq("requestId", args.requestId))
            .collect();

        const uniqueUserIds = [...new Set(votes.map(v => v.userId))];

        // Chunk user IDs to avoid hitting potential limits
        const chunks = [];
        for (let i = 0; i < uniqueUserIds.length; i += 50) {
            chunks.push(uniqueUserIds.slice(i, i + 50));
        }

        for (const userIds of chunks) {
            await ctx.scheduler.runAfter(0, api.pushActions.sendBatchPush, {
                userIds,
                title: "Codsigaagii Waa La Aqbalay! 🎉",
                body: `Filimkii/Musalsalkii ${args.title} hadda waa diyaar. Daawo hadda!`,
                url: `/requests`,
            });
        }
    }
});

// ============================================
// QUERIES
// ============================================

export const listRequests = query({
    args: {
        status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("fulfilled"), v.literal("rejected"))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        let requests;

        if (args.status) {
            requests = await ctx.db
                .query("content_requests")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .take(limit);

            // Re-sort in memory by votes since we used the status index
            requests.sort((a, b) => b.votes - a.votes);
        } else {
            requests = await ctx.db
                .query("content_requests")
                .withIndex("by_votes")
                .order("desc")
                .take(limit);
        }

        return requests;
    },
});

export const getMyVotes = query({
    args: {
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        if (!args.userId) return [];

        const votes = await ctx.db
            .query("content_request_votes")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .collect();

        return votes.map((v) => v.requestId);
    },
});
