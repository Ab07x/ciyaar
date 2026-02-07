"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// OMDB/IMDB API Integration
// Similar to TMDB but uses IMDB IDs
// API Key: Get from https://www.omdbapi.com/apikey.aspx

const OMDB_BASE_URL = "https://www.omdbapi.com";

// ============================================
// FETCH MOVIE FROM OMDB/IMDB
// ============================================
export const fetchMovieFromOMDB = action({
    args: {
        imdbId: v.optional(v.string()), // tt1234567 format
        title: v.optional(v.string()),
        year: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.OMDB_API_KEY;
        if (!apiKey) throw new Error("OMDB_API_KEY not configured");

        if (!args.imdbId && !args.title) {
            throw new Error("Either imdbId or title is required");
        }

        // Build query params
        let url = `${OMDB_BASE_URL}/?apikey=${apiKey}`;
        if (args.imdbId) {
            url += `&i=${args.imdbId}`;
        } else {
            url += `&t=${encodeURIComponent(args.title!)}`;
            if (args.year) url += `&y=${args.year}`;
        }
        url += "&plot=full";

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OMDB API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Response === "False") {
            throw new Error(data.Error || "Movie not found on IMDB");
        }

        // Parse runtime (e.g., "142 min" -> 142)
        const runtimeMatch = data.Runtime?.match(/(\d+)/);
        const runtime = runtimeMatch ? parseInt(runtimeMatch[1], 10) : undefined;

        // Parse rating
        const rating = data.imdbRating ? parseFloat(data.imdbRating) : undefined;
        const voteCount = data.imdbVotes
            ? parseInt(data.imdbVotes.replace(/,/g, ""), 10)
            : undefined;

        // Parse year
        const year = data.Year?.split("–")[0] || data.Year || "";

        // Generate SEO-friendly slug
        const rawSlug = (data.Title || "untitled")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        const slug = `${rawSlug}${year ? `-${year}` : ""}`;

        // Parse genres
        const genres = (data.Genre || "")
            .split(",")
            .map((g: string) => g.trim())
            .filter(Boolean);

        // Parse cast
        const actors = (data.Actors || "").split(",").map((a: string) => a.trim());
        const cast = actors.slice(0, 5).map((name: string) => ({
            name,
            character: "Unknown",
            profileUrl: undefined,
        }));

        // Get poster URL (IMDB provides a URL directly)
        const posterUrl =
            data.Poster && data.Poster !== "N/A" ? data.Poster : undefined;

        return {
            imdbId: data.imdbID,
            title: data.Title || "Untitled",
            overview: data.Plot || "",
            posterUrl,
            releaseDate: data.Released !== "N/A" ? data.Released : `${year}-01-01`,
            runtime,
            rating,
            voteCount,
            genres,
            cast,
            director: data.Director !== "N/A" ? data.Director : undefined,
            writer: data.Writer !== "N/A" ? data.Writer : undefined,
            slug,
            // SEO Fields
            seoKeywords: genres,
            seoTitle: `${data.Title} (${year}) - Watch Online`,
            seoDescription: data.Plot
                ? data.Plot.substring(0, 155) + "..."
                : "",
            ratingMpaa: data.Rated !== "N/A" ? data.Rated : "",
            // Additional OMDB-specific fields
            awards: data.Awards !== "N/A" ? data.Awards : undefined,
            boxOffice: data.BoxOffice !== "N/A" ? data.BoxOffice : undefined,
            production: data.Production !== "N/A" ? data.Production : undefined,
            country: data.Country !== "N/A" ? data.Country : undefined,
            language: data.Language !== "N/A" ? data.Language : undefined,
            metascore: data.Metascore !== "N/A" ? parseInt(data.Metascore, 10) : undefined,
            rottenTomatoesScore: (() => {
                const rt = (data.Ratings || []).find(
                    (r: any) => r.Source === "Rotten Tomatoes"
                );
                return rt ? rt.Value : undefined;
            })(),
        };
    },
});

