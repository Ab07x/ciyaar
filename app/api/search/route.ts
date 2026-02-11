import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Movie, Series, Match } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();

        if (!q || q.length < 2) {
            return NextResponse.json({ matches: [], movies: [], series: [] });
        }

        const regex = new RegExp(q, "i");

        const [matches, movies, series] = await Promise.all([
            Match.find({
                $or: [
                    { teamA: regex },
                    { teamB: regex },
                    { title: regex },
                    { leagueName: regex },
                ],
            })
                .sort({ kickoffAt: -1 })
                .limit(5)
                .select("slug teamA teamB leagueName status kickoffAt thumbnailUrl")
                .lean(),
            Movie.find({
                isPublished: true,
                $or: [
                    { title: regex },
                    { titleSomali: regex },
                ],
            })
                .sort({ views: -1 })
                .limit(5)
                .select("slug title posterUrl releaseDate isPremium")
                .lean(),
            Series.find({
                isPublished: true,
                $or: [
                    { title: regex },
                    { titleSomali: regex },
                ],
            })
                .sort({ views: -1 })
                .limit(5)
                .select("slug title posterUrl firstAirDate numberOfSeasons isPremium")
                .lean(),
        ]);

        return NextResponse.json({ matches, movies, series });
    } catch (error) {
        console.error("GET /api/search error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
