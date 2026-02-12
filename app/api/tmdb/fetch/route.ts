
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tmdbId = searchParams.get("tmdbId");
    const type = searchParams.get("type") || "movie"; // 'movie' or 'tv'

    if (!tmdbId) return NextResponse.json({ error: "tmdbId required" }, { status: 400 });

    const apiKey = process.env.TMDB_API_KEY;
    // Append fields for detailed info
    const append = type === "movie"
        ? "credits,videos,keywords,release_dates,external_ids"
        : "credits,videos,keywords,content_ratings,external_ids";

    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${apiKey}&append_to_response=${append}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("TMDB fetch failed: " + res.status);
        const data = await res.json();

        // Common Fields
        const id = data.id;
        const title = data.title || data.name;
        const resultSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const overview = data.overview;
        const posterUrl = data.poster_path ? `https://image.tmdb.org/t/p/original${data.poster_path}` : null;
        const backdropUrl = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null;
        const genres = (data.genres || []).map((g: any) => g.name);
        const cast = (data.credits?.cast || []).slice(0, 5).map((c: any) => ({
            name: c.name,
            character: c.character,
            profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
        }));

        // Videos
        const videos = data.videos?.results || [];
        const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
        const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "";

        // Specific fields
        let releaseDate = "";
        let runtime = 0;
        let director = "";

        if (type === "movie") {
            releaseDate = data.release_date;
            runtime = data.runtime || 0;
            const crew = data.credits?.crew || [];
            director = crew.find((c: any) => c.job === "Director")?.name || "";
        } else {
            // TV
            releaseDate = data.first_air_date;
            runtime = data.episode_run_time ? data.episode_run_time[0] : 0;
            // TV shows often have 'Created By' instead of Director
            const created = data.created_by || [];
            director = created.length > 0 ? created[0].name : "";
        }

        const responseData = {
            tmdbId: id,
            imdbId: data.imdb_id || data.external_ids?.imdb_id || "",
            slug: resultSlug || `movie-${id}`,
            title: title || `Movie ${id}`,
            overview: overview || "No description available.",
            posterUrl: posterUrl || "",
            backdropUrl: backdropUrl || "",
            releaseDate: releaseDate || "2026-01-01",
            firstAirDate: releaseDate || data.first_air_date || "",
            lastAirDate: data.last_air_date || "",
            runtime,
            rating: data.vote_average || 0,
            voteCount: data.vote_count || 0,
            genres,
            cast,
            director,
            trailerUrl,
            status: data.status,
            numberOfSeasons: data.number_of_seasons,
            numberOfEpisodes: data.number_of_episodes,
        };

        return NextResponse.json(responseData);

    } catch (e) {
        console.error("TMDB Fetch Error:", e);
        return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
    }
}
