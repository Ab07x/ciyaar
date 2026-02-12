import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Match } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const slug = searchParams.get("slug");
        const id = searchParams.get("id");
        const limit = searchParams.get("limit");
        const byStatus = searchParams.get("byStatus");
        const leagueId = searchParams.get("leagueId");

        // Single match by slug
        if (slug) {
            const match = await Match.findOne({ slug }).lean();
            return NextResponse.json(match || null);
        }

        // Single match by ID
        if (id) {
            const match = await Match.findById(id).lean();
            return NextResponse.json(match || null);
        }

        // Grouped by status (for match detail page sidebar)
        if (byStatus === "true") {
            const [live, upcoming, finished] = await Promise.all([
                Match.find({ status: "live" }).sort({ kickoffAt: -1 }).limit(10).lean(),
                Match.find({ status: "upcoming" }).sort({ kickoffAt: 1 }).limit(10).lean(),
                Match.find({ status: "finished" }).sort({ kickoffAt: -1 }).limit(10).lean(),
            ]);
            return NextResponse.json({ live, upcoming, finished }, {
                headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" },
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (status) filter.status = status;
        if (leagueId) filter.leagueId = leagueId;

        const query = Match.find(filter).sort({ kickoffAt: -1 });
        if (limit) query.limit(parseInt(limit));

        const matches = await query.lean();
        return NextResponse.json(matches, {
            headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" },
        });
    } catch (error) {
        console.error("GET /api/matches error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const match = await Match.create({ ...body, createdAt: now, updatedAt: now });
        return NextResponse.json(match, { status: 201 });
    } catch (error) {
        console.error("POST /api/matches error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const match = await Match.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: Date.now() },
            { new: true }
        ).lean();
        return NextResponse.json(match);
    } catch (error) {
        console.error("PUT /api/matches error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        await Match.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/matches error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
