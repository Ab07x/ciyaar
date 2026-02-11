
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const type = searchParams.get("type") || "movie"; // 'movie' or 'tv'

    if (!query) return NextResponse.json({ results: [] });

    const apiKey = process.env.TMDB_API_KEY;
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const results = (data.results || []).map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            year: (item.release_date || item.first_air_date || "").substring(0, 4),
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            overview: item.overview
        }));

        return NextResponse.json({ results });
    } catch (e) {
        console.error("TMDB Search Error:", e);
        return NextResponse.json({ error: "Failed to search TMDB" }, { status: 500 });
    }
}
