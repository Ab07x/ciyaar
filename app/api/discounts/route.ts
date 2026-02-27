import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { DiscountCode } from "@/lib/models";

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const stats = request.nextUrl.searchParams.get("stats");

        if (stats === "true") {
            const all = await DiscountCode.find().lean();
            const now = Date.now();
            return NextResponse.json({
                total: all.length,
                active: all.filter((c: any) => c.isActive && (!c.expiresAt || c.expiresAt > now)).length,
                inactive: all.filter((c: any) => !c.isActive).length,
                expired: all.filter((c: any) => c.expiresAt && c.expiresAt <= now).length,
                totalUses: all.reduce((sum: number, c: any) => sum + (c.usedCount || 0), 0),
            });
        }

        const codes = await DiscountCode.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json(codes);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch discount codes";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { code, discountType, discountValue, applicablePlans, maxUses, expiresAt, note } = body;

        if (!code || !discountType || !discountValue) {
            return NextResponse.json({ error: "code, discountType, and discountValue are required" }, { status: 400 });
        }

        if (!["percentage", "fixed"].includes(discountType)) {
            return NextResponse.json({ error: "discountType must be 'percentage' or 'fixed'" }, { status: 400 });
        }

        if (discountType === "percentage" && (discountValue < 1 || discountValue > 99)) {
            return NextResponse.json({ error: "Percentage discount must be between 1 and 99" }, { status: 400 });
        }

        const existing = await DiscountCode.findOne({ code: code.toUpperCase() });
        if (existing) {
            return NextResponse.json({ error: "Discount code already exists" }, { status: 409 });
        }

        const discount = await DiscountCode.create({
            code: code.toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            applicablePlans: applicablePlans || [],
            maxUses: Number(maxUses) || 0,
            usedCount: 0,
            isActive: true,
            expiresAt: expiresAt ? Number(expiresAt) : null,
            note: note || "",
            createdAt: Date.now(),
        });

        return NextResponse.json(discount, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create discount code";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const discount = await DiscountCode.findByIdAndUpdate(id, updates, { new: true });
        if (!discount) {
            return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
        }

        return NextResponse.json(discount);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update discount code";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await connectDB();
        const id = request.nextUrl.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const deleted = await DiscountCode.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to delete discount code";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
