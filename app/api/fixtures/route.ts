import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Fixture, SyncLog, AllowedLeague, Match, Settings } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const mode = searchParams.get("mode") || "today";

        if (action === "syncLogs") {
            const limit = parseInt(searchParams.get("limit") || "5");
            const logs = await SyncLog.find().sort({ ranAt: -1 }).limit(limit).lean();
            return NextResponse.json(logs);
        }

        if (action === "allowedLeagues") {
            const leagues = await AllowedLeague.find().lean();
            return NextResponse.json(leagues);
        }

        // Get fixtures by day
        const now = new Date();
        let start: Date, end: Date;
        if (mode === "yesterday") {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (mode === "tomorrow") {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
        } else {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        }

        const fixtures = await Fixture.find({
            kickoffAt: { $gte: start.getTime(), $lt: end.getTime() },
        })
            .sort({ kickoffAt: 1 })
            .lean();
        return NextResponse.json(fixtures);
    } catch (error) {
        console.error("GET /api/fixtures error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { action } = body;

        if (action === "seedLeagues") {
            // Seed default allowed leagues
            const defaultLeagues = [
                "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1",
                "Champions League", "Europa League", "World Cup", "AFCON",
                "FA Cup", "EFL Cup", "Copa del Rey",
            ];
            for (const name of defaultLeagues) {
                await AllowedLeague.findOneAndUpdate(
                    { leagueName: name },
                    { leagueName: name, enabled: true },
                    { upsert: true }
                );
            }
            return NextResponse.json({ success: true, count: defaultLeagues.length });
        }

        if (action === "sync") {
            const mode = body.mode || "today";
            // Get Football API key from settings
            const settings = await Settings.findOne().lean() as any;
            const apiKey = settings?.footballApiKey || process.env.FOOTBALL_API_KEY;
            if (!apiKey) {
                return NextResponse.json({ error: "No Football API key configured" }, { status: 400 });
            }

            const now = new Date();
            let dateStr: string;
            if (mode === "yesterday") {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                dateStr = d.toISOString().split("T")[0];
            } else if (mode === "tomorrow") {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                dateStr = d.toISOString().split("T")[0];
            } else {
                dateStr = now.toISOString().split("T")[0];
            }

            const res = await fetch(
                `https://v3.football.api-sports.io/fixtures?date=${dateStr}`,
                { headers: { "x-apisports-key": apiKey } }
            );
            const data = await res.json();
            const fixtures = data?.response || [];

            let imported = 0, skipped = 0, updated = 0;

            for (const f of fixtures) {
                const slug = `${f.teams.home.name}-vs-${f.teams.away.name}-${dateStr}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
                const existing = await Fixture.findOne({ apiId: String(f.fixture.id) });

                const fixtureData = {
                    apiId: String(f.fixture.id),
                    slug,
                    homeName: f.teams.home.name,
                    awayName: f.teams.away.name,
                    homeLogoUrl: f.teams.home.logo,
                    awayLogoUrl: f.teams.away.logo,
                    leagueName: f.league.name,
                    leagueLogoUrl: f.league.logo,
                    kickoffAt: new Date(f.fixture.date).getTime(),
                    statusNormalized: f.fixture.status.short === "FT" ? "finished" :
                        ["1H", "2H", "HT", "ET", "P"].includes(f.fixture.status.short) ? "live" : "upcoming",
                    scoreHome: f.goals.home,
                    scoreAway: f.goals.away,
                    description: `${f.league.name} - ${f.league.round || ""}`,
                };

                if (existing) {
                    await Fixture.findByIdAndUpdate(existing._id, fixtureData);
                    updated++;
                } else {
                    await Fixture.create({ ...fixtureData, createdAt: Date.now() });
                    imported++;
                }
            }

            // Log the sync
            await SyncLog.create({
                ranAt: Date.now(),
                ok: true,
                importedCount: imported,
                skippedCount: skipped,
                mode,
            });

            return NextResponse.json({ fetched: fixtures.length, imported, skipped, updated });
        }

        if (action === "importMatch") {
            const matchData = body.match;
            const now = Date.now();
            const match = await Match.create({ ...matchData, createdAt: now, updatedAt: now });
            return NextResponse.json(match, { status: 201 });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("POST /api/fixtures error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
