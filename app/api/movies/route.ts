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
        const limit = searchParams.get("limit");
        const category = searchParams.get("category");
        const featured = searchParams.get("featured");
        const top10 = searchParams.get("top10");
        const genre = searchParams.get("genre");
        const slug = searchParams.get("slug");
        const id = searchParams.get("id");
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
        const LIST_FIELDS = "title titleSomali slug posterUrl backdropUrl releaseDate views isPremium isDubbed isPublished genres isTop10 top10Order isFeatured featuredOrder category createdAt updatedAt imdbRating";

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
        if (category) filter.category = category;
        if (genre) filter.genres = genre;

        const skip = (page - 1) * pageSize;
        const limitNum = limit ? parseInt(limit) : pageSize;
        const isFull = searchParams.get("full") === "true";

        const query = Movie.find(filter)
            .sort({ createdAt: -1 })
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

        const now = Date.now();
        const seoTitle = `Daawo ${body.title} ${body.isDubbed ? "Af-Somali" : ""} Online | Fanbroj`;
        const seoDescription = (body.overview || "").slice(0, 155) + "...";

        const movie = await Movie.create({
            ...body,
            seoTitle: body.seoTitle || seoTitle,
            seoDescription: body.seoDescription || seoDescription,
            views: 0,
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json(movie, { status: 201 });
    } catch (error) {
        console.error("POST /api/movies error:", error);
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
