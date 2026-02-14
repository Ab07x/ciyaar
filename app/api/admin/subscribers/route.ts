import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Subscription } from "@/lib/models";

// GET /api/admin/subscribers — list subscriptions with pagination and search
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (search) {
            filter.$or = [
                { userId: { $regex: search, $options: "i" } },
                { plan: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;
        const [subscriptions, total] = await Promise.all([
            Subscription.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Subscription.countDocuments(filter),
        ]);

        return NextResponse.json({ subscriptions, total, page, limit });
    } catch (error) {
        console.error("GET /api/admin/subscribers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/admin/subscribers — update subscription (e.g., revoke)
export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, status } = body;

        if (!id) {
            return NextResponse.json({ error: "id required" }, { status: 400 });
        }

        const subscription = await Subscription.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).lean();

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("PUT /api/admin/subscribers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
