import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";

// POST /api/referrals/create — Generate a referral code for a user
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "userId required" }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If user already has a code, return it
        if (user.referralCode) {
            return NextResponse.json({ code: user.referralCode });
        }

        // Generate unique 6-char code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        user.referralCode = code;
        user.referralCount = user.referralCount || 0;
        user.referralEarnings = user.referralEarnings || 0;
        await user.save();

        return NextResponse.json({ code });
    } catch (error) {
        console.error("POST /api/referrals/create error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
