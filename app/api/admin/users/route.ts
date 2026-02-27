import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { User, Subscription } from "@/lib/models/User";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// Only convert valid 24-char hex strings to ObjectId — skip Convex legacy IDs
function isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

function toObjectIds(ids: string[]): mongoose.Types.ObjectId[] {
    return ids
        .filter(isValidObjectId)
        .map(id => new mongoose.Types.ObjectId(id));
}

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

        // Normalize all userId keys to string for consistent Map lookups
        const activeSubMap = new Map<string, typeof activeSubscriptions[0]>();
        for (const sub of activeSubscriptions) {
            const key = String(sub.userId);
            const existing = activeSubMap.get(key);
            if (!existing || sub.expiresAt > existing.expiresAt) {
                activeSubMap.set(key, sub);
            }
        }

        const paidUserIds = new Set(activeSubscriptions.map((s) => String(s.userId)));

        // For expired/all/free: get all users who ever had a subscription
        const allSubUserIds = (filter === "expired" || filter === "all" || filter === "free")
            ? new Set((await Subscription.distinct("userId")).map(String))
            : null;

        // Build user query based on filter
        const userQuery: Record<string, unknown> = {};

        // Exclude old Convex ghost users (have convexId but no email) from all views
        // These are migrated leftovers with no real user data
        if (!search) {
            userQuery.$or = [
                { email: { $exists: true, $ne: null, $ne: "" } },
                { convexId: { $exists: false } },
            ];
        }

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

        // Pre-filter by status at the DB level for correct pagination
        if (filter === "paid") {
            // Only include valid ObjectIds — skip Convex legacy IDs to prevent CastError
            const validPaidIds = toObjectIds(Array.from(paidUserIds));
            userQuery._id = { $in: validPaidIds };
            // Remove the convex filter for paid — the $in already restricts
            delete userQuery.$or;
        } else if (filter === "trial") {
            userQuery.trialExpiresAt = { $gt: now };
        } else if (filter === "expired") {
            const expiredSubUserIds = allSubUserIds
                ? Array.from(allSubUserIds).filter(id => !paidUserIds.has(id))
                : [];
            const expiredIds = toObjectIds(expiredSubUserIds);
            const baseOr = userQuery.$or ? (userQuery.$or as any[]) : [];
            userQuery.$or = [
                ...baseOr,
                { _id: { $in: expiredIds } },
                { trialExpiresAt: { $gt: 0, $lte: now } },
            ];
        } else if (filter === "free") {
            const nonFreeIds = toObjectIds([
                ...Array.from(paidUserIds),
                ...(allSubUserIds ? Array.from(allSubUserIds) : []),
            ]);
            userQuery._id = { $nin: nonFreeIds };
            userQuery.trialExpiresAt = { $not: { $gt: 0 } };
        }

        const totalFiltered = await User.countDocuments(userQuery);

        const users = await User.find(userQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Enrich with subscription status
        const enrichedUsers = users.map((user: any) => {
            const uid = String(user._id);
            const sub = activeSubMap.get(uid);
            let status: "free" | "paid" | "trial" | "expired" = "free";

            if (sub) {
                status = "paid";
            } else if (user.trialExpiresAt && user.trialExpiresAt > now) {
                status = "trial";
            } else if (allSubUserIds?.has(uid)) {
                status = "expired";
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

        // Stats — exclude Convex ghosts (have convexId + no email)
        const realUserQuery = {
            $or: [
                { email: { $exists: true, $ne: null, $ne: "" } },
                { convexId: { $exists: false } },
            ],
        };
        const totalAll = await User.countDocuments(realUserQuery);
        const trialCount = await User.countDocuments({ ...realUserQuery, trialExpiresAt: { $gt: now } });

        return NextResponse.json({
            users: enrichedUsers,
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
                free: Math.max(0, totalAll - paidUserIds.size - trialCount),
            },
        });
    } catch (error) {
        console.error("Admin users API error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
