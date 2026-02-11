import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Media } from "@/lib/models";

export async function GET() {
    try {
        await connectDB();
        const media = await Media.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json(media);
    } catch (error) {
        console.error("GET /api/media error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const media = await Media.create({ ...body, createdAt: now });
        return NextResponse.json(media, { status: 201 });
    } catch (error) {
        console.error("POST /api/media error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await Media.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/media error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
