import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";

// GET /api/referrals/leaderboard?limit=5 — Top referrers
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "5", 10);

        const topUsers = await User.find({
            referralCode: { $exists: true, $ne: null },
            referralCount: { $gt: 0 },
        })
            .sort({ referralCount: -1 })
            .limit(limit)
            .select("displayName referralCount")
            .lean();

        const leaderboard = topUsers.map((u: any) => ({
            userId: u._id,
            name: u.displayName || "User",
            count: u.referralCount || 0,
        }));

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error("GET /api/referrals/leaderboard error:", error);
        return NextResponse.json([], { status: 200 });
    }
}
