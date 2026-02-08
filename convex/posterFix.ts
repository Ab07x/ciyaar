"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/**
 * Fix broken poster URLs for all movies
 * Fetches fresh poster URLs from TMDB for movies with missing/broken posters
 */
export const fixBrokenPosters = action({
    handler: async (ctx) => {
        // Get all movies
        const movies = await ctx.runQuery(api.movies.listMovies, { isPublished: true });

        let fixed = 0;
        let errors: string[] = [];

        for (const movie of movies) {
            // Check if poster is missing or broken
            const posterIsBroken =
                !movie.posterUrl ||
                movie.posterUrl === "" ||
                movie.posterUrl.includes("null") ||
                movie.posterUrl.includes("undefined") ||
                movie.posterUrl.includes("placeholder");

            if (posterIsBroken && movie.tmdbId) {
                try {
                    // Fetch fresh data from TMDB
                    const tmdbData = await ctx.runAction(api.tmdb.fetchMovieFromTMDB, {
                        tmdbId: movie.tmdbId,
                    });

                    if (tmdbData.posterUrl) {
                        // Update movie with fresh poster URL
                        await ctx.runMutation(api.movies.updateMovieImages, {
                            id: movie._id,
                            posterUrl: tmdbData.posterUrl,
                            backdropUrl: tmdbData.backdropUrl || undefined,
                        });
                        fixed++;
                        console.log(`Fixed: ${movie.title} - ${tmdbData.posterUrl}`);
                    }
                } catch (error) {
                    errors.push(`${movie.title}: ${error}`);
                }
            }
        }

        return {
            success: true,
            fixed,
            total: movies.length,
            errors: errors.slice(0, 10), // Only show first 10 errors
        };
    },
});

/**
 * Validate all movie poster URLs
 * Returns list of movies with broken/missing posters
 */
export const validatePosters = action({
    handler: async (ctx) => {
        const movies = await ctx.runQuery(api.movies.listMovies, { isPublished: true });

        const broken: { id: string; title: string; posterUrl: string | null }[] = [];

        for (const movie of movies) {
            const posterIsBroken =
                !movie.posterUrl ||
                movie.posterUrl === "" ||
                movie.posterUrl.includes("null") ||
                movie.posterUrl.includes("undefined") ||
                movie.posterUrl.includes("placeholder");

            if (posterIsBroken) {
                broken.push({
                    id: movie._id,
                    title: movie.title,
                    posterUrl: movie.posterUrl || null,
                });
            }
        }

        return {
            total: movies.length,
            broken: broken.length,
            movies: broken.slice(0, 50), // Only return first 50
        };
    },
});

/**
 * Fix a single movie's poster
 */
export const fixSinglePoster = action({
    args: { movieId: v.id("movies") },
    handler: async (ctx, args) => {
        const movie = await ctx.runQuery(api.movies.getMovieById, { id: args.movieId });

        if (!movie) {
            throw new Error("Movie not found");
        }

        if (!movie.tmdbId) {
            throw new Error("Movie has no TMDB ID");
        }

        // Fetch fresh data from TMDB
        const tmdbData = await ctx.runAction(api.tmdb.fetchMovieFromTMDB, {
            tmdbId: movie.tmdbId,
        });

        if (!tmdbData.posterUrl) {
            throw new Error("No poster available on TMDB");
        }

        // Update movie
        await ctx.runMutation(api.movies.updateMovieImages, {
            id: args.movieId,
            posterUrl: tmdbData.posterUrl,
            backdropUrl: tmdbData.backdropUrl || undefined,
        });

        return {
            success: true,
            title: movie.title,
            newPosterUrl: tmdbData.posterUrl,
        };
    },
});
