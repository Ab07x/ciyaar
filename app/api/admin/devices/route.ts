import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Device, Subscription } from "@/lib/models";
import { isAdminAuthenticated } from "@/lib/admin-auth";



// GET /api/admin/devices — list devices for a user or subscription
export async function GET(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const subscriptionId = searchParams.get("subscriptionId");

        if (!userId && !subscriptionId) {
            return NextResponse.json({ error: "userId or subscriptionId required" }, { status: 400 });
        }

        let targetUserId = userId;
        if (subscriptionId && !userId) {
            const sub = await Subscription.findById(subscriptionId).select("userId").lean<{ userId?: string } | null>();
            if (sub) targetUserId = sub.userId;
        }

        if (!targetUserId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const devices = await Device.find({ userId: targetUserId }).lean();
        return NextResponse.json({ devices, count: devices.length });
    } catch (error) {
        console.error("GET /api/admin/devices error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/devices — clear device IDs for a user
export async function DELETE(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const deviceId = searchParams.get("deviceId");
        const clearAll = searchParams.get("all");

        if (clearAll === "1") {
            const result = await Device.deleteMany({});
            return NextResponse.json({
                success: true,
                message: `Cleared ${result.deletedCount} device login(s)`,
                deletedCount: result.deletedCount,
            });
        }

        if (deviceId) {
            // Delete a specific device
            await Device.findOneAndDelete({ deviceId });
            return NextResponse.json({ success: true, message: "Device removed" });
        }

        if (userId) {
            // Clear all devices for a user
            const result = await Device.deleteMany({ userId });
            return NextResponse.json({
                success: true,
                message: `Cleared ${result.deletedCount} device(s) for user`,
                deletedCount: result.deletedCount
            });
        }

        return NextResponse.json({ error: "userId or deviceId required" }, { status: 400 });
    } catch (error) {
        console.error("DELETE /api/admin/devices error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
