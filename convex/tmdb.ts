"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// ============================================
// FETCH MOVIE FROM TMDB
// ============================================
export const fetchMovieFromTMDB = action({
    args: { tmdbId: v.number() },
    handler: async (ctx, args) => {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) throw new Error("TMDB_API_KEY not configured");

        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${args.tmdbId}?api_key=${apiKey}&append_to_response=credits,videos`
        );

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract director from crew
        const director = data.credits?.crew?.find(
            (c: any) => c.job === "Director"
        )?.name;

        // Extract top 5 cast
        const cast = (data.credits?.cast || []).slice(0, 5).map((c: any) => ({
            name: String(c.name || "Unknown"),
            character: String(c.character || "Unknown"),
            profileUrl: c.profile_path
                ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}`
                : undefined,
        }));

        // Generate slug from title
        const slug = (data.title || "untitled")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Extract YouTube trailer
        const trailer = (data.videos?.results || []).find(
            (v: any) => v.type === "Trailer" && v.site === "YouTube"
        );
        const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined;

        return {
            tmdbId: data.id,
            imdbId: data.imdb_id || undefined,
            title: data.title || "Untitled",
            overview: data.overview || "",
            posterUrl: data.poster_path
                ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}`
                : "",
            backdropUrl: data.backdrop_path
                ? `${TMDB_IMAGE_BASE}/w1280${data.backdrop_path}`
                : undefined,
            releaseDate: data.release_date || "",
            runtime: data.runtime || undefined,
            rating: typeof data.vote_average === 'number' ? data.vote_average : undefined,
            voteCount: typeof data.vote_count === 'number' ? data.vote_count : undefined,
            genres: (data.genres || []).map((g: any) => String(g.name || "")).filter(Boolean),
            cast,
            director,
            slug,
            trailerUrl,
        };
    },
});

// ============================================
// FETCH SERIES FROM TMDB
// ============================================
export const fetchSeriesFromTMDB = action({
    args: { tmdbId: v.number() },
    handler: async (ctx, args) => {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) throw new Error("TMDB_API_KEY not configured");

        const response = await fetch(
            `${TMDB_BASE_URL}/tv/${args.tmdbId}?api_key=${apiKey}&append_to_response=credits`
        );

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();

        const cast = (data.credits?.cast || []).slice(0, 5).map((c: any) => ({
            name: String(c.name || "Unknown"),
            character: String(c.character || "Unknown"),
            profileUrl: c.profile_path
                ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}`
                : undefined,
        }));

        const slug = (data.name || "untitled-series")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        return {
            tmdbId: data.id,
            title: data.name || "Untitled Series",
            overview: data.overview || "",
            posterUrl: data.poster_path
                ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}`
                : "",
            backdropUrl: data.backdrop_path
                ? `${TMDB_IMAGE_BASE}/w1280${data.backdrop_path}`
                : undefined,
            firstAirDate: data.first_air_date || "",
            lastAirDate: data.last_air_date || undefined,
            status: data.status || "Unknown",
            rating: typeof data.vote_average === 'number' ? data.vote_average : undefined,
            genres: (data.genres || []).map((g: any) => String(g.name || "")).filter(Boolean),
            cast,
            numberOfSeasons: data.number_of_seasons || 0,
            numberOfEpisodes: data.number_of_episodes || 0,
            slug,
        };
    },
});

// ============================================
// FETCH SEASON EPISODES FROM TMDB
// ============================================
export const fetchSeasonFromTMDB = action({
    args: { tmdbId: v.number(), seasonNumber: v.number() },
    handler: async (ctx, args) => {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) throw new Error("TMDB_API_KEY not configured");

        const response = await fetch(
            `${TMDB_BASE_URL}/tv/${args.tmdbId}/season/${args.seasonNumber}?api_key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            seasonNumber: data.season_number,
            episodes: (data.episodes || []).map((ep: any) => ({
                episodeNumber: ep.episode_number,
                title: ep.name,
                overview: ep.overview || undefined,
                stillUrl: ep.still_path
                    ? `${TMDB_IMAGE_BASE}/w300${ep.still_path}`
                    : undefined,
                airDate: ep.air_date || undefined,
                runtime: ep.runtime || undefined,
            })),
        };
    },
});

// ============================================
// SEARCH TMDB
// ============================================
export const searchTMDB = action({
    args: { query: v.string(), type: v.union(v.literal("movie"), v.literal("tv")) },
    handler: async (ctx, args) => {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) throw new Error("TMDB_API_KEY not configured");

        const response = await fetch(
            `${TMDB_BASE_URL}/search/${args.type}?api_key=${apiKey}&query=${encodeURIComponent(args.query)}`
        );

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();

        return (data.results || []).slice(0, 10).map((item: any) => ({
            id: item.id,
            title: args.type === "movie" ? item.title : item.name,
            posterUrl: item.poster_path
                ? `${TMDB_IMAGE_BASE}/w154${item.poster_path}`
                : undefined,
            year: (args.type === "movie" ? item.release_date : item.first_air_date)?.split("-")[0] || "",
            rating: item.vote_average,
        }));
    },
});
