import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, Subscription } from "@/lib/models";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateUniqueReferralCode } from "@/lib/referral-code";
import {
    createSalt,
    hashPassword,
    isValidEmail,
    normalizeEmail,
    createDefaultDisplayName,
} from "@/lib/auth";

const PLAN_DURATION: Record<string, number> = {
    weekly: 7,
    monthly: 30,
    yearly: 365,
};

const PLAN_DEVICES: Record<string, number> = {
    weekly: 2,
    monthly: 3,
    yearly: 5,
};

// POST /api/admin/create-user — admin creates user + activates plan
export async function POST(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();

        const emailRaw = String(body?.email || "").trim();
        const password = String(body?.password || "");
        const displayName = String(body?.displayName || "").trim();
        const phoneNumber = String(body?.phoneNumber || "").trim();
        const plan = String(body?.plan || "").trim() as "weekly" | "monthly" | "yearly";
        const customDays = body?.customDays ? Number(body.customDays) : null;

        // Validate
        const emailLower = normalizeEmail(emailRaw);
        if (!isValidEmail(emailLower)) {
            return NextResponse.json({ error: "Email sax maaha." }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password waa inuu noqdaa ugu yaraan 6 xaraf." }, { status: 400 });
        }
        if (!PLAN_DURATION[plan]) {
            return NextResponse.json({ error: "Plan sax maaha. Dooro: weekly, monthly, ama yearly." }, { status: 400 });
        }

        // Check existing user
        const existingUser = await User.findOne({ emailLower }).lean<{ _id: string } | null>();

        const now = Date.now();
        let userId: string;

        if (existingUser) {
            // User already exists — just activate their plan
            userId = String(existingUser._id);
        } else {
            // Create new user
            const salt = createSalt();
            const passwordHash = await hashPassword(password, salt);
            const referralCode = await generateUniqueReferralCode();
            const defaultName = createDefaultDisplayName(emailLower);

            const created = await User.create({
                email: emailLower,
                emailLower,
                passwordHash,
                passwordSalt: salt,
                displayName: displayName || defaultName,
                avatarUrl: "/img/icons/background.png",
                referralCode,
                referralCount: 0,
                referralEarnings: 0,
                isTrialUsed: true,
                ...(phoneNumber ? { phoneNumber } : {}),
                createdAt: now,
            });
            userId = created._id.toString();
        }

        // Expire any existing active subscriptions
        await Subscription.updateMany(
            { userId, status: "active" },
            { status: "expired" }
        );

        // Create new subscription
        const durationDays = customDays || PLAN_DURATION[plan];
        const maxDevices = PLAN_DEVICES[plan] || 3;
        const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;

        const subscription = await Subscription.create({
            userId,
            plan,
            expiresAt,
            maxDevices,
            status: "active",
            createdAt: now,
        });

        return NextResponse.json({
            success: true,
            isNewUser: !existingUser,
            userId,
            email: emailLower,
            plan,
            durationDays,
            expiresAt,
            subscriptionId: subscription._id,
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/create-user error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
