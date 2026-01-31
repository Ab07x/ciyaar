import { v } from "convex/values";
// Trigger update
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

// List all matches with optional filters
export const listMatches = query({
    args: {
        status: v.optional(
            v.union(v.literal("upcoming"), v.literal("live"), v.literal("finished"))
        ),
        leagueId: v.optional(v.string()),
        isPremium: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let matches = await ctx.db.query("matches").order("desc").collect();

        if (args.status) {
            matches = matches.filter((m) => m.status === args.status);
        }
        if (args.leagueId) {
            matches = matches.filter((m) => m.leagueId === args.leagueId);
        }
        if (args.isPremium !== undefined) {
            matches = matches.filter((m) => m.isPremium === args.isPremium);
        }

        return matches;
    },
});

// Get match by slug
export const getMatchBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("matches")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

// Get match by ID
export const getMatchById = query({
    args: { id: v.optional(v.id("matches")) },
    handler: async (ctx, args) => {
        if (!args.id) return null;
        return await ctx.db.get(args.id);
    },
});

// Get matches grouped by status (TV Guide)
export const getMatchesByStatus = query({
    handler: async (ctx) => {
        const allMatches = await ctx.db.query("matches").collect();

        const live = allMatches.filter((m) => m.status === "live");
        const upcoming = allMatches
            .filter((m) => m.status === "upcoming")
            .sort((a, b) => a.kickoffAt - b.kickoffAt);
        const finished = allMatches
            .filter((m) => m.status === "finished")
            .sort((a, b) => b.kickoffAt - a.kickoffAt)
            .slice(0, 10);
        const premium = allMatches.filter((m) => m.isPremium && m.status !== "finished");

        return { live, upcoming, finished, premium };
    },
});

// Get related matches (same league)
export const getRelatedMatches = query({
    args: { matchId: v.id("matches"), leagueId: v.string() },
    handler: async (ctx, args) => {
        const matches = await ctx.db
            .query("matches")
            .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
            .collect();
        return matches.filter((m) => m._id !== args.matchId).slice(0, 6);
    },
});

// ============================================
// MUTATIONS
// ============================================

// Create match
export const createMatch = mutation({
    args: {
        slug: v.string(),
        title: v.string(),
        teamA: v.string(),
        teamB: v.string(),
        teamALogo: v.optional(v.string()),
        teamBLogo: v.optional(v.string()),
        articleTitle: v.optional(v.string()),
        articleContent: v.optional(v.string()),
        leagueId: v.string(),
        leagueName: v.string(),
        kickoffAt: v.number(),
        status: v.union(
            v.literal("upcoming"),
            v.literal("live"),
            v.literal("finished")
        ),
        isPremium: v.boolean(),
        requiredPlan: v.optional(
            v.union(
                v.literal("match"),
                v.literal("weekly"),
                v.literal("monthly"),
                v.literal("yearly")
            )
        ),
        embeds: v.array(
            v.object({
                label: v.string(),
                url: v.string(),
                type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                isProtected: v.optional(v.boolean()),
            })
        ),
        thumbnailUrl: v.optional(v.string()),
        summary: v.optional(v.string()),
        // Scores
        scoreA: v.optional(v.number()),
        scoreB: v.optional(v.number()),
        minute: v.optional(v.number()),
        goals: v.optional(v.array(v.object({
            team: v.union(v.literal("A"), v.literal("B")),
            player: v.string(),
            minute: v.number(),
            type: v.optional(v.union(v.literal("goal"), v.literal("penalty"), v.literal("own_goal"))),
        }))),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("matches", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Update match
export const updateMatch = mutation({
    args: {
        id: v.id("matches"),
        slug: v.optional(v.string()),
        title: v.optional(v.string()),
        teamA: v.optional(v.string()),
        teamB: v.optional(v.string()),
        teamALogo: v.optional(v.string()),
        teamBLogo: v.optional(v.string()),
        articleTitle: v.optional(v.string()),
        articleContent: v.optional(v.string()),
        leagueId: v.optional(v.string()),
        leagueName: v.optional(v.string()),
        kickoffAt: v.optional(v.number()),
        status: v.optional(
            v.union(v.literal("upcoming"), v.literal("live"), v.literal("finished"))
        ),
        isPremium: v.optional(v.boolean()),
        requiredPlan: v.optional(
            v.union(
                v.literal("match"),
                v.literal("weekly"),
                v.literal("monthly"),
                v.literal("yearly")
            )
        ),
        embeds: v.optional(
            v.array(
                v.object({
                    label: v.string(),
                    url: v.string(),
                    type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                    isProtected: v.optional(v.boolean()),
                })
            )
        ),
        thumbnailUrl: v.optional(v.string()),
        summary: v.optional(v.string()),
        // Scores
        scoreA: v.optional(v.number()),
        scoreB: v.optional(v.number()),
        minute: v.optional(v.number()),
        goals: v.optional(v.array(v.object({
            team: v.union(v.literal("A"), v.literal("B")),
            player: v.string(),
            minute: v.number(),
            type: v.optional(v.union(v.literal("goal"), v.literal("penalty"), v.literal("own_goal"))),
        }))),
        // Lineup data
        lineup: v.optional(v.object({
            home: v.object({
                formation: v.string(),
                players: v.array(v.object({
                    number: v.number(),
                    name: v.string(),
                    position: v.object({ x: v.number(), y: v.number() }),
                })),
                substitutes: v.optional(v.array(v.object({
                    number: v.number(),
                    name: v.string(),
                }))),
            }),
            away: v.object({
                formation: v.string(),
                players: v.array(v.object({
                    number: v.number(),
                    name: v.string(),
                    position: v.object({ x: v.number(), y: v.number() }),
                })),
                substitutes: v.optional(v.array(v.object({
                    number: v.number(),
                    name: v.string(),
                }))),
            }),
        })),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Delete match
export const deleteMatch = mutation({
    args: { id: v.id("matches") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Search matches by title or team names
export const searchMatches = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        if (!args.query) return [];

        const searchTerm = args.query.toLowerCase();
        const matches = await ctx.db
            .query("matches")
            .order("desc")
            .collect();

        return matches.filter(m =>
            m.title?.toLowerCase().includes(searchTerm) ||
            m.teamA?.toLowerCase().includes(searchTerm) ||
            m.teamB?.toLowerCase().includes(searchTerm) ||
            m.leagueName?.toLowerCase().includes(searchTerm)
        ).slice(0, 5); // Limit to 5 results for autocomplete
    },
});

// Bulk update match status
export const bulkUpdateStatus = mutation({
    args: {
        ids: v.array(v.id("matches")),
        status: v.union(v.literal("upcoming"), v.literal("live"), v.literal("finished")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        for (const id of args.ids) {
            await ctx.db.patch(id, { status: args.status, updatedAt: now });
        }
    },
});
