import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Short } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");

        const shorts = await Short.find().sort({ createdAt: -1 }).limit(limit).lean();
        return NextResponse.json(shorts);
    } catch (error) {
        console.error("GET /api/shorts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const short = await Short.create({ ...body, createdAt: now, updatedAt: now });
        return NextResponse.json(short, { status: 201 });
    } catch (error) {
        console.error("POST /api/shorts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const short = await Short.findByIdAndUpdate(id, { ...updates, updatedAt: Date.now() }, { new: true }).lean();
        return NextResponse.json(short);
    } catch (error) {
        console.error("PUT /api/shorts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await Short.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/shorts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
