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

        // Get all expired subscriptions (for users who had subs but expired)
        const paidUserIds = new Set(activeSubscriptions.map((s) => s.userId));
        const allSubUserIds = filter === "expired"
            ? new Set((await Subscription.distinct("userId")).map(String))
            : null;

        // Build user query based on filter
        const userQuery: Record<string, unknown> = {};

        if (search) {
            userQuery.$or = [
                { email: { $regex: search, $options: "i" } },
                { emailLower: { $regex: search.toLowerCase(), $options: "i" } },
                { username: { $regex: search, $options: "i" } },
                { displayName: { $regex: search, $options: "i" } },
                { phoneNumber: { $regex: search, $options: "i" } },
                { phoneOrId: { $regex: search, $options: "i" } },
            ];
        }

        // Pre-filter by status in the DB query for better pagination
        if (filter === "paid") {
            userQuery._id = { $in: Array.from(paidUserIds).map(id => {
                try { return new (require("mongoose").Types.ObjectId)(id); } catch { return id; }
            }) };
        } else if (filter === "trial") {
            userQuery.trialExpiresAt = { $gt: now };
        } else if (filter === "expired") {
            // Users who had a subscription but it's now expired (not currently active)
            const expiredOnly = allSubUserIds
                ? Array.from(allSubUserIds).filter(id => !paidUserIds.has(id))
                : [];
            userQuery._id = { $in: expiredOnly.map(id => {
                try { return new (require("mongoose").Types.ObjectId)(id); } catch { return id; }
            }) };
        }

        // Sort: registered users (with email) first, then by creation date
        const totalFiltered = await User.countDocuments(userQuery);

        const users = await User.find(userQuery)
            .sort({ email: -1, createdAt: -1 })
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
                status = "expired";
            }

            return {
                _id: user._id,
                email: user.email || null,
                phoneNumber: user.phoneNumber || null,
                phoneOrId: user.phoneOrId || null,
                username: user.username || null,
                displayName: user.displayName || null,
                avatarUrl: user.avatarUrl || null,
                status,
                plan: sub?.plan || null,
                expiresAt: sub?.expiresAt || null,
                createdAt: user.createdAt,
            };
        });

        // For "free" filter, exclude paid/trial users from results
        let finalUsers = enrichedUsers;
        if (filter === "free") {
            finalUsers = enrichedUsers.filter((u) => u.status === "free");
        }

        // Stats
        const totalAll = await User.countDocuments({});
        const trialCount = await User.countDocuments({ trialExpiresAt: { $gt: now } });

        return NextResponse.json({
            users: finalUsers,
            pagination: {
                page,
                limit,
                total: totalFiltered,
                totalPages: Math.ceil(totalFiltered / limit),
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
