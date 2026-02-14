import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ConversionEvent } from "@/lib/models";

const FUNNEL_EVENT_NAMES = [
    "preview_started",
    "preview_locked",
    "paywall_shown",
    "cta_clicked",
    "purchase_started",
    "purchase_completed",
] as const;

function toRate(numerator: number, denominator: number) {
    if (!denominator || denominator <= 0) return 0;
    return Number(((numerator / denominator) * 100).toFixed(2));
}

function readString(input: unknown) {
    const value = String(input || "").trim();
    return value || undefined;
}

function readNumber(input: unknown) {
    const num = Number(input);
    return Number.isFinite(num) ? num : undefined;
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const rawBody = await req.text();

        if (!rawBody) {
            return NextResponse.json({ error: "Request body is required" }, { status: 400 });
        }

        let body: Record<string, unknown> = {};
        try {
            body = JSON.parse(rawBody) as Record<string, unknown>;
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const eventName = String(body.eventName || "").trim().toLowerCase();
        if (!eventName || eventName.length > 80) {
            return NextResponse.json({ error: "Valid eventName is required" }, { status: 400 });
        }

        const now = Date.now();
        const date = new Date(now).toISOString().slice(0, 10);

        await ConversionEvent.create({
            eventName,
            userId: readString(body.userId),
            deviceId: readString(body.deviceId),
            sessionId: readString(body.sessionId),
            pageType: readString(body.pageType),
            contentType: readString(body.contentType),
            contentId: readString(body.contentId),
            plan: readString(body.plan),
            source: readString(body.source),
            metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : undefined,
            date,
            createdAt: readNumber(body.createdAt) || now,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/analytics/conversion error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const requestedDays = Number(searchParams.get("days") || 7);
        const windowDays = Number.isFinite(requestedDays)
            ? Math.min(60, Math.max(1, Math.floor(requestedDays)))
            : 7;

        const now = Date.now();
        const windowStart = now - windowDays * 24 * 60 * 60 * 1000;

        const [countsAgg, dailyAgg, highIntentAgg] = await Promise.all([
            ConversionEvent.aggregate([
                { $match: { createdAt: { $gte: windowStart }, eventName: { $in: FUNNEL_EVENT_NAMES } } },
                { $group: { _id: "$eventName", count: { $sum: 1 } } },
            ]),
            ConversionEvent.aggregate([
                { $match: { createdAt: { $gte: windowStart }, eventName: { $in: FUNNEL_EVENT_NAMES } } },
                { $group: { _id: { date: "$date", eventName: "$eventName" }, count: { $sum: 1 } } },
                { $sort: { "_id.date": 1 } },
            ]),
            ConversionEvent.aggregate([
                {
                    $match: {
                        createdAt: { $gte: windowStart },
                        eventName: { $in: ["high_intent_user", "lock_repeat_user"] },
                    },
                },
                {
                    $group: {
                        _id: {
                            $ifNull: ["$userId", { $ifNull: ["$deviceId", "$sessionId"] }],
                        },
                    },
                },
                { $count: "total" },
            ]),
        ]);

        const counts = Object.fromEntries(FUNNEL_EVENT_NAMES.map((name) => [name, 0])) as Record<string, number>;
        countsAgg.forEach((row: { _id?: string; count?: number }) => {
            if (!row?._id) return;
            counts[row._id] = Number(row.count || 0);
        });

        type FunnelDay = {
            date: string;
            preview_started: number;
            preview_locked: number;
            paywall_shown: number;
            cta_clicked: number;
            purchase_started: number;
            purchase_completed: number;
        };
        const dailyMap: Record<string, FunnelDay> = {};
        dailyAgg.forEach((row: { _id?: { date?: string; eventName?: string }; count?: number }) => {
            const date = row?._id?.date;
            const eventName = row?._id?.eventName;
            if (!date || !eventName) return;
            if (!dailyMap[date]) {
                dailyMap[date] = {
                    date,
                    preview_started: 0,
                    preview_locked: 0,
                    paywall_shown: 0,
                    cta_clicked: 0,
                    purchase_started: 0,
                    purchase_completed: 0,
                };
            }
            dailyMap[date][eventName] = Number(row.count || 0);
        });

        const previewStarted = counts.preview_started || 0;
        const previewLocked = counts.preview_locked || 0;
        const ctaClicked = counts.cta_clicked || 0;
        const purchaseStarted = counts.purchase_started || 0;
        const purchaseCompleted = counts.purchase_completed || 0;

        return NextResponse.json({
            windowDays,
            counts,
            rates: {
                lockRate: toRate(previewLocked, previewStarted),
                ctaRateFromLock: toRate(ctaClicked, previewLocked),
                startRateFromCta: toRate(purchaseStarted, ctaClicked),
                completionRateFromStart: toRate(purchaseCompleted, purchaseStarted),
                endToEndRate: toRate(purchaseCompleted, previewStarted),
            },
            highIntentUsers: Number(highIntentAgg?.[0]?.total || 0),
            dailyBreakdown: Object.values(dailyMap),
        });
    } catch (error) {
        console.error("GET /api/analytics/conversion error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
