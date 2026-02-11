import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Ad } from "@/lib/models";

// GET /api/ads?slotKey=xxx or GET /api/ads (all)
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const slotKey = searchParams.get("slotKey");
        const enabledOnly = searchParams.get("enabledOnly");

        if (slotKey) {
            const ad = await Ad.findOne({ slotKey }).lean();
            return NextResponse.json(ad || null);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (enabledOnly === "true") filter.enabled = true;

        const ads = await Ad.find(filter).lean();
        return NextResponse.json(ads);
    } catch (error) {
        console.error("GET /api/ads error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/ads — create ad slot
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const ad = await Ad.create(body);
        return NextResponse.json(ad, { status: 201 });
    } catch (error) {
        console.error("POST /api/ads error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/ads — update ad slot
export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const ad = await Ad.findByIdAndUpdate(id, updates, { new: true }).lean();
        return NextResponse.json(ad);
    } catch (error) {
        console.error("PUT /api/ads error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/ads?id=xxx — delete ad slot
export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await Ad.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/ads error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
