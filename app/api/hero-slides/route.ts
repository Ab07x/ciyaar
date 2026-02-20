import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { HeroSlide, Movie, Series } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get("activeOnly");
        const auto = searchParams.get("auto");

        // Auto-rotate mode: return 8 mixed hero slides
        // Rotates every 4 hours (6 rotations per day)
        // Mix: admin-featured (max 3) + new movies (last 14d) + trending (50+ views) — randomised
        if (auto === "true") {
            const now = new Date();
            const block = Math.floor(now.getHours() / 4); // 0-5 (every 4hrs)
            const daysSinceEpoch = Math.floor(now.getTime() / 86400000);
            const seed = daysSinceEpoch * 6 + block; // unique per 4-hour window

            // Seeded pseudo-random (mulberry32) for deterministic shuffle per block
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

            const MAX_SLIDES = 8;
            const MAX_FEATURED = 3; // cap admin-featured so rotation stays fresh
            const MIN_VIEWS_TRENDING = 50;
            const NEW_MOVIE_DAYS = 14;

            const usedSlugs = new Set<string>();
            const finalMovies: any[] = [];

            // 1) Admin-featured (max 3, shuffled so they rotate position)
            const featuredMovies = await Movie.find({
                isPublished: true,
                isFeatured: true,
                backdropUrl: { $exists: true, $ne: "" },
            })
                .select("title titleSomali slug posterUrl backdropUrl genres rating releaseDate isDubbed isPremium views overview overviewSomali createdAt featuredOrder")
                .lean();

            const shuffledFeatured = shuffle(featuredMovies).slice(0, MAX_FEATURED);
            for (const m of shuffledFeatured) {
                finalMovies.push(m);
                usedSlugs.add(m.slug);
            }

            // 2) New movies (uploaded in last 14 days with a backdrop)
            const cutoffMs = now.getTime() - NEW_MOVIE_DAYS * 86400000;
            const newMovies = await Movie.find({
                isPublished: true,
                backdropUrl: { $exists: true, $ne: "" },
                createdAt: { $gte: cutoffMs },
            })
                .select("title titleSomali slug posterUrl backdropUrl genres rating releaseDate isDubbed isPremium views overview overviewSomali createdAt")
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            const newFiltered = shuffle(newMovies.filter((m: any) => !usedSlugs.has(m.slug)));
            const newSlots = Math.min(2, MAX_SLIDES - finalMovies.length, newFiltered.length);
            for (let i = 0; i < newSlots; i++) {
                finalMovies.push(newFiltered[i]);
                usedSlugs.add(newFiltered[i].slug);
            }

            // 3) Trending movies (50+ views, randomly picked)
            const trendingMovies = await Movie.find({
                isPublished: true,
                backdropUrl: { $exists: true, $ne: "" },
                views: { $gte: MIN_VIEWS_TRENDING },
            })
                .select("title titleSomali slug posterUrl backdropUrl genres rating releaseDate isDubbed isPremium views overview overviewSomali createdAt")
                .lean();

            const trendingFiltered = shuffle(trendingMovies.filter((m: any) => !usedSlugs.has(m.slug)));
            const trendingSlots = Math.min(MAX_SLIDES - finalMovies.length, trendingFiltered.length);
            for (let i = 0; i < trendingSlots; i++) {
                finalMovies.push(trendingFiltered[i]);
                usedSlugs.add(trendingFiltered[i].slug);
            }

            // 4) Fill any remaining with random published movies
            if (finalMovies.length < MAX_SLIDES) {
                const filler = await Movie.find({
                    isPublished: true,
                    backdropUrl: { $exists: true, $ne: "" },
                    slug: { $nin: [...usedSlugs] },
                })
                    .select("title titleSomali slug posterUrl backdropUrl genres rating releaseDate isDubbed isPremium views overview overviewSomali createdAt")
                    .lean();

                const shuffledFiller = shuffle(filler);
                const fillerSlots = Math.min(MAX_SLIDES - finalMovies.length, shuffledFiller.length);
                for (let i = 0; i < fillerSlots; i++) {
                    finalMovies.push(shuffledFiller[i]);
                }
            }

            // Final shuffle so featured/new/trending aren't always in the same position
            const result = shuffle(finalMovies);

            const autoSlides = result.map((m: any, i: number) => ({
                _id: `auto-${i}`,
                contentType: "movie",
                contentId: m.slug,
                title: m.titleSomali || m.title,
                subtitle: m.genres?.slice(0, 3).join(" • ") || "",
                imageUrl: m.backdropUrl,
                order: i,
                isActive: true,
                isAuto: true,
                content: m,
            }));

            return NextResponse.json(autoSlides, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (activeOnly === "true") filter.isActive = true;

        const slides = await HeroSlide.find(filter).sort({ order: 1 }).lean();

        // If no manual slides and activeOnly requested, fall back to auto
        if (activeOnly === "true" && slides.length === 0) {
            const movies = await Movie.find({
                isPublished: true,
                backdropUrl: { $exists: true, $ne: "" },
            })
                .select("title titleSomali slug posterUrl backdropUrl genres rating releaseDate isDubbed isPremium")
                .sort({ views: -1 })
                .limit(8)
                .lean();

            const autoSlides = movies.map((m: any, i: number) => ({
                _id: `auto-${i}`,
                contentType: "movie",
                contentId: m.slug,
                title: m.titleSomali || m.title,
                subtitle: m.genres?.slice(0, 3).join(" • ") || "",
                imageUrl: m.backdropUrl,
                order: i,
                isActive: true,
                isAuto: true,
                content: m,
            }));

            return NextResponse.json(autoSlides);
        }

        // Hydrate content data for each slide
        const hydrated = await Promise.all(
            slides.map(async (slide: any) => {
                let content = null;
                if (slide.contentType === "movie" && slide.contentId) {
                    content = await Movie.findOne({ slug: slide.contentId }).select("title posterUrl backdropUrl slug").lean();
                } else if (slide.contentType === "series" && slide.contentId) {
                    content = await Series.findOne({ slug: slide.contentId }).select("title posterUrl backdropUrl slug").lean();
                }
                return { ...slide, content };
            })
        );

        return NextResponse.json(hydrated);
    } catch (error) {
        console.error("GET /api/hero-slides error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const slide = await HeroSlide.create({ ...body, createdAt: now, updatedAt: now });
        return NextResponse.json(slide, { status: 201 });
    } catch (error) {
        console.error("POST /api/hero-slides error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const slide = await HeroSlide.findByIdAndUpdate(id, { ...updates, updatedAt: Date.now() }, { new: true }).lean();
        return NextResponse.json(slide);
    } catch (error) {
        console.error("PUT /api/hero-slides error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        // Bulk reorder: expects { slides: [{id, order}, ...] }
        if (Array.isArray(body.slides)) {
            const ops = body.slides.map((s: { id: string; order: number }) => ({
                updateOne: {
                    filter: { _id: s.id },
                    update: { $set: { order: s.order, updatedAt: Date.now() } },
                },
            }));
            await HeroSlide.bulkWrite(ops);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    } catch (error) {
        console.error("PATCH /api/hero-slides error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await HeroSlide.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/hero-slides error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
