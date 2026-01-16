import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// QUERIES
// ============================================

export const listLeagues = query({
    args: {
        type: v.optional(
            v.union(
                v.literal("competition"),
                v.literal("league"),
                v.literal("club"),
                v.literal("player")
            )
        ),
    },
    handler: async (ctx, args) => {
        if (args.type) {
            return await ctx.db
                .query("leagues")
                .withIndex("by_type", (q) => q.eq("type", args.type as any))
                .collect();
        }
        return await ctx.db.query("leagues").collect();
    },
});

export const getLeagueById = query({
    args: { id: v.id("leagues") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// ============================================
// MUTATIONS
// ============================================

export const createLeague = mutation({
    args: {
        name: v.string(),
        type: v.union(
            v.literal("competition"),
            v.literal("league"),
            v.literal("club"),
            v.literal("player")
        ),
        country: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        apiId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("leagues", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const updateLeague = mutation({
    args: {
        id: v.id("leagues"),
        name: v.optional(v.string()),
        type: v.optional(
            v.union(
                v.literal("competition"),
                v.literal("league"),
                v.literal("club"),
                v.literal("player")
            )
        ),
        country: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        apiId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const deleteLeague = mutation({
    args: { id: v.id("leagues") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Seed default leagues
export const seedLeagues = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("leagues").first();
        if (existing) return "already_seeded";

        const now = Date.now();

        // Competitions
        const competitions = [
            { name: "UEFA Champions League", type: "competition" as const, apiId: "2" },
            { name: "FIFA World Cup", type: "competition" as const, apiId: "1" },
            { name: "UEFA Euro", type: "competition" as const, apiId: "4" },
            { name: "Africa Cup of Nations", type: "competition" as const, apiId: "6" },
        ];

        // Leagues
        const leagues = [
            { name: "Premier League", type: "league" as const, country: "England", apiId: "39" },
            { name: "La Liga", type: "league" as const, country: "Spain", apiId: "140" },
            { name: "Serie A", type: "league" as const, country: "Italy", apiId: "135" },
            { name: "Bundesliga", type: "league" as const, country: "Germany", apiId: "78" },
            { name: "Ligue 1", type: "league" as const, country: "France", apiId: "61" },
        ];

        // Clubs
        const clubs = [
            { name: "Real Madrid", type: "club" as const, country: "Spain" },
            { name: "Barcelona", type: "club" as const, country: "Spain" },
            { name: "Manchester United", type: "club" as const, country: "England" },
            { name: "Liverpool", type: "club" as const, country: "England" },
            { name: "Arsenal", type: "club" as const, country: "England" },
            { name: "Manchester City", type: "club" as const, country: "England" },
            { name: "Bayern Munich", type: "club" as const, country: "Germany" },
            { name: "Paris Saint-Germain", type: "club" as const, country: "France" },
        ];

        // Players
        const players = [
            { name: "Cristiano Ronaldo", type: "player" as const },
            { name: "Lionel Messi", type: "player" as const },
            { name: "Mohamed Salah", type: "player" as const },
            { name: "Neymar", type: "player" as const },
            { name: "Kylian Mbappé", type: "player" as const },
            { name: "Erling Haaland", type: "player" as const },
        ];

        const allItems = [...competitions, ...leagues, ...clubs, ...players];

        for (const item of allItems) {
            await ctx.db.insert("leagues", { ...item, createdAt: now });
        }

        return "seeded";
    },
});
