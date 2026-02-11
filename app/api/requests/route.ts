import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ContentRequest } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "100");
        const requests = await ContentRequest.find().sort({ createdAt: -1 }).limit(limit).lean();
        return NextResponse.json(requests);
    } catch (error) {
        console.error("GET /api/requests error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, status } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const request = await ContentRequest.findByIdAndUpdate(id, { status, updatedAt: Date.now() }, { new: true }).lean();
        return NextResponse.json(request);
    } catch (error) {
        console.error("PUT /api/requests error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
