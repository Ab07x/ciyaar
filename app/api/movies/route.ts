import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const isPublished = searchParams.get("isPublished");
        const isPremium = searchParams.get("isPremium");
        const isDubbed = searchParams.get("isDubbed");
        const isFeatured = searchParams.get("isFeatured");
        const limit = searchParams.get("limit");
        const category = searchParams.get("category");
        const featured = searchParams.get("featured");
        const top10 = searchParams.get("top10");
        const genre = searchParams.get("genre");
        const slug = searchParams.get("slug");
        const id = searchParams.get("id");
        const sort = searchParams.get("sort");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "50");

        // Single movie by slug
        if (slug) {
            const movie = await Movie.findOne({ slug }).lean();
            return NextResponse.json(movie || null);
        }

        // Single movie by ID
        if (id) {
            const movie = await Movie.findById(id).lean();
            return NextResponse.json(movie || null);
        }

        // Light fields for list/card views (skip heavy text content)
        const LIST_FIELDS = "title titleSomali slug posterUrl backdropUrl releaseDate views isPremium isDubbed isPublished genres isTop10 top10Order isFeatured featuredOrder category createdAt updatedAt rating";

        // Featured movies
        if (featured === "true") {
            const movies = await Movie.find({ isFeatured: true, isPublished: true })
                .select(LIST_FIELDS)
                .sort({ featuredOrder: 1 })
                .lean();
            return NextResponse.json(movies, {
                headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
            });
        }

        // Top 10
        if (top10 === "true") {
            const movies = await Movie.find({ isTop10: true, isPublished: true })
                .select(LIST_FIELDS)
                .sort({ top10Order: 1 })
                .limit(10)
                .lean();
            return NextResponse.json(movies, {
                headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
            });
        }

        // Build filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (isPublished !== null) filter.isPublished = isPublished !== "false";
        if (isPremium !== null && isPremium !== undefined) filter.isPremium = isPremium === "true";
        if (isDubbed !== null && isDubbed !== undefined) filter.isDubbed = isDubbed === "true";
        if (isFeatured !== null && isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
        if (category) filter.category = category;
        if (genre) filter.genres = genre;
        const tag = searchParams.get("tag");
        if (tag) filter.tags = tag;

        const skip = (page - 1) * pageSize;
        const limitNum = limit ? parseInt(limit) : pageSize;
        const isFull = searchParams.get("full") === "true";

        // Determine sort order
        let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
        if (sort === "views") {
            sortObj = { views: -1 };
        } else if (sort === "rating") {
            sortObj = { rating: -1 };
        } else if (sort === "title") {
            sortObj = { title: 1 };
        }

        const query = Movie.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Only return full docs when explicitly requested (e.g., admin edit)
        if (!isFull) {
            query.select(LIST_FIELDS);
        }

        const [movies, total] = await Promise.all([
            query.lean(),
            Movie.countDocuments(filter),
        ]);

        return NextResponse.json({ movies, total, page, pageSize: limitNum }, {
            headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
        });
    } catch (error) {
        console.error("GET /api/movies error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        if (!body.title || !body.slug) {
            return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
        }

        // Check for existing movie by tmdbId only (allow same-name movies with different dates)
        if (body.tmdbId) {
            const existingByTmdb = await Movie.findOne({ tmdbId: body.tmdbId });
            if (existingByTmdb) {
                return NextResponse.json(
                    { error: `Filimkaan horey ayuu u jiray (tmdbId: ${body.tmdbId}): "${existingByTmdb.title}". Edit-garee haddii aad rabto.` },
                    { status: 409 }
                );
            }
        }

        // Ensure unique slug — append year or index if needed
        let slug = body.slug;
        const existingBySlug = await Movie.findOne({ slug });
        if (existingBySlug) {
            const year = body.releaseDate ? body.releaseDate.split("-")[0] : "";
            if (year) {
                slug = `${body.slug}-${year}`;
            }
            // If slug with year also exists, append an incrementing number
            let counter = 1;
            let candidateSlug = slug;
            while (await Movie.findOne({ slug: candidateSlug })) {
                counter++;
                candidateSlug = `${slug}-${counter}`;
            }
            slug = candidateSlug;
        }
        body.slug = slug;

        const now = Date.now();
        const seoTitle = `Daawo ${body.title} ${body.isDubbed ? "Af-Somali" : ""} Online | Fanbroj`;
        const seoDescription = (body.overview || "").slice(0, 155) + "...";

        const movie = await Movie.create({
            ...body,
            overview: body.overview || "No description available.",
            posterUrl: body.posterUrl || "",
            releaseDate: body.releaseDate || "2026-01-01",
            genres: body.genres || [],
            cast: body.cast || [],
            seoTitle: body.seoTitle || seoTitle,
            seoDescription: body.seoDescription || seoDescription,
            views: 0,
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json(movie, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/movies error:", error);
        if (error.name === "ValidationError") {
            const fields = Object.keys(error.errors || {}).join(", ");
            return NextResponse.json({ error: `Validation failed: ${fields}. ${error.message}` }, { status: 400 });
        }
        if (error.code === 11000) {
            return NextResponse.json({ error: "Filimkaan horey ayuu u jiray (duplicate slug or tmdbId)" }, { status: 409 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const movie = await Movie.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: Date.now() },
            { new: true }
        ).lean();

        return NextResponse.json(movie);
    } catch (error) {
        console.error("PUT /api/movies error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        await Movie.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/movies error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
