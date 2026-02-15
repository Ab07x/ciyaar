import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { User, Device, Subscription } from "@/lib/models";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
type UserPlainRecord = Record<string, unknown>;
type UserLike = UserPlainRecord | { toObject: () => UserPlainRecord } | null;

function sanitizeUser(user: UserLike) {
    if (!user) return null;
    const plain = typeof user === "object" && "toObject" in user && typeof user.toObject === "function"
        ? user.toObject()
        : user;
    const { passwordHash, passwordSalt, ...safe } = plain;
    void passwordHash;
    void passwordSalt;
    return safe;
}

// GET /api/users?deviceId=xxx — get or check user
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get("deviceId");
        const userId = searchParams.get("userId");
        const referralCode = searchParams.get("referralCode");

        if (referralCode) {
            const user = await User.findOne({ referralCode }).lean();
            return NextResponse.json(sanitizeUser(user as UserLike));
        }

        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return NextResponse.json(null);
            }
            const user = await User.findById(userId).lean();
            return NextResponse.json(sanitizeUser(user as UserLike));
        }

        if (deviceId) {
            // Find device first, then user
            const device = await Device.findOne({ deviceId }).lean();
            if (device) {
                const user = await User.findById(device.userId).lean();
                return NextResponse.json(sanitizeUser(user as UserLike));
            }
            return NextResponse.json(null);
        }

        return NextResponse.json({ error: "deviceId or userId required" }, { status: 400 });
    } catch (error) {
        console.error("GET /api/users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/users — create or get user (getOrCreate pattern)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { deviceId, userAgent } = body;

        if (!deviceId) {
            return NextResponse.json({ error: "deviceId required" }, { status: 400 });
        }

        // Check if device exists
        let device = await Device.findOne({ deviceId });

        if (device) {
            // Update last seen
            device.lastSeenAt = Date.now();
            if (userAgent) device.userAgent = userAgent;
            await device.save();

            // Validate userId is a proper MongoDB ObjectId (old Convex IDs will fail)
            if (mongoose.Types.ObjectId.isValid(device.userId)) {
                const user = await User.findById(device.userId).lean();
                if (user) {
                    const subscription = await Subscription.findOne({
                        userId: user._id.toString(),
                        status: "active",
                    }).lean();

                    return NextResponse.json({
                        user: sanitizeUser(user as UserLike),
                        subscription,
                        isNew: false,
                    });
                }
            }
            // Invalid or missing user — delete stale device and create fresh below
            await Device.deleteOne({ _id: device._id });
            device = null;
        }

        // Create new user
        const now = Date.now();
        const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);

        const user = await User.create({
            createdAt: now,
            referralCode,
            referralCount: 0,
            referralEarnings: 0,
            isTrialUsed: false,
        });

        // Create device
        device = await Device.create({
            userId: user._id.toString(),
            deviceId,
            userAgent: userAgent || "",
            lastSeenAt: now,
        });

        return NextResponse.json(
            {
                user: sanitizeUser(user as UserLike),
                subscription: null,
                isNew: true,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/users — update user (allowlisted fields only)
export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, username, displayName, avatarUrl } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
        }

        const updates: Record<string, unknown> = {};

        if (typeof avatarUrl === "string" && avatarUrl.trim()) {
            updates.avatarUrl = avatarUrl.trim();
        }

        if (typeof displayName === "string" && displayName.trim()) {
            updates.displayName = displayName.trim().slice(0, 50);
        }

        if (typeof username === "string") {
            const cleanUsername = username.trim();
            if (!USERNAME_REGEX.test(cleanUsername)) {
                return NextResponse.json(
                    {
                        error: "Username must be 3-20 chars and use only letters, numbers, or underscore.",
                    },
                    { status: 400 }
                );
            }

            const usernameLower = cleanUsername.toLowerCase();
            const existing = await User.findOne({
                usernameLower,
                _id: { $ne: id },
            })
                .select("_id")
                .lean();

            if (existing) {
                return NextResponse.json({ error: "Username already taken." }, { status: 409 });
            }

            updates.username = cleanUsername;
            updates.usernameLower = usernameLower;
            updates.displayName = cleanUsername;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(id, updates, { new: true }).lean();
        return NextResponse.json(sanitizeUser(user as UserLike));
    } catch (error) {
        console.error("PUT /api/users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
