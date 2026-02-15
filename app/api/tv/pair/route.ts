import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Device, TVPairSession } from "@/lib/models";

const PAIR_SESSION_TTL_MS = 10 * 60 * 1000;

function generatePairCode(length = 8): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

async function createUniquePairCode(): Promise<string> {
    for (let i = 0; i < 8; i += 1) {
        const code = generatePairCode(8);
        const existing = await TVPairSession.findOne({ code }).select("_id").lean();
        if (!existing) {
            return code;
        }
    }

    throw new Error("Failed to generate unique pairing code");
}

// POST /api/tv/pair - create or reuse an active pairing session for a TV device
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const tvDeviceId = typeof body?.tvDeviceId === "string" ? body.tvDeviceId.trim() : "";

        if (!tvDeviceId) {
            return NextResponse.json({ error: "tvDeviceId required" }, { status: 400 });
        }

        const now = Date.now();

        // Mark stale pending sessions as expired.
        await TVPairSession.updateMany(
            { tvDeviceId, status: "pending", expiresAt: { $lte: now } },
            { status: "expired" }
        );

        // Reuse active pending session to prevent code spam while TV is open.
        const existing = await TVPairSession.findOne({
            tvDeviceId,
            status: "pending",
            expiresAt: { $gt: now },
        })
            .sort({ createdAt: -1 })
            .lean<{ code: string; createdAt: number; expiresAt: number } | null>();

        if (existing) {
            const pairUrl = `${req.nextUrl.origin}/tv/pair?code=${encodeURIComponent(existing.code)}`;
            return NextResponse.json({
                success: true,
                code: existing.code,
                createdAt: existing.createdAt,
                expiresAt: existing.expiresAt,
                pairUrl,
                pollIntervalMs: 3000,
            });
        }

        const code = await createUniquePairCode();
        const createdAt = now;
        const expiresAt = now + PAIR_SESSION_TTL_MS;

        await TVPairSession.create({
            code,
            tvDeviceId,
            status: "pending",
            createdAt,
            expiresAt,
        });

        const pairUrl = `${req.nextUrl.origin}/tv/pair?code=${encodeURIComponent(code)}`;

        return NextResponse.json({
            success: true,
            code,
            createdAt,
            expiresAt,
            pairUrl,
            pollIntervalMs: 3000,
        });
    } catch (error) {
        console.error("POST /api/tv/pair error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/tv/pair?code=XXXX - poll pairing session status
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const code = (searchParams.get("code") || "").trim().toUpperCase();

        if (!code) {
            return NextResponse.json({ error: "code required" }, { status: 400 });
        }

        const session = await TVPairSession.findOne({ code }).lean<{
            code: string;
            status: "pending" | "paired" | "expired" | "cancelled";
            expiresAt: number;
            pairedAt?: number;
            tvDeviceId: string;
        } | null>();

        if (!session) {
            return NextResponse.json({ error: "Pairing code not found" }, { status: 404 });
        }

        const now = Date.now();
        let status = session.status;

        if (status === "pending" && session.expiresAt <= now) {
            await TVPairSession.updateOne({ code }, { status: "expired" });
            status = "expired";
        }

        return NextResponse.json({
            success: true,
            code: session.code,
            status,
            expiresAt: session.expiresAt,
            pairedAt: session.pairedAt || null,
            tvDeviceId: session.tvDeviceId,
        });
    } catch (error) {
        console.error("GET /api/tv/pair error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/tv/pair - phone confirms pairing code and links TV to phone account
export async function PUT(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
        const phoneDeviceId = typeof body?.phoneDeviceId === "string" ? body.phoneDeviceId.trim() : "";

        if (!code || !phoneDeviceId) {
            return NextResponse.json({ error: "code and phoneDeviceId required" }, { status: 400 });
        }

        const phoneDevice = await Device.findOne({ deviceId: phoneDeviceId }).lean<{ userId?: string } | null>();

        if (!phoneDevice?.userId) {
            return NextResponse.json({ error: "Phone session not found. Login on phone first." }, { status: 404 });
        }

        const session = await TVPairSession.findOne({ code });
        if (!session) {
            return NextResponse.json({ error: "Pairing code not found" }, { status: 404 });
        }

        const now = Date.now();

        if (session.status === "expired" || session.expiresAt <= now) {
            if (session.status !== "expired") {
                session.status = "expired";
                await session.save();
            }
            return NextResponse.json({ error: "Pairing code expired" }, { status: 410 });
        }

        if (session.status === "paired") {
            return NextResponse.json({
                success: true,
                status: "paired",
                tvDeviceId: session.tvDeviceId,
            });
        }

        if (session.status !== "pending") {
            return NextResponse.json({ error: "Pairing session is not active" }, { status: 409 });
        }

        await Device.findOneAndUpdate(
            { deviceId: session.tvDeviceId },
            {
                userId: phoneDevice.userId,
                deviceId: session.tvDeviceId,
                lastSeenAt: now,
                userAgent: body?.userAgent || "tv-paired",
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        session.status = "paired";
        session.userId = phoneDevice.userId;
        session.pairedByDeviceId = phoneDeviceId;
        session.pairedAt = now;
        await session.save();

        // Cancel other pending sessions for this TV now that pairing is complete.
        await TVPairSession.updateMany(
            {
                tvDeviceId: session.tvDeviceId,
                status: "pending",
                code: { $ne: code },
            },
            { status: "cancelled" }
        );

        return NextResponse.json({
            success: true,
            status: "paired",
            tvDeviceId: session.tvDeviceId,
            userId: phoneDevice.userId,
        });
    } catch (error) {
        console.error("PUT /api/tv/pair error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
