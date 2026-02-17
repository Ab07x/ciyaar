import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, Subscription } from "@/lib/models/User";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    if (!isAdminAuthenticated(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
        const search = (searchParams.get("search") || "").trim();
        const filter = (searchParams.get("filter") || "all").toLowerCase();
        const skip = (page - 1) * limit;

        // Build user query
        const userQuery: Record<string, unknown> = {};
        if (search) {
            userQuery.$or = [
                { email: { $regex: search, $options: "i" } },
                { emailLower: { $regex: search.toLowerCase(), $options: "i" } },
                { username: { $regex: search, $options: "i" } },
                { displayName: { $regex: search, $options: "i" } },
            ];
        }

        const now = Date.now();

        // Get all active subscriptions for status lookup
        const activeSubscriptions = await Subscription.find({
            status: "active",
            expiresAt: { $gt: now },
        }).lean();

        const activeSubMap = new Map<string, typeof activeSubscriptions[0]>();
        for (const sub of activeSubscriptions) {
            const existing = activeSubMap.get(sub.userId);
            if (!existing || sub.expiresAt > existing.expiresAt) {
                activeSubMap.set(sub.userId, sub);
            }
        }

        // Get total count
        const totalUsers = await User.countDocuments(userQuery);

        // Get users
        let users = await User.find(userQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Enrich with subscription status
        const enrichedUsers = users.map((user: any) => {
            const sub = activeSubMap.get(String(user._id));
            let status: "free" | "paid" | "trial" | "expired" = "free";

            if (sub) {
                status = "paid";
            } else if (user.trialExpiresAt && user.trialExpiresAt > now) {
                status = "trial";
            } else if (user.trialExpiresAt && user.trialExpiresAt <= now) {
                // Had trial but expired, check if they ever had a paid sub
                status = "expired";
            }

            return {
                _id: user._id,
                email: user.email || null,
                username: user.username || null,
                displayName: user.displayName || null,
                avatarUrl: user.avatarUrl || null,
                status,
                plan: sub?.plan || null,
                expiresAt: sub?.expiresAt || null,
                createdAt: user.createdAt,
            };
        });

        // Apply status filter after enrichment
        let filtered = enrichedUsers;
        if (filter !== "all") {
            filtered = enrichedUsers.filter((u) => u.status === filter);
        }

        // Stats
        const totalAll = await User.countDocuments({});
        const paidUserIds = new Set(activeSubscriptions.map((s) => s.userId));
        const trialCount = await User.countDocuments({ trialExpiresAt: { $gt: now } });

        return NextResponse.json({
            users: filtered,
            pagination: {
                page,
                limit,
                total: filter === "all" ? totalUsers : filtered.length,
                totalPages: Math.ceil((filter === "all" ? totalUsers : filtered.length) / limit),
            },
            stats: {
                total: totalAll,
                paid: paidUserIds.size,
                trial: trialCount,
                free: totalAll - paidUserIds.size - trialCount,
            },
        });
    } catch (error) {
        console.error("Admin users API error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
