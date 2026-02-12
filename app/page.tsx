import HomeClient from "./HomeClient";
import connectDB from "@/lib/mongodb";
import { Movie, Match } from "@/lib/models";

// Revalidate every 5 minutes for fresh content
export const revalidate = 300;

export default async function HomePage() {
    let initialMovies: any = { movies: [], total: 0 };
    let initialMatches: any = [];
    let initialTrending: any = { movies: [] };
    let initialHeroSlides: any = [];

    try {
        await connectDB();

        const [movies, matches, trending, heroSlidesRes] = await Promise.all([
            Movie.find({ isPublished: true })
                .select("title titleSomali slug posterUrl backdropUrl releaseDate rating genres isDubbed isPremium views runtime overview overviewSomali createdAt tags")
                .sort({ createdAt: -1 })
                .limit(1000)
                .lean()
                .catch(() => []),
            Match.find({ status: { $in: ["live", "upcoming"] } })
                .sort({ kickoffAt: 1 })
                .limit(20)
                .lean()
                .catch(() => []),
            Movie.find({ isPublished: true })
                .select("title titleSomali slug posterUrl releaseDate rating genres isDubbed isPremium views")
                .sort({ views: -1 })
                .limit(10)
                .lean()
                .catch(() => []),
            fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://fanbroj.net'}/api/hero-slides?auto=true`, { cache: 'no-store' })
                .then(r => r.ok ? r.json() : [])
                .catch(() => []),
        ]);

        // Serialize MongoDB objects (remove ObjectId etc)
        const serialize = (data: any) => JSON.parse(JSON.stringify(data));

        initialMovies = { movies: serialize(movies), total: movies.length };
        initialMatches = serialize(matches);
        initialTrending = { movies: serialize(trending) };
        initialHeroSlides = heroSlidesRes;
    } catch (e) {
        // DB not available at build time - client will fetch via SWR
    }

    return (
        <HomeClient
            initialMovies={initialMovies}
            initialMatches={initialMatches}
            initialTrending={initialTrending}
            initialHeroSlides={initialHeroSlides}
        />
    );
}
