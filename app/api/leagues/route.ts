import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { League } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const league = await League.findById(id).lean();
            return NextResponse.json(league || null);
        }

        const leagues = await League.find().sort({ name: 1 }).lean();
        return NextResponse.json(leagues);
    } catch (error) {
        console.error("GET /api/leagues error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const league = await League.create(body);
        return NextResponse.json(league, { status: 201 });
    } catch (error) {
        console.error("POST /api/leagues error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const league = await League.findByIdAndUpdate(id, updates, { new: true }).lean();
        return NextResponse.json(league);
    } catch (error) {
        console.error("PUT /api/leagues error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        await League.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/leagues error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
