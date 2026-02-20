import HomeClient from "./HomeClient";
import connectDB from "@/lib/mongodb";
import { Movie, Match } from "@/lib/models";

// Revalidate every 2 minutes for fresh hero slides & content
export const revalidate = 120;

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
            Movie.find({
                isPublished: true,
                backdropUrl: { $exists: true, $ne: "" },
            })
                .select("title titleSomali slug posterUrl backdropUrl genres rating releaseDate isDubbed isPremium views overview overviewSomali createdAt isFeatured")
                .lean()
                .then((allMovies: any[]) => {
                    const now = new Date();
                    const block = Math.floor(now.getHours() / 4);
                    const daysSinceEpoch = Math.floor(now.getTime() / 86400000);
                    const seed = daysSinceEpoch * 6 + block;
                    // Seeded shuffle (mulberry32)
                    function seededRandom(s: number) {
                        return function () {
                            s |= 0; s = s + 0x6D2B79F5 | 0;
                            let t = Math.imul(s ^ s >>> 15, 1 | s);
                            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
                            return ((t ^ t >>> 14) >>> 0) / 4294967296;
                        };
                    }
                    const rand = seededRandom(seed);
                    function shuffle<T>(arr: T[]): T[] {
                        const a = [...arr];
                        for (let i = a.length - 1; i > 0; i--) {
                            const j = Math.floor(rand() * (i + 1));
                            [a[i], a[j]] = [a[j], a[i]];
                        }
                        return a;
                    }
                    const usedSlugs = new Set<string>();
                    const result: any[] = [];
                    // Featured (max 3)
                    const featured = shuffle(allMovies.filter((m: any) => m.isFeatured)).slice(0, 3);
                    for (const m of featured) { result.push(m); usedSlugs.add(m.slug); }
                    // New (last 14 days, max 2)
                    const cutoffMs = now.getTime() - 14 * 86400000;
                    const newMovies = shuffle(allMovies.filter((m: any) => !usedSlugs.has(m.slug) && (m.createdAt || 0) >= cutoffMs));
                    for (const m of newMovies.slice(0, 2)) { result.push(m); usedSlugs.add(m.slug); }
                    // Trending 50+ views
                    const trending = shuffle(allMovies.filter((m: any) => !usedSlugs.has(m.slug) && (m.views || 0) >= 50));
                    for (const m of trending.slice(0, 8 - result.length)) { result.push(m); usedSlugs.add(m.slug); }
                    // Filler
                    if (result.length < 8) {
                        const filler = shuffle(allMovies.filter((m: any) => !usedSlugs.has(m.slug)));
                        for (const m of filler.slice(0, 8 - result.length)) result.push(m);
                    }
                    return shuffle(result).map((m: any, i: number) => ({
                        _id: `auto-${i}`, contentType: "movie", contentId: m.slug,
                        title: m.titleSomali || m.title, subtitle: m.genres?.slice(0, 3).join(" • ") || "",
                        imageUrl: m.backdropUrl, order: i, isActive: true, isAuto: true, content: m,
                    }));
                })
                .catch(() => []),
        ]);

        // Serialize MongoDB objects (remove ObjectId etc)
        const serialize = (data: any) => JSON.parse(JSON.stringify(data));

        initialMovies = { movies: serialize(movies), total: movies.length };
        initialMatches = serialize(matches);
        initialTrending = { movies: serialize(trending) };
        initialHeroSlides = serialize(heroSlidesRes);
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
