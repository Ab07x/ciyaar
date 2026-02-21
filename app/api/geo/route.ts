import { NextRequest, NextResponse } from "next/server";
import { getRequestGeo } from "@/lib/geo-lookup";

export async function GET(req: NextRequest) {
    const { country, multiplier } = await getRequestGeo(req);

    return NextResponse.json(
        { country, multiplier },
        {
            headers: {
                // Never cache — geo must be fresh per request so price is accurate
                "Cache-Control": "no-store",
            },
        }
    );
}
