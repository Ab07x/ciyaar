import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, Subscription, Device } from "@/lib/models/User";
import { Payment } from "@/lib/models/Settings";
import { UserMyList } from "@/lib/models/Misc";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!isAdminAuthenticated(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const { id } = await params;

        const user = await User.findById(id).lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userId = String(user._id);

        // Fetch all related data in parallel
        const [subscriptions, devices, payments, myListCounts] = await Promise.all([
            Subscription.find({ userId }).sort({ createdAt: -1 }).lean(),
            Device.find({ userId }).sort({ lastSeenAt: -1 }).lean(),
            Payment.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
            UserMyList.aggregate([
                { $match: { userId } },
                { $group: { _id: "$listType", count: { $sum: 1 } } },
            ]),
        ]);

        // Determine current status
        const now = Date.now();
        const activeSub = subscriptions.find(
            (s: any) => s.status === "active" && s.expiresAt > now
        );

        let status: "free" | "paid" | "trial" | "expired" = "free";
        if (activeSub) {
            status = "paid";
        } else if ((user as any).trialExpiresAt && (user as any).trialExpiresAt > now) {
            status = "trial";
        } else if (subscriptions.length > 0) {
            status = "expired";
        }

        // List counts
        const listCountMap: Record<string, number> = {};
        for (const item of myListCounts) {
            listCountMap[item._id] = item.count;
        }

        return NextResponse.json({
            user: {
                _id: userId,
                email: (user as any).email || null,
                phoneNumber: (user as any).phoneNumber || null,
                phoneOrId: (user as any).phoneOrId || null,
                username: (user as any).username || null,
                displayName: (user as any).displayName || null,
                avatarUrl: (user as any).avatarUrl || null,
                trialExpiresAt: (user as any).trialExpiresAt || null,
                isTrialUsed: (user as any).isTrialUsed || false,
                referralCode: (user as any).referralCode || null,
                referralCount: (user as any).referralCount || 0,
                referralEarnings: (user as any).referralEarnings || 0,
                createdAt: (user as any).createdAt,
                status,
                currentPlan: activeSub ? (activeSub as any).plan : null,
                expiresAt: activeSub ? (activeSub as any).expiresAt : null,
            },
            subscriptions: subscriptions.map((s: any) => ({
                _id: s._id,
                plan: s.plan,
                status: s.status,
                expiresAt: s.expiresAt,
                maxDevices: s.maxDevices,
                createdAt: s.createdAt,
            })),
            devices: devices.map((d: any) => ({
                _id: d._id,
                deviceId: d.deviceId,
                userAgent: d.userAgent || null,
                lastSeenAt: d.lastSeenAt,
            })),
            payments: payments.map((p: any) => ({
                _id: p._id,
                orderId: p.orderId,
                plan: p.plan,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                gateway: p.gateway || null,
                paymentType: p.paymentType || null,
                createdAt: p.createdAt,
                completedAt: p.completedAt || null,
            })),
            listCounts: {
                favourites: listCountMap["favourites"] || 0,
                watch_later: listCountMap["watch_later"] || 0,
                mylist: listCountMap["mylist"] || 0,
            },
        });
    } catch (error) {
        console.error("Admin user detail API error:", error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}
