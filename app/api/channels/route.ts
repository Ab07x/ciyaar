import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Channel } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");
        const category = searchParams.get("category");
        const isLive = searchParams.get("isLive");
        const isPremium = searchParams.get("isPremium");

        if (slug) {
            const channel = await Channel.findOne({ slug }).lean();
            return NextResponse.json(channel || null);
        }

        const filter: Record<string, unknown> = {};
        if (category) filter.category = category;
        if (isLive !== null) filter.isLive = isLive === "true";
        if (isPremium !== null) filter.isPremium = isPremium === "true";

        const channels = await Channel.find(filter).sort({ priority: -1 }).lean();
        return NextResponse.json(channels);
    } catch (error) {
        console.error("GET /api/channels error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const channel = await Channel.create({ ...body, createdAt: now, updatedAt: now });
        return NextResponse.json(channel, { status: 201 });
    } catch (error) {
        console.error("POST /api/channels error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const channel = await Channel.findByIdAndUpdate(id, { ...updates, updatedAt: Date.now() }, { new: true }).lean();
        return NextResponse.json(channel);
    } catch (error) {
        console.error("PUT /api/channels error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await Channel.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/channels error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
