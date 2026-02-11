import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";

// GET /api/movies/related?slug=xxx&limit=10
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");
        const limit = parseInt(searchParams.get("limit") || "10");

        if (!slug) {
            return NextResponse.json({ error: "slug is required" }, { status: 400 });
        }

        const currentMovie = await Movie.findOne({ slug }).lean();
        if (!currentMovie) return NextResponse.json([]);

        const allMovies = await Movie.find({ isPublished: true, slug: { $ne: slug } }).lean();

        const currentYear = currentMovie.releaseDate?.split("-")[0];
        const currentGenres = currentMovie.genres || [];

        const scoredMovies = allMovies
            .map((movie) => {
                let score = 0;
                const movieYear = movie.releaseDate?.split("-")[0];

                if (movieYear === currentYear) score += 3;
                if (movieYear && currentYear) {
                    const yearDiff = Math.abs(parseInt(movieYear) - parseInt(currentYear));
                    if (yearDiff === 1) score += 1;
                }

                const movieGenres = movie.genres || [];
                const matchingGenres = movieGenres.filter((g: string) => currentGenres.includes(g));
                score += matchingGenres.length * 2;

                if (movie.category && movie.category === currentMovie.category) score += 2;

                return { ...movie, score };
            })
            .filter((m) => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return NextResponse.json(scoredMovies);
    } catch (error) {
        console.error("GET /api/movies/related error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
