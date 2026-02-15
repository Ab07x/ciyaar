import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Settings } from "@/lib/models";

function isAdminAuthenticated(req: NextRequest): boolean {
    return req.cookies.get("fanbroj_admin_session")?.value === "authenticated";
}

const DEFAULTS = {
    whatsappNumber: "+252",
    siteName: "Fanbroj",
    adsEnabled: false,
    priceMatch: 0.25,
    priceDaily: 0.50,
    priceWeekly: 1.50,
    priceMonthly: 3,
    priceYearly: 20,
    freeMoviesPerDay: 2,
    freeMoviePreviewMinutes: 26,
    moviePreviewLockEnabled: true,
    freeMovieTimerSpeedMultiplier: 12,
    maxDevicesMatch: 1,
    maxDevicesWeekly: 2,
    maxDevicesMonthly: 3,
    maxDevicesYearly: 5,
};

export async function GET() {
    try {
        await connectDB();
        const settings = await Settings.findOne().lean();
        return NextResponse.json(settings || DEFAULTS, {
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        });
    } catch (error) {
        console.error("GET /api/settings error:", error);
        return NextResponse.json(DEFAULTS);
    }
}

export async function PUT(req: NextRequest) {
    try {
        if (!isAdminAuthenticated(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();

        const existing = await Settings.findOne();
        if (existing) {
            Object.assign(existing, body);
            await existing.save();
            return NextResponse.json(existing);
        } else {
            const settings = await Settings.create({ ...DEFAULTS, ...body });
            return NextResponse.json(settings);
        }
    } catch (error) {
        console.error("PUT /api/settings error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
