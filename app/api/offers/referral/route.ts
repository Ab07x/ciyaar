import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, ConversionEvent } from "@/lib/models";
import crypto from "crypto";

/**
 * POST /api/offers/referral
 * body: { action: "generate", userId } → create/return referral code
 * body: { action: "track", code, visitorDeviceId } → log click
 * body: { action: "credit", referralCode, newUserId } → credit referrer after purchase
 *   (called internally by the verify route when a payment succeeds for a user with referredBy set)
 */
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { action } = body;

        // ── Generate referral code for a user ────────────────────────────────
        if (action === "generate") {
            const { userId } = body;
            if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

            let user = await User.findById(userId).lean<{ _id: unknown; referralCode?: string }>();
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

            // Already has code
            if (user.referralCode) {
                return NextResponse.json({ code: user.referralCode });
            }

            // Generate short unique code: FBJ + 6 hex chars
            const code = "FBJ" + crypto.randomBytes(3).toString("hex").toUpperCase();
            await User.findByIdAndUpdate(userId, { referralCode: code });

            return NextResponse.json({ code });
        }

        // ── Track referral link click ─────────────────────────────────────────
        if (action === "track") {
            const { code, visitorDeviceId } = body;
            if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

            // Verify code exists
            const referrer = await User.findOne({ referralCode: code }).lean<{ _id: unknown }>();
            if (!referrer) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

            // Log click event
            await ConversionEvent.create({
                eventName: "referral_click",
                deviceId: visitorDeviceId,
                source: "referral",
                metadata: { referralCode: code, referrerId: String(referrer._id) },
                date: new Date().toISOString().slice(0, 10),
                createdAt: Date.now(),
            }).catch(() => {});

            return NextResponse.json({ success: true, referrerId: String(referrer._id) });
        }

        // ── Credit referrer after new user subscribes ─────────────────────────
        if (action === "credit") {
            const { referralCode, newUserId } = body;
            if (!referralCode || !newUserId) {
                return NextResponse.json({ error: "referralCode and newUserId required" }, { status: 400 });
            }

            const referrer = await User.findOne({ referralCode }).lean<{ _id: unknown; referralCount?: number; isReferralCredited?: boolean }>();
            if (!referrer) return NextResponse.json({ error: "Referrer not found" }, { status: 404 });

            // Increment referral count
            await User.findByIdAndUpdate(referrer._id, {
                $inc: { referralCount: 1, referralEarnings: 30 }, // 30 = bonus days earned
            });

            // Link new user to referrer
            await User.findByIdAndUpdate(newUserId, { referredBy: String(referrer._id) });

            // Log conversion event
            await ConversionEvent.create({
                eventName: "referral_converted",
                userId: newUserId,
                source: "referral",
                metadata: {
                    referralCode,
                    referrerId: String(referrer._id),
                    bonusDaysEarned: 30,
                },
                date: new Date().toISOString().slice(0, 10),
                createdAt: Date.now(),
            }).catch(() => {});

            return NextResponse.json({ success: true, bonusDaysEarned: 30 });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err) {
        console.error("Referral API error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * GET /api/offers/referral?userId=xxx
 * Returns referral stats for a user.
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const userId = req.nextUrl.searchParams.get("userId");
        if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

        const user = await User.findById(userId)
            .select("referralCode referralCount referralEarnings")
            .lean<{ referralCode?: string; referralCount?: number; referralEarnings?: number }>();

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json({
            code:          user.referralCode ?? null,
            referralCount: user.referralCount ?? 0,
            bonusDaysEarned: user.referralEarnings ?? 0,
        });
    } catch (err) {
        console.error("Referral GET error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
