import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// ============================================
// SERIES QUERIES
// ============================================

export const listSeries = query({
    args: {
        isPublished: v.optional(v.boolean()),
        isPremium: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let series = await ctx.db.query("series").collect();

        if (args.isPublished !== undefined) {
            series = series.filter((s) => s.isPublished === args.isPublished);
        }
        if (args.isPremium !== undefined) {
            series = series.filter((s) => s.isPremium === args.isPremium);
        }

        series = series.sort((a, b) => b.createdAt - a.createdAt);

        if (args.limit) {
            series = series.slice(0, args.limit);
        }

        return series;
    },
});

export const getSeriesBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("series")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const getSeriesById = query({
    args: { id: v.id("series") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// ============================================
// SERIES MUTATIONS
// ============================================

export const createSeries = mutation({
    args: {
        slug: v.string(),
        tmdbId: v.number(),
        imdbId: v.optional(v.string()),
        title: v.string(),
        titleSomali: v.optional(v.string()),
        overview: v.string(),
        overviewSomali: v.optional(v.string()),
        posterUrl: v.string(),
        backdropUrl: v.optional(v.string()),
        firstAirDate: v.string(),
        lastAirDate: v.optional(v.string()),
        status: v.string(),
        rating: v.optional(v.number()),
        genres: v.array(v.string()),
        cast: v.array(
            v.object({
                name: v.string(),
                character: v.string(),
                profileUrl: v.optional(v.string()),
            })
        ),
        numberOfSeasons: v.number(),
        numberOfEpisodes: v.number(),
        isDubbed: v.boolean(),
        isPremium: v.boolean(),
        isPublished: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const seoTitle = `Daawo ${args.title} ${args.isDubbed ? "Af-Somali" : ""} | Fanbroj`;
        const seoDescription = args.overview.slice(0, 155) + "...";

        const seriesId = await ctx.db.insert("series", {
            ...args,
            seoTitle,
            seoDescription,
            views: 0,
            createdAt: now,
            updatedAt: now,
        });

        // Queue translation
        if (args.overview) {
            const queueId = await ctx.db.insert("translation_queue", {
                entityId: seriesId,
                entityType: "series",
                field: "overview",
                sourceText: args.overview,
                status: "pending",
                createdAt: now,
            });
            await ctx.scheduler.runAfter(0, api.translate.processOneTranslation, { queueId });
        }

        return seriesId;
    },
});

export const updateSeries = mutation({
    args: {
        id: v.id("series"),
        titleSomali: v.optional(v.string()),
        overviewSomali: v.optional(v.string()),
        isDubbed: v.optional(v.boolean()),
        isPremium: v.optional(v.boolean()),
        isPublished: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        return await ctx.db.patch(id, {
            ...filteredUpdates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteSeries = mutation({
    args: { id: v.id("series") },
    handler: async (ctx, args) => {
        // Delete all episodes first
        const episodes = await ctx.db
            .query("episodes")
            .withIndex("by_series", (q) => q.eq("seriesId", args.id))
            .collect();
        for (const ep of episodes) {
            await ctx.db.delete(ep._id);
        }
        return await ctx.db.delete(args.id);
    },
});

// ============================================
// EPISODES QUERIES
// ============================================

export const getEpisodesBySeries = query({
    args: { seriesId: v.id("series") },
    handler: async (ctx, args) => {
        const episodes = await ctx.db
            .query("episodes")
            .withIndex("by_series", (q) => q.eq("seriesId", args.seriesId))
            .collect();

        // Group by season
        const seasons: Record<number, typeof episodes> = {};
        for (const ep of episodes) {
            if (!seasons[ep.seasonNumber]) {
                seasons[ep.seasonNumber] = [];
            }
            seasons[ep.seasonNumber].push(ep);
        }

        // Sort episodes within each season
        for (const season of Object.keys(seasons)) {
            seasons[Number(season)].sort((a, b) => a.episodeNumber - b.episodeNumber);
        }

        return seasons;
    },
});

export const getEpisode = query({
    args: {
        seriesId: v.id("series"),
        seasonNumber: v.number(),
        episodeNumber: v.number(),
    },
    handler: async (ctx, args) => {
        const episodes = await ctx.db
            .query("episodes")
            .withIndex("by_season", (q) =>
                q.eq("seriesId", args.seriesId).eq("seasonNumber", args.seasonNumber)
            )
            .collect();

        return episodes.find((ep) => ep.episodeNumber === args.episodeNumber);
    },
});

// ============================================
// EPISODES MUTATIONS
// ============================================

export const createEpisode = mutation({
    args: {
        seriesId: v.id("series"),
        seasonNumber: v.number(),
        episodeNumber: v.number(),
        title: v.string(),
        titleSomali: v.optional(v.string()),
        overview: v.optional(v.string()),
        stillUrl: v.optional(v.string()),
        airDate: v.optional(v.string()),
        runtime: v.optional(v.number()),
        embeds: v.array(
            v.object({
                label: v.string(),
                url: v.string(),
            })
        ),
        isPublished: v.boolean(),
    },
    handler: async (ctx, args) => {
        const episodeId = await ctx.db.insert("episodes", {
            ...args,
            createdAt: Date.now(),
        });

        if (args.overview) {
            const queueId = await ctx.db.insert("translation_queue", {
                entityId: episodeId,
                entityType: "episode",
                field: "overview",
                sourceText: args.overview,
                status: "pending",
                createdAt: Date.now(),
            });
            await ctx.scheduler.runAfter(0, api.translate.processOneTranslation, { queueId });
        }

        return episodeId;
    },
});

export const updateEpisode = mutation({
    args: {
        id: v.id("episodes"),
        embeds: v.optional(
            v.array(
                v.object({
                    label: v.string(),
                    url: v.string(),
                })
            )
        ),
        isPublished: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        return await ctx.db.patch(id, filteredUpdates);
    },
});

export const deleteEpisode = mutation({
    args: { id: v.id("episodes") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

export const bulkCreateEpisodes = mutation({
    args: {
        seriesId: v.id("series"),
        seasonNumber: v.number(),
        episodes: v.array(
            v.object({
                episodeNumber: v.number(),
                title: v.string(),
                overview: v.optional(v.string()),
                stillUrl: v.optional(v.string()),
                airDate: v.optional(v.string()),
                runtime: v.optional(v.number()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const ids = [];

        for (const ep of args.episodes) {
            const id = await ctx.db.insert("episodes", {
                seriesId: args.seriesId,
                seasonNumber: args.seasonNumber,
                ...ep,
                embeds: [],
                isPublished: false,
                createdAt: now,
            });
            ids.push(id);

            // Queue translation (don't await scheduling per item to be faster, but insert queue item)
            if (ep.overview) {
                const queueId = await ctx.db.insert("translation_queue", {
                    entityId: id,
                    entityType: "episode",
                    field: "overview",
                    sourceText: ep.overview,
                    status: "pending",
                    createdAt: now,
                });
                await ctx.scheduler.runAfter(0, api.translate.processOneTranslation, { queueId });
            }
        }

        return ids;
    },
});
