import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Match } from "@/lib/models";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { ids, status } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "ids array is required" }, { status: 400 });
        }

        if (!["upcoming", "live", "finished"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await Match.updateMany(
            { _id: { $in: ids } },
            { $set: { status, updatedAt: Date.now() } }
        );

        return NextResponse.json({ success: true, updated: ids.length });
    } catch (error) {
        console.error("POST /api/matches/bulk-status error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
