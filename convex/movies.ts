import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// ============================================
// QUERIES
// ============================================

export const listMovies = query({
    args: {
        isPublished: v.optional(v.boolean()),
        isPremium: v.optional(v.boolean()),
        isDubbed: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let movies = await ctx.db.query("movies").collect();

        if (args.isPublished !== undefined) {
            movies = movies.filter((m) => m.isPublished === args.isPublished);
        }
        if (args.isPremium !== undefined) {
            movies = movies.filter((m) => m.isPremium === args.isPremium);
        }
        if (args.isDubbed !== undefined) {
            movies = movies.filter((m) => m.isDubbed === args.isDubbed);
        }

        // Sort by newest first
        movies = movies.sort((a, b) => b.createdAt - a.createdAt);

        if (args.limit) {
            movies = movies.slice(0, args.limit);
        }

        return movies;
    },
});

export const getMovieBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("movies")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const getMovieById = query({
    args: { id: v.id("movies") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getMoviesByGenre = query({
    args: { genre: v.string() },
    handler: async (ctx, args) => {
        const movies = await ctx.db.query("movies").collect();
        return movies.filter(
            (m) => m.isPublished && m.genres.includes(args.genre)
        );
    },
});

// ============================================
// MUTATIONS
// ============================================

export const createMovie = mutation({
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
        releaseDate: v.string(),
        runtime: v.optional(v.number()),
        rating: v.optional(v.number()),
        voteCount: v.optional(v.number()),
        genres: v.array(v.string()),
        cast: v.array(
            v.object({
                name: v.string(),
                character: v.string(),
                profileUrl: v.optional(v.string()),
            })
        ),
        director: v.optional(v.string()),
        embeds: v.array(
            v.object({
                label: v.string(),
                url: v.string(),
                quality: v.optional(v.string()),
                type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                isProtected: v.optional(v.boolean()),
            })
        ),
        isDubbed: v.boolean(),
        isPremium: v.boolean(),
        isPublished: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Generate SEO
        const seoTitle = `Daawo ${args.title} ${args.isDubbed ? "Af-Somali" : ""} Online | Fanbroj`;
        const seoDescription = args.overview.slice(0, 155) + "...";

        const movieId = await ctx.db.insert("movies", {
            ...args,
            seoTitle,
            seoDescription,
            views: 0,
            createdAt: now,
            updatedAt: now,
        });



        return movieId;
    },
});

export const updateMovie = mutation({
    args: {
        id: v.id("movies"),
        titleSomali: v.optional(v.string()),
        overviewSomali: v.optional(v.string()),
        embeds: v.optional(
            v.array(
                v.object({
                    label: v.string(),
                    url: v.string(),
                    quality: v.optional(v.string()),
                    type: v.optional(v.union(v.literal("m3u8"), v.literal("iframe"), v.literal("video"))),
                    isProtected: v.optional(v.boolean()),
                })
            )
        ),
        isDubbed: v.optional(v.boolean()),
        isPremium: v.optional(v.boolean()),
        isPublished: v.optional(v.boolean()),
        seoTitle: v.optional(v.string()),
        seoDescription: v.optional(v.string()),
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

export const deleteMovie = mutation({
    args: { id: v.id("movies") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

export const incrementViews = mutation({
    args: { id: v.id("movies") },
    handler: async (ctx, args) => {
        const movie = await ctx.db.get(args.id);
        if (!movie) return;
        await ctx.db.patch(args.id, {
            views: (movie.views || 0) + 1,
        });
    },
});
