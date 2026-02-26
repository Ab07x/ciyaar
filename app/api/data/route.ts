import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { HeroSlide, PromoBanner, PageView, SearchAnalytics, Message } from "@/lib/models/Misc";
import { Category, League, Fixture } from "@/lib/models/Settings";
import { Match, Movie } from "@/lib/models";

// ============ CATEGORIES ============
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // categories, leagues, hero, banners, analytics, fixtures, messages

        switch (type) {
            case "categories": {
                const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
                return NextResponse.json(categories);
            }
            case "leagues": {
                const leagues = await League.find().sort({ name: 1 }).lean();
                return NextResponse.json(leagues);
            }
            case "hero": {
                const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 }).lean();
                return NextResponse.json(slides);
            }
            case "banners": {
                const now = Date.now();
                const banners = await PromoBanner.find({
                    isActive: true,
                    $or: [
                        { startDate: { $exists: false } },
                        { startDate: null },
                        { startDate: { $lte: now } },
                    ],
                }).sort({ priority: -1 }).lean();
                return NextResponse.json(banners);
            }
            case "fixtures": {
                const date = searchParams.get("date");
                const status = searchParams.get("status");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filter: any = {};
                if (date) filter.fetchedForDate = date;
                if (status) filter.statusNormalized = status;
                const fixtures = await Fixture.find(filter).sort({ kickoffAt: 1 }).lean();
                return NextResponse.json(fixtures);
            }
            case "messages": {
                const matchId = searchParams.get("matchId");
                if (!matchId) return NextResponse.json([]);
                const messages = await Message.find({ matchId }).sort({ createdAt: 1 }).limit(100).lean();
                return NextResponse.json(messages);
            }
            case "analytics": {
                const pageViews = await PageView.find().sort({ date: -1 }).limit(30).lean();
                return NextResponse.json(pageViews);
            }
            default:
                return NextResponse.json({ error: "type parameter required" }, { status: 400 });
        }
    } catch (error) {
        console.error("GET /api/data error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { type, ...data } = body;

        switch (type) {
            case "increment": {
                const { id, collection } = data;
                if (!id || !collection) return NextResponse.json({ error: "id and collection required" }, { status: 400 });
                if (collection === "matches") {
                    await Match.findByIdAndUpdate(id, { $inc: { views: 1 } });
                } else if (collection === "movies" || collection === "posts") {
                    await Movie.findByIdAndUpdate(id, { $inc: { views: 1 } });
                }
                return NextResponse.json({ success: true });
            }
            case "message": {
                const msg = await Message.create({ ...data, createdAt: Date.now() });
                return NextResponse.json(msg, { status: 201 });
            }
            case "pageview": {
                const existing = await PageView.findOne({ date: data.date, pageType: data.pageType, pageId: data.pageId });
                if (existing) {
                    existing.views = (existing.views || 0) + 1;
                    await existing.save();
                    return NextResponse.json(existing);
                }
                const pv = await PageView.create({ ...data, views: 1 });
                return NextResponse.json(pv, { status: 201 });
            }
            case "search": {
                const sa = await SearchAnalytics.create({ ...data, createdAt: Date.now() });
                return NextResponse.json(sa, { status: 201 });
            }
            case "search-track": {
                const sa = await SearchAnalytics.create({
                    query: data.query,
                    queryLower: data.query?.toLowerCase(),
                    resultsCount: data.resultsCount || 0,
                    hasResults: (data.resultsCount || 0) > 0,
                    deviceId: data.deviceId,
                    userAgent: data.userAgent,
                    createdAt: Date.now(),
                });
                return NextResponse.json({ searchId: sa._id });
            }
            case "search-click": {
                if (data.searchId) {
                    await SearchAnalytics.findByIdAndUpdate(data.searchId, {
                        clickedItem: data.clickedItem,
                        clickedItemType: data.clickedItemType,
                    });
                }
                return NextResponse.json({ success: true });
            }
            case "category": {
                const cat = await Category.create({ ...data, createdAt: Date.now() });
                return NextResponse.json(cat, { status: 201 });
            }
            case "hero": {
                const slide = await HeroSlide.create({ ...data, createdAt: Date.now(), updatedAt: Date.now() });
                return NextResponse.json(slide, { status: 201 });
            }
            case "banner": {
                const banner = await PromoBanner.create({ ...data, createdAt: Date.now(), updatedAt: Date.now() });
                return NextResponse.json(banner, { status: 201 });
            }
            default:
                return NextResponse.json({ error: "type required" }, { status: 400 });
        }
    } catch (error) {
        console.error("POST /api/data error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
