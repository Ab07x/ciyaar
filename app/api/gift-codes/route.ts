import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { GiftCode } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "100");
        const gifts = await GiftCode.find().sort({ createdAt: -1 }).limit(limit).lean();
        return NextResponse.json(gifts);
    } catch (error) {
        console.error("GET /api/gift-codes error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const gift = await GiftCode.create({ ...body, createdAt: now });
        return NextResponse.json(gift, { status: 201 });
    } catch (error) {
        console.error("POST /api/gift-codes error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
