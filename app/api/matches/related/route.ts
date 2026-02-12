import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Match } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get("matchId");
        const leagueId = searchParams.get("leagueId");

        if (!leagueId) {
            return NextResponse.json([]);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { leagueId };
        if (matchId) filter._id = { $ne: matchId };

        const matches = await Match.find(filter)
            .sort({ kickoffAt: -1 })
            .limit(6)
            .lean();

        return NextResponse.json(matches, {
            headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
        });
    } catch (error) {
        console.error("GET /api/matches/related error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
