import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchAll = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        if (!args.query || args.query.length < 2) {
            return { matches: [], movies: [], series: [] };
        }

        const searchTerm = args.query.toLowerCase();

        // Fetch Data (Optimized to fetching necessary fields would be better, but Convex returns documents)
        const [allMatches, allMovies, allSeries] = await Promise.all([
            ctx.db.query("matches").order("desc").collect(),
            ctx.db.query("movies").withIndex("by_published", (q) => q.eq("isPublished", true)).collect(),
            ctx.db.query("series").withIndex("by_published", (q) => q.eq("isPublished", true)).collect(),
        ]);

        // Filter Matches
        const matches = allMatches.filter((m) =>
            m.title?.toLowerCase().includes(searchTerm) ||
            m.teamA?.toLowerCase().includes(searchTerm) ||
            m.teamB?.toLowerCase().includes(searchTerm) ||
            m.leagueName?.toLowerCase().includes(searchTerm)
        ).slice(0, 3);

        // Filter Movies
        const movies = allMovies.filter((m) =>
            m.title.toLowerCase().includes(searchTerm) ||
            m.titleSomali?.toLowerCase().includes(searchTerm)
        ).slice(0, 3);

        // Filter Series
        const series = allSeries.filter((s) =>
            s.title.toLowerCase().includes(searchTerm) ||
            s.titleSomali?.toLowerCase().includes(searchTerm)
        ).slice(0, 3);

        return { matches, movies, series };
    },
});
