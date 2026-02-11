import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Match } from "@/lib/models";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const match = await Match.findById(id).lean();
        if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(match);
    } catch (error) {
        console.error("GET /api/matches/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const match = await Match.findByIdAndUpdate(
            id,
            { ...body, updatedAt: Date.now() },
            { new: true }
        ).lean();
        if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(match);
    } catch (error) {
        console.error("PUT /api/matches/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        await Match.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/matches/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
