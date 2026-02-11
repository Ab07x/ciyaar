import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PushSubscription } from "@/lib/models";

// GET /api/push/subscriptions — list all push subscriptions (admin)
export async function GET() {
    try {
        await connectDB();
        const subs = await PushSubscription.find()
            .sort({ lastUsedAt: -1, createdAt: -1 })
            .lean();

        const active = subs.filter((s: any) => s.isActive);
        const inactive = subs.filter((s: any) => !s.isActive);

        return NextResponse.json({
            subscriptions: subs,
            count: subs.length,
            activeCount: active.length,
            inactiveCount: inactive.length,
        });
    } catch (error) {
        console.error("GET /api/push/subscriptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
