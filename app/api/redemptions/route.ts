import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Redemption } from "@/lib/models";
import { generateUniqueRedemptionCode } from "@/lib/auto-redemption";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { resolveTrialMovie } from "@/lib/trial-movie";



// GET /api/redemptions — list codes or stats (admin)
export async function GET(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const stats = searchParams.get("stats");
        const limit = parseInt(searchParams.get("limit") || "100");

        if (stats === "true") {
            const total = await Redemption.countDocuments();
            const used = await Redemption.countDocuments({ usedByUserId: { $ne: null } });
            const revoked = await Redemption.countDocuments({ revokedAt: { $ne: null } });
            const available = total - used - revoked;

            // By plan
            const trialCount = await Redemption.countDocuments({
                trialHours: { $gt: 0 },
                usedByUserId: null,
                revokedAt: null,
            });
            const matchCount = await Redemption.countDocuments({
                plan: "match",
                trialHours: { $in: [null, 0] },
                usedByUserId: null,
                revokedAt: null,
            });
            const weeklyCount = await Redemption.countDocuments({ plan: "weekly", usedByUserId: null, revokedAt: null });
            const monthlyCount = await Redemption.countDocuments({ plan: "monthly", usedByUserId: null, revokedAt: null });
            const yearlyCount = await Redemption.countDocuments({ plan: "yearly", usedByUserId: null, revokedAt: null });

            return NextResponse.json({
                total, used, revoked, available,
                byPlan: { trial: trialCount, match: matchCount, weekly: weeklyCount, monthly: monthlyCount, yearly: yearlyCount },
            });
        }

        const codes = await Redemption.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json(codes);
    } catch (error) {
        console.error("GET /api/redemptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/redemptions — create code(s) (admin), supports batch via count
export async function POST(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const count = body.count || 1;
        const now = Date.now();
        const source = String(body.source || "manual");
        const paymentOrderId = body.paymentOrderId ? String(body.paymentOrderId) : undefined;
        const note = body.note ? String(body.note) : undefined;
        const requestedTrialHours = Number(body.trialHours || 0);
        const trialHours = [1, 2, 4].includes(requestedTrialHours) ? requestedTrialHours : 0;
        const trialMovieIdRaw = String(body.trialMovieId || "").trim();
        const trialMovieTitle = String(body.trialMovieTitle || "").trim();

        if (trialHours > 0 && !trialMovieIdRaw) {
            return NextResponse.json(
                { error: "trialMovieId is required when trialHours is set." },
                { status: 400 }
            );
        }

        let trialMovieId = trialMovieIdRaw;
        let trialMovieAliases: string[] = [];
        if (trialHours > 0) {
            const resolvedTrialMovie = await resolveTrialMovie(trialMovieIdRaw);
            trialMovieId = resolvedTrialMovie.canonicalMovieId || trialMovieIdRaw;
            trialMovieAliases = resolvedTrialMovie.aliases || [];
        }

        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            const code = await generateUniqueRedemptionCode();
            await Redemption.create({
                code,
                plan: body.plan || (trialHours > 0 ? "match" : "monthly"),
                durationDays: body.durationDays || (trialHours > 0 ? 1 : 30),
                maxDevices: body.maxDevices || (trialHours > 0 ? 1 : 3),
                source,
                paymentOrderId,
                trialHours: trialHours > 0 ? trialHours : undefined,
                trialMovieId: trialHours > 0 ? trialMovieId : undefined,
                trialMovieAliases: trialHours > 0 ? trialMovieAliases : undefined,
                trialMovieTitle: trialHours > 0 ? trialMovieTitle || undefined : undefined,
                note,
                createdAt: now,
            });
            codes.push(code);
        }

        return NextResponse.json(codes, { status: 201 });
    } catch (error) {
        console.error("POST /api/redemptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/redemptions — revoke code (admin)
export async function PUT(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { id, action } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        if (action === "revoke") {
            await Redemption.findByIdAndUpdate(id, { revokedAt: Date.now() });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PUT /api/redemptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/redemptions?id=xxx — delete code (admin)
export async function DELETE(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        await Redemption.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/redemptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
