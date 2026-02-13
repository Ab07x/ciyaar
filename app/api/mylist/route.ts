import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserMyList, Movie, Series, Match } from "@/lib/models";

// GET /api/mylist?userId=xxx — get all items with details
// GET /api/mylist?action=check&userId=xxx&contentType=movie&contentId=xxx — check if listed
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const action = searchParams.get("action");

        if (!userId) {
            return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        // Check if a specific item is in the list
        if (action === "check") {
            const contentType = searchParams.get("contentType");
            const contentId = searchParams.get("contentId");
            if (!contentType || !contentId) {
                return NextResponse.json({ isListed: false });
            }
            const item = await UserMyList.findOne({ userId, contentType, contentId }).lean();
            return NextResponse.json({ isListed: !!item });
        }

        // Get all items in user's list
        const items = await UserMyList.find({ userId }).sort({ addedAt: -1 }).lean();

        // Populate details for each item
        const populated = await Promise.all(
            items.map(async (item: any) => {
                let details = null;
                try {
                    if (item.contentType === "movie") {
                        details = await Movie.findById(item.contentId).lean();
                    } else if (item.contentType === "series") {
                        details = await Series.findById(item.contentId).lean();
                    } else if (item.contentType === "match") {
                        details = await Match.findById(item.contentId).lean();
                    }
                } catch {
                    // contentId might be invalid
                }
                return { ...item, details };
            })
        );

        return NextResponse.json(populated);
    } catch (error) {
        console.error("GET /api/mylist error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/mylist — toggle item (add if not exists, remove if exists)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { userId, contentType, contentId } = await req.json();

        if (!userId || !contentType || !contentId) {
            return NextResponse.json({ error: "userId, contentType, contentId required" }, { status: 400 });
        }

        // Check if already in list
        const existing = await UserMyList.findOne({ userId, contentType, contentId });

        if (existing) {
            await UserMyList.deleteOne({ _id: existing._id });
            return NextResponse.json({ action: "removed" });
        }

        await UserMyList.create({
            userId,
            contentType,
            contentId,
            addedAt: Date.now(),
        });

        return NextResponse.json({ action: "added" });
    } catch (error) {
        console.error("POST /api/mylist error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
