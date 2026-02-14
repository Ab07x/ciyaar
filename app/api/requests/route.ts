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

// POST /api/requests — create a content request or vote on existing
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { userId, tmdbId, type, title, posterUrl, year } = body;

        if (!userId || !tmdbId || !title) {
            return NextResponse.json({ error: "userId, tmdbId, and title are required" }, { status: 400 });
        }

        // Check if this content was already requested
        const existing = await ContentRequest.findOne({ tmdbId, type: type || "movie" });

        if (existing) {
            // Check if this user already voted
            const existingVoters = (existing as any).voters || [];
            if (existingVoters.includes(userId)) {
                return NextResponse.json({ status: "already_voted" });
            }

            // Add vote
            await ContentRequest.findByIdAndUpdate(existing._id, {
                $inc: { votes: 1 },
                $addToSet: { voters: userId },
                updatedAt: Date.now(),
            });
            return NextResponse.json({ status: "voted" });
        }

        // Create new request
        const now = Date.now();
        const request = await ContentRequest.create({
            userId,
            tmdbId,
            type: type || "movie",
            title,
            posterUrl: posterUrl || "",
            year: year || "",
            votes: 1,
            voters: [userId],
            status: "pending",
            createdAt: now,
        });

        return NextResponse.json({ status: "created", request }, { status: 201 });
    } catch (error) {
        console.error("POST /api/requests error:", error);
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

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await ContentRequest.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/requests error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
