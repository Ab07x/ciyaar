import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { HeroSlide, Movie, Series } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get("activeOnly");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (activeOnly === "true") filter.isActive = true;

        const slides = await HeroSlide.find(filter).sort({ order: 1 }).lean();

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
