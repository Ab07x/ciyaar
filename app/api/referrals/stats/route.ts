import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";

// GET /api/referrals/stats?userId=... — Get referral stats for a user
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            code: user.referralCode || null,
            count: user.referralCount || 0,
            earnings: user.referralEarnings || 0,
        });
    } catch (error) {
        console.error("GET /api/referrals/stats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
