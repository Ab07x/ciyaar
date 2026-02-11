import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PromoBanner } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const activeOnly = searchParams.get("active");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (type) filter.type = type;
        if (activeOnly === "true") filter.isActive = true;

        const banners = await PromoBanner.find(filter).sort({ priority: -1 }).lean();
        return NextResponse.json(banners);
    } catch (error) {
        console.error("GET /api/banners error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const banner = await PromoBanner.create({ ...body, createdAt: now, updatedAt: now });
        return NextResponse.json(banner, { status: 201 });
    } catch (error) {
        console.error("POST /api/banners error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const banner = await PromoBanner.findByIdAndUpdate(id, { ...updates, updatedAt: Date.now() }, { new: true }).lean();
        return NextResponse.json(banner);
    } catch (error) {
        console.error("PUT /api/banners error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await PromoBanner.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/banners error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
