import { Payment, Redemption, Subscription, UserMyList, UserWatchProgress } from "@/lib/models";

interface MergeUserIdentityInput {
    fromUserId: string;
    toUserId: string;
}

interface MergeUserIdentityResult {
    merged: boolean;
    movedMyList: number;
    movedWatchProgress: number;
    movedPayments: number;
    movedRedemptions: number;
    movedSubscription: boolean;
}

type MyListType = "mylist" | "favourites" | "watch_later";

function normalizeMyListType(value: unknown): MyListType {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "favourite" || raw === "favorites" || raw === "favorite" || raw === "favourites") {
        return "favourites";
    }
    if (raw === "watchlater" || raw === "watch-later" || raw === "watch_later" || raw === "later") {
        return "watch_later";
    }
    return "mylist";
}

function myListFilterByType(listType: MyListType) {
    if (listType === "mylist") {
        return {
            $or: [
                { listType: "mylist" },
                { listType: { $exists: false } },
                { listType: null },
                { listType: "" },
            ],
        };
    }
    return { listType };
}

export async function mergeUserIdentityData({
    fromUserId,
    toUserId,
}: MergeUserIdentityInput): Promise<MergeUserIdentityResult> {
    if (!fromUserId || !toUserId || fromUserId === toUserId) {
        return {
            merged: false,
            movedMyList: 0,
            movedWatchProgress: 0,
            movedPayments: 0,
            movedRedemptions: 0,
            movedSubscription: false,
        };
    }

    let movedMyList = 0;
    let movedWatchProgress = 0;
    let movedSubscription = false;

    const sourceMyList = await UserMyList.find({ userId: fromUserId }).lean<Array<Record<string, unknown>>>();
    for (const row of sourceMyList) {
        const listType = normalizeMyListType(row.listType);
        const contentType = String(row.contentType || "");
        const contentId = String(row.contentId || "");
        if (!contentType || !contentId) continue;

        const existing = await UserMyList.findOne({
            userId: toUserId,
            contentType,
            contentId,
            ...myListFilterByType(listType),
        }).lean<{ _id?: string; addedAt?: number; listType?: string } | null>();

        if (!existing?._id) {
            await UserMyList.create({
                userId: toUserId,
                listType,
                contentType,
                contentId,
                addedAt: Number(row.addedAt || Date.now()),
            });
            movedMyList += 1;
            continue;
        }

        const existingAddedAt = Number(existing.addedAt || 0);
        const sourceAddedAt = Number(row.addedAt || 0);
        if (sourceAddedAt > existingAddedAt) {
            await UserMyList.updateOne(
                { _id: existing._id },
                {
                    $set: {
                        addedAt: sourceAddedAt,
                        listType,
                    },
                }
            );
        } else if (!existing.listType) {
            await UserMyList.updateOne({ _id: existing._id }, { $set: { listType } });
        }
    }
    await UserMyList.deleteMany({ userId: fromUserId });

    const sourceProgress = await UserWatchProgress.find({ userId: fromUserId })
        .lean<Array<Record<string, unknown>>>();
    for (const row of sourceProgress) {
        const contentType = String(row.contentType || "");
        const contentId = String(row.contentId || "");
        if (!contentType || !contentId) continue;

        const sourceProgressSeconds = Number(row.progressSeconds || 0);
        const sourceDurationSeconds = Number(row.durationSeconds || 0);
        const sourceUpdatedAt = Number(row.updatedAt || Date.now());
        const sourceIsFinished = Boolean(row.isFinished);
        const sourceSeriesId = row.seriesId ? String(row.seriesId) : undefined;

        const existing = await UserWatchProgress.findOne({
            userId: toUserId,
            contentType,
            contentId,
        }).lean<Record<string, unknown> | null>();

        if (!existing) {
            await UserWatchProgress.create({
                userId: toUserId,
                contentType,
                contentId,
                seriesId: sourceSeriesId,
                progressSeconds: sourceProgressSeconds,
                durationSeconds: sourceDurationSeconds,
                isFinished: sourceIsFinished,
                updatedAt: sourceUpdatedAt,
            });
            movedWatchProgress += 1;
            continue;
        }

        const mergedProgress = Math.max(Number(existing.progressSeconds || 0), sourceProgressSeconds);
        const mergedDuration = Math.max(Number(existing.durationSeconds || 0), sourceDurationSeconds);
        const mergedUpdatedAt = Math.max(Number(existing.updatedAt || 0), sourceUpdatedAt);
        const mergedIsFinished = Boolean(existing.isFinished) || sourceIsFinished;
        const mergedSeriesId = String(existing.seriesId || sourceSeriesId || "");

        await UserWatchProgress.updateOne(
            { _id: existing._id },
            {
                $set: {
                    progressSeconds: mergedProgress,
                    durationSeconds: mergedDuration,
                    updatedAt: mergedUpdatedAt,
                    isFinished: mergedIsFinished,
                    seriesId: mergedSeriesId || undefined,
                },
            }
        );
    }
    await UserWatchProgress.deleteMany({ userId: fromUserId });

    const sourceSub = await Subscription.findOne({ userId: fromUserId, status: "active" })
        .sort({ expiresAt: -1 })
        .lean<{ _id?: string; expiresAt?: number } | null>();
    const targetSub = await Subscription.findOne({ userId: toUserId, status: "active" })
        .sort({ expiresAt: -1 })
        .lean<{ _id?: string; expiresAt?: number } | null>();

    if (sourceSub?._id) {
        const sourceExpires = Number(sourceSub.expiresAt || 0);
        const targetExpires = Number(targetSub?.expiresAt || 0);

        if (!targetSub?._id || sourceExpires > targetExpires) {
            if (targetSub?._id) {
                await Subscription.updateOne({ _id: targetSub._id }, { $set: { status: "expired" } });
            }
            await Subscription.updateOne({ _id: sourceSub._id }, { $set: { userId: toUserId } });
            movedSubscription = true;
        } else {
            await Subscription.updateOne({ _id: sourceSub._id }, { $set: { status: "expired" } });
        }
    }

    const paymentsResult = await Payment.updateMany(
        { userId: fromUserId },
        { $set: { userId: toUserId } }
    );
    const redemptionsResult = await Redemption.updateMany(
        { usedByUserId: fromUserId },
        { $set: { usedByUserId: toUserId } }
    );

    return {
        merged: true,
        movedMyList,
        movedWatchProgress,
        movedPayments: Number(paymentsResult.modifiedCount || 0),
        movedRedemptions: Number(redemptionsResult.modifiedCount || 0),
        movedSubscription,
    };
}
