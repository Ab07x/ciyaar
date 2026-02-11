import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";

// POST /api/movies/views — increment movie views
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        await Movie.findByIdAndUpdate(id, { $inc: { views: 1 } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/movies/views error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