// ============================================
// SEARCH OMDB/IMDB
// ============================================
export const searchOMDB = action({
    args: {
        query: v.string(),
        type: v.optional(v.union(v.literal("movie"), v.literal("series"))),
        year: v.optional(v.string()),
        page: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.OMDB_API_KEY;
        if (!apiKey) throw new Error("OMDB_API_KEY not configured");

        let url = `${OMDB_BASE_URL}/?apikey=${apiKey}&s=${encodeURIComponent(args.query)}`;
        if (args.type) url += `&type=${args.type}`;
        if (args.year) url += `&y=${args.year}`;
        if (args.page) url += `&page=${args.page}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OMDB API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Response === "False") {
            return { results: [], totalResults: 0 };
        }

        const results = (data.Search || []).map((item: any) => ({
            imdbId: item.imdbID,
            title: item.Title,
            year: item.Year,
            type: item.Type,
            posterUrl: item.Poster !== "N/A" ? item.Poster : undefined,
        }));

        return {
            results,
            totalResults: parseInt(data.totalResults || "0", 10),
        };
    },
});

// ============================================
// FETCH SERIES FROM OMDB/IMDB
// ============================================
export const fetchSeriesFromOMDB = action({
    args: {
        imdbId: v.optional(v.string()),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.OMDB_API_KEY;
        if (!apiKey) throw new Error("OMDB_API_KEY not configured");

        if (!args.imdbId && !args.title) {
            throw new Error("Either imdbId or title is required");
        }

        let url = `${OMDB_BASE_URL}/?apikey=${apiKey}&type=series`;
        if (args.imdbId) {
            url += `&i=${args.imdbId}`;
        } else {
            url += `&t=${encodeURIComponent(args.title!)}`;
        }
        url += "&plot=full";

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OMDB API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Response === "False") {
            throw new Error(data.Error || "Series not found on IMDB");
        }

        const yearParts = (data.Year || "").split("–");
        const firstAirYear = yearParts[0] || "";
        const lastAirYear = yearParts[1] || undefined;

        const rawSlug = (data.Title || "untitled-series")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        const slug = `${rawSlug}${firstAirYear ? `-${firstAirYear}` : ""}`;

        const genres = (data.Genre || "")
            .split(",")
            .map((g: string) => g.trim())
            .filter(Boolean);

        const actors = (data.Actors || "").split(",").map((a: string) => a.trim());
        const cast = actors.slice(0, 5).map((name: string) => ({
            name,
            character: "Unknown",
            profileUrl: undefined,
        }));

        const rating = data.imdbRating ? parseFloat(data.imdbRating) : undefined;
        const totalSeasons = data.totalSeasons
            ? parseInt(data.totalSeasons, 10)
            : 1;

        return {
            imdbId: data.imdbID,
            title: data.Title || "Untitled Series",
            overview: data.Plot || "",
            posterUrl: data.Poster !== "N/A" ? data.Poster : undefined,
            firstAirDate: firstAirYear ? `${firstAirYear}-01-01` : "",
            lastAirDate: lastAirYear ? `${lastAirYear}-12-31` : undefined,
            status: lastAirYear ? "Ended" : "Returning Series",
            rating,
            genres,
            cast,
            numberOfSeasons: totalSeasons,
            numberOfEpisodes: 0, // OMDB doesn't provide this directly
            slug,
            director: data.Director !== "N/A" ? data.Director : undefined,
            writer: data.Writer !== "N/A" ? data.Writer : undefined,
        };
    },
});

// ============================================
// FETCH SEASON EPISODES FROM OMDB
// ============================================
export const fetchSeasonFromOMDB = action({
    args: {
        imdbId: v.string(),
        seasonNumber: v.number(),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.OMDB_API_KEY;
        if (!apiKey) throw new Error("OMDB_API_KEY not configured");

        const url = `${OMDB_BASE_URL}/?apikey=${apiKey}&i=${args.imdbId}&Season=${args.seasonNumber}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OMDB API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Response === "False") {
            throw new Error(data.Error || "Season not found");
        }

        return {
            seasonNumber: args.seasonNumber,
            episodes: (data.Episodes || []).map((ep: any) => ({
                episodeNumber: parseInt(ep.Episode, 10),
                title: ep.Title,
                airDate: ep.Released !== "N/A" ? ep.Released : undefined,
                rating: ep.imdbRating !== "N/A" ? parseFloat(ep.imdbRating) : undefined,
                imdbId: ep.imdbID,
            })),
        };
    },
});
