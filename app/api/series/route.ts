import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Series, Episode } from "@/lib/models";

// GET /api/series
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");
        const id = searchParams.get("id");
        const published = searchParams.get("isPublished");

        if (slug) {
            const series = await Series.findOne({ slug }).lean();
            if (series) {
                // Also fetch episodes
                const episodes = await Episode.find({ seriesId: (series._id as string).toString() })
                    .sort({ seasonNumber: 1, episodeNumber: 1 })
                    .lean();
                return NextResponse.json({ ...series, episodes });
            }
            return NextResponse.json(null);
        }

        if (id) {
            const series = await Series.findById(id).lean();
            return NextResponse.json(series || null);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (published !== null && published !== undefined) filter.isPublished = published !== "false";

        const allSeries = await Series.find(filter).sort({ createdAt: -1 }).lean();
        return NextResponse.json(allSeries);
    } catch (error) {
        console.error("GET /api/series error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const series = await Series.create({ ...body, createdAt: now, updatedAt: now });
        return NextResponse.json(series, { status: 201 });
    } catch (error) {
        console.error("POST /api/series error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const series = await Series.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: Date.now() },
            { new: true }
        ).lean();
        return NextResponse.json(series);
    } catch (error) {
        console.error("PUT /api/series error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        await Series.findByIdAndDelete(id);
        // Also delete episodes
        await Episode.deleteMany({ seriesId: id });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/series error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
