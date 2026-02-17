import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { HeroSlide, Movie, Series } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get("activeOnly");
        const auto = searchParams.get("auto");

        // Auto-rotate mode: return 8 random published movies with backdrops
        // Rotates every 24 hours using date as seed
        if (auto === "true") {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD as seed
            const seedNum = today.split("-").join("").slice(-6);

            // First, get manually featured movies (admin-selected)
            const featuredMovies = await Movie.find({
                isPublished: true,
                isFeatured: true,
                backdropUrl: { $exists: true, $ne: "" },
            })
                .select("title titleSomali slug posterUrl backdropUrl genres rating releaseDate isDubbed isPremium featuredOrder")
                .sort({ featuredOrder: 1 })
                .lean();

            const MAX_SLIDES = 8;
            let finalMovies: any[] = [...featuredMovies].slice(0, MAX_SLIDES);

            // Fill remaining slots with random popular movies if needed
            if (finalMovies.length < MAX_SLIDES) {
                const featuredSlugs = new Set(finalMovies.map((m: any) => m.slug));
                const otherMovies = await Movie.find({
                    isPublished: true,
                    isFeatured: { $ne: true },
                    backdropUrl: { $exists: true, $ne: "" },
                })
                    .select("title titleSomali slug posterUrl backdropUrl genres rating releaseDate isDubbed isPremium")
                    .lean();

                // Deterministic shuffle for non-featured
                const shuffled = otherMovies
                    .filter((m: any) => !featuredSlugs.has(m.slug))
                    .map((m: any, i: number) => ({
                        ...m,
                        _sortKey: ((i + 1) * parseInt(seedNum)) % (otherMovies.length + 1),
                    }))
                    .sort((a: any, b: any) => a._sortKey - b._sortKey)
                    .slice(0, MAX_SLIDES - finalMovies.length);

                finalMovies = [...finalMovies, ...shuffled];
            }

            const autoSlides = finalMovies.map((m: any, i: number) => ({
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
                headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
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
