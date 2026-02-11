import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SearchAnalytics } from "@/lib/models";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { searchId, clickedItem, clickedItemType } = body;

        if (!searchId || !clickedItem) {
            return NextResponse.json({ error: "searchId and clickedItem are required" }, { status: 400 });
        }

        await SearchAnalytics.findByIdAndUpdate(searchId, {
            $set: {
                clickedItem,
                clickedItemType,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/search-analytics/click error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
