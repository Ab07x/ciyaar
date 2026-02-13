import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, Subscription } from "@/lib/models";

const REFERRAL_REWARD_DAYS = 7; // Both referrer and referred get 7 days
const REFERRED_BONUS_DAYS = 3; // Referred user gets extra 3 days

// POST /api/referrals/redeem — Redeem a referral code
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { userId, code, deviceId } = await req.json();

        if (!userId || !code) {
            return NextResponse.json({ success: false, message: "userId and code required" }, { status: 400 });
        }

        // Find the referrer by code
        const referrer = await User.findOne({ referralCode: code.toUpperCase() });
        if (!referrer) {
            return NextResponse.json({ success: false, message: "Code-kan ma jiro. Hubi code-ka oo isku day mar kale." });
        }

        // Can't refer yourself
        if (referrer._id.toString() === userId) {
            return NextResponse.json({ success: false, message: "Ma isticmaali kartid code-kaaga naftaada." });
        }

        // Check if user was already referred
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        if (user.referredBy) {
            return NextResponse.json({ success: false, message: "Horey ayaad code isticmaashay. Hal mar kaliya ayaad isticmaali kartaa." });
        }

        const now = Date.now();

        // Mark user as referred
        user.referredBy = referrer._id.toString();
        user.isReferralCredited = true;
        await user.save();

        // Reward the referrer
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        referrer.referralEarnings = (referrer.referralEarnings || 0) + REFERRAL_REWARD_DAYS;
        await referrer.save();

        // Give referrer premium days
        const referrerExpiry = now + REFERRAL_REWARD_DAYS * 24 * 60 * 60 * 1000;
        await Subscription.create({
            userId: referrer._id.toString(),
            plan: "weekly",
            expiresAt: referrerExpiry,
            maxDevices: 2,
            status: "active",
            createdAt: now,
        });

        // Give referred user bonus premium days
        const userExpiry = now + REFERRED_BONUS_DAYS * 24 * 60 * 60 * 1000;
        await Subscription.create({
            userId: user._id.toString(),
            plan: "weekly",
            expiresAt: userExpiry,
            maxDevices: 2,
            status: "active",
            createdAt: now,
        });

        return NextResponse.json({
            success: true,
            message: `Waad ku guulaysatay! Waxaad heshay ${REFERRED_BONUS_DAYS} maalmood oo Premium ah bilaash!`,
        });
    } catch (error) {
        console.error("POST /api/referrals/redeem error:", error);
        return NextResponse.json({ success: false, message: "Server error occurred" }, { status: 500 });
    }
}
