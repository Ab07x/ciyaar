"use node";

import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// ============================================
// FETCH MISSING POSTER FROM TMDB/OMDB
// ============================================
export const fetchMissingPoster = action({
    args: {
        movieSlug: v.string(),
        source: v.optional(
            v.union(v.literal("tmdb"), v.literal("omdb"), v.literal("auto"))
        ),
    },
    handler: async (ctx, args) => {
        const source = args.source || "auto";

        // Get the movie from the database
        const movie = await ctx.runQuery(api.movies.getMovieBySlug, {
            slug: args.movieSlug,
        });

        if (!movie) {
            throw new Error(`Movie not found: ${args.movieSlug}`);
        }

        // If movie already has a valid poster, skip
        if (
            movie.posterUrl &&
            movie.posterUrl.startsWith("http") &&
            !movie.posterUrl.includes("placeholder")
        ) {
            return {
                success: true,
                message: "Movie already has a valid poster",
                posterUrl: movie.posterUrl,
            };
        }

        let posterUrl: string | undefined;
        let fetchSource: string = "none";

        // Try TMDB first
        if (source === "tmdb" || source === "auto") {
            if (movie.tmdbId) {
                try {
                    const tmdbResult = await ctx.runAction(api.tmdb.fetchMovieFromTMDB, {
                        tmdbId: movie.tmdbId,
                    });
                    if (tmdbResult.posterUrl) {
                        posterUrl = tmdbResult.posterUrl;
                        fetchSource = "tmdb";
                    }
                } catch (e) {
                    console.log(`TMDB fetch failed for ${args.movieSlug}:`, e);
                }
            }
        }

        // Try OMDB if TMDB failed or was skipped
        if (!posterUrl && (source === "omdb" || source === "auto")) {
            if (movie.imdbId) {
                try {
                    const omdbResult = await ctx.runAction(api.omdb.fetchMovieFromOMDB, {
                        imdbId: movie.imdbId,
                    });
                    if (omdbResult.posterUrl) {
                        posterUrl = omdbResult.posterUrl;
                        fetchSource = "omdb";
                    }
                } catch (e) {
                    console.log(`OMDB fetch failed for ${args.movieSlug}:`, e);
                }
            } else {
                // Try searching by title
                try {
                    const omdbResult = await ctx.runAction(api.omdb.fetchMovieFromOMDB, {
                        title: movie.title,
                        year: movie.releaseDate?.split("-")[0],
                    });
                    if (omdbResult.posterUrl) {
                        posterUrl = omdbResult.posterUrl;
                        fetchSource = "omdb-title-search";
                    }
                } catch (e) {
                    console.log(`OMDB title search failed for ${args.movieSlug}:`, e);
                }
            }
        }

        if (!posterUrl) {
            return {
                success: false,
                message: "Could not find poster from any source",
                movieSlug: args.movieSlug,
            };
        }

        // Update the movie with the new poster URL
        await ctx.runMutation(api.movies.updateMovie, {
            id: movie._id as any,
            posterUrl,
        });

        return {
            success: true,
            message: `Updated poster from ${fetchSource}`,
            posterUrl,
            source: fetchSource,
        };
    },
});

// ============================================
// BATCH FETCH MISSING POSTERS
// ============================================
export const batchFetchMissingPosters = action({
    args: {
        limit: v.optional(v.number()),
        source: v.optional(
            v.union(v.literal("tmdb"), v.literal("omdb"), v.literal("auto"))
        ),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 10;
        const source = args.source || "auto";

        // Get movies with missing/empty/placeholder posters
        const movies = await ctx.runQuery(
            internal.imageFetcher.getMoviesWithMissingPosters,
            { limit }
        );

        if (movies.length === 0) {
            return {
                success: true,
                message: "No movies with missing posters found",
                updated: 0,
                failed: 0,
            };
        }

        let updated = 0;
        let failed = 0;
        const results: Array<{ slug: string; success: boolean; error?: string }> = [];

        for (const movie of movies) {
            try {
                const result = await ctx.runAction(api.imageFetcher.fetchMissingPoster, {
                    movieSlug: movie.slug,
                    source,
                });

                if (result.success) {
                    updated++;
                } else {
                    failed++;
                }
                results.push({ slug: movie.slug, success: result.success });
            } catch (e: any) {
                failed++;
                results.push({
                    slug: movie.slug,
                    success: false,
                    error: e.message,
                });
            }
        }

        return {
            success: true,
            message: `Processed ${movies.length} movies`,
            updated,
            failed,
            results,
        };
    },
});

// ============================================
// INTERNAL QUERY: GET MOVIES WITH MISSING POSTERS
// ============================================
export const getMoviesWithMissingPosters = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const allMovies = await ctx.db
            .query("movies")
            .withIndex("by_published", (q) => q.eq("isPublished", true))
            .collect();

        // Filter for movies with missing/invalid posters
        const missingPosterMovies = allMovies.filter((movie) => {
            if (!movie.posterUrl) return true;
            if (movie.posterUrl === "") return true;
            if (movie.posterUrl.includes("placeholder")) return true;
            // Check for broken TMDB URLs (sometimes they become invalid)
            if (movie.posterUrl.includes("null") || movie.posterUrl.includes("undefined"))
                return true;
            return false;
        });

        return missingPosterMovies.slice(0, args.limit || 50);
    },
});

// ============================================
// FETCH AND DOWNLOAD POSTER (Save to Convex Storage)
// ============================================
export const fetchAndDownloadPoster = action({
    args: {
        movieSlug: v.string(),
    },
    handler: async (ctx, args) => {
        // First, fetch the poster URL
        const result = await ctx.runAction(api.imageFetcher.fetchMissingPoster, {
            movieSlug: args.movieSlug,
            source: "auto",
        });

        if (!result.success || !result.posterUrl) {
            return {
                success: false,
                message: "Could not fetch poster URL",
            };
        }

        // Now download and upload to Convex storage via API
        // This requires an HTTP request to our download API endpoint
        // For now, just return the poster URL (the next.js API will handle download)
        return {
            success: true,
            message: "Poster URL fetched successfully",
            posterUrl: result.posterUrl,
            note: "Use the /api/images/download endpoint to upload to storage",
        };
    },
});
