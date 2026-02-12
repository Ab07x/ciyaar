import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, Device, Subscription, Redemption } from "@/lib/models";

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
            return NextResponse.json(user || null);
        }

        if (userId) {
            const user = await User.findById(userId).lean();
            return NextResponse.json(user || null);
        }

        if (deviceId) {
            // Find device first, then user
            const device = await Device.findOne({ deviceId }).lean();
            if (device) {
                const user = await User.findById(device.userId).lean();
                return NextResponse.json(user || null);
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

            // Return existing user
            const user = await User.findById(device.userId).lean();
            if (user) {
                // Get subscription
                const subscription = await Subscription.findOne({
                    userId: user._id.toString(),
                    status: "active",
                }).lean();

                return NextResponse.json({ user, subscription, isNew: false });
            }
        }

        // Create new user
        const now = Date.now();
        const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

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

        return NextResponse.json({ user, subscription: null, isNew: true }, { status: 201 });
    } catch (error) {
        console.error("POST /api/users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/users — update user
export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const user = await User.findByIdAndUpdate(id, updates, { new: true }).lean();
        return NextResponse.json(user);
    } catch (error) {
        console.error("PUT /api/users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
