
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Episode } from "@/lib/models";

// GET /api/episodes?seriesId=... or ?id=...
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const seriesId = searchParams.get("seriesId");
        const id = searchParams.get("id");

        if (id) {
            const ep = await Episode.findById(id).lean();
            return NextResponse.json(ep || null);
        }

        if (seriesId) {
            const episodes = await Episode.find({ seriesId })
                .sort({ seasonNumber: 1, episodeNumber: 1 })
                .lean();
            return NextResponse.json(episodes);
        }

        return NextResponse.json([]);
    } catch (e) {
        console.error("GET /api/episodes error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST /api/episodes (Create new)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const ep = await Episode.create({ ...body, createdAt: now });
        return NextResponse.json(ep, { status: 201 });
    } catch (e) {
        console.error("POST /api/episodes error:", e);
        return NextResponse.json({ error: "Creation Failed" }, { status: 500 });
    }
}

// PUT /api/episodes (Update)
export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;

        // If ID is missing, treat as create (handling frontend quirk)
        if (!id) {
            const now = Date.now();
            const ep = await Episode.create({ ...updates, createdAt: now });
            return NextResponse.json(ep, { status: 201 });
        }

        const ep = await Episode.findByIdAndUpdate(id, updates, { new: true }).lean();
        return NextResponse.json(ep);
    } catch (e) {
        console.error("PUT /api/episodes error:", e);
        return NextResponse.json({ error: "Update Failed" }, { status: 500 });
    }
}

// DELETE /api/episodes?id=...
export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await Episode.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("DELETE /api/episodes error:", e);
        return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
    }
}
