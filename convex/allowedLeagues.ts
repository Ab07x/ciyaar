/**
 * Allowed Leagues Configuration
 * 
 * Controls which leagues are synced from API-Football
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// CONSTANTS
// ============================================

/**
 * Default allowed leagues for fixtures sync
 * These are the 9 leagues requested by the user
 */
const DEFAULT_ALLOWED_LEAGUES = [
    { leagueName: "UEFA Champions League", apiLeagueId: 2 },
    { leagueName: "FIFA World Cup", apiLeagueId: 1 },
    { leagueName: "UEFA Euro", apiLeagueId: 4 },
    { leagueName: "Premier League", apiLeagueId: 39 },
    { leagueName: "La Liga", apiLeagueId: 140 },
    { leagueName: "Africa Cup of Nations", apiLeagueId: 6 },
    { leagueName: "Serie A", apiLeagueId: 135 },
    { leagueName: "Bundesliga", apiLeagueId: 78 },
    { leagueName: "Ligue 1", apiLeagueId: 61 },
];

// ============================================
// QUERIES
// ============================================

/**
 * Get all allowed leagues (enabled only)
 */
export const getAllowedLeagues = query({
    args: {},
    handler: async (ctx) => {
        const leagues = await ctx.db
            .query("allowed_leagues")
            .collect();
        return leagues.filter(l => l.enabled);
    },
});

/**
 * Get all allowed league names as a Set-friendly array
 */
export const getAllowedLeagueNames = query({
    args: {},
    handler: async (ctx) => {
        const leagues = await ctx.db
            .query("allowed_leagues")
            .collect();
        return leagues.filter(l => l.enabled).map(l => l.leagueName);
    },
});

/**
 * List all leagues (enabled and disabled)
 */
export const listAllLeagues = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("allowed_leagues").collect();
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Seed allowed leagues table with default leagues
 * Only seeds if the table is empty
 */
export const seedAllowedLeagues = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if table already has data
        const existing = await ctx.db.query("allowed_leagues").first();
        if (existing) {
            return { seeded: false, message: "Table already seeded", count: 0 };
        }

        const now = Date.now();
        let count = 0;

        for (const league of DEFAULT_ALLOWED_LEAGUES) {
            await ctx.db.insert("allowed_leagues", {
                leagueName: league.leagueName,
                apiLeagueId: league.apiLeagueId,
                enabled: true,
                createdAt: now,
            });
            count++;
        }

        return { seeded: true, message: "Successfully seeded leagues", count };
    },
});

/**
 * Toggle a league's enabled status
 */
export const toggleLeague = mutation({
    args: { id: v.id("allowed_leagues") },
    handler: async (ctx, args) => {
        const league = await ctx.db.get(args.id);
        if (!league) throw new Error("League not found");

        await ctx.db.patch(args.id, { enabled: !league.enabled });
        return { enabled: !league.enabled };
    },
});

/**
 * Add a new allowed league
 */
export const addAllowedLeague = mutation({
    args: {
        leagueName: v.string(),
        apiLeagueId: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Check for duplicates
        const existing = await ctx.db
            .query("allowed_leagues")
            .withIndex("by_name", q => q.eq("leagueName", args.leagueName))
            .first();

        if (existing) {
            throw new Error("League already exists");
        }

        return await ctx.db.insert("allowed_leagues", {
            leagueName: args.leagueName,
            apiLeagueId: args.apiLeagueId,
            enabled: true,
            createdAt: Date.now(),
        });
    },
});

/**
 * Remove an allowed league
 */
export const removeAllowedLeague = mutation({
    args: { id: v.id("allowed_leagues") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
