import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { PPVContent, PPVPurchase } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const stats = searchParams.get("stats");

        if (stats === "true") {
            const totalPurchases = await PPVPurchase.countDocuments();
            const activePurchases = await PPVPurchase.countDocuments({ expiresAt: { $gt: Date.now() } });
            const adSupportedPurchases = await PPVPurchase.countDocuments({ isAdSupported: true });
            return NextResponse.json({ totalPurchases, activePurchases, adSupportedPurchases });
        }

        const content = await PPVContent.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json(content);
    } catch (error) {
        console.error("GET /api/ppv error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...data } = body;
        const now = Date.now();

        if (id) {
            // Upsert (update existing)
            const ppv = await PPVContent.findByIdAndUpdate(id, { ...data, updatedAt: now }, { new: true }).lean();
            return NextResponse.json(ppv);
        }

        const ppv = await PPVContent.create({ ...data, createdAt: now, updatedAt: now });
        return NextResponse.json(ppv, { status: 201 });
    } catch (error) {
        console.error("POST /api/ppv error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await PPVContent.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/ppv error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
