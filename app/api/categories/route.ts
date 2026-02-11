import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Category } from "@/lib/models";

export async function GET() {
    try {
        await connectDB();
        const categories = await Category.find({}).sort({ order: 1 }).lean();
        return NextResponse.json(categories);
    } catch (error) {
        console.error("GET /api/categories error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();

        // Handle seed action
        if (body.action === "seed") {
            const defaults = [
                { name: "Fanproj", slug: "fanproj", color: "#9AE600", order: 1, isActive: true },
                { name: "Hindi AF Somali", slug: "hindi-af-somali", color: "#FF6B6B", order: 2, isActive: true },
                { name: "Turkish AF Somali", slug: "turkish-af-somali", color: "#FFD700", order: 3, isActive: true },
                { name: "Korean AF Somali", slug: "korean-af-somali", color: "#4FC3F7", order: 4, isActive: true },
                { name: "Hollywood", slug: "hollywood", color: "#FF9800", order: 5, isActive: true },
                { name: "Somali", slug: "somali", color: "#00BCD4", order: 6, isActive: true },
            ];
            for (const cat of defaults) {
                await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
            }
            const categories = await Category.find({}).sort({ order: 1 }).lean();
            return NextResponse.json(categories);
        }

        const now = Date.now();
        const category = await Category.create({ ...body, createdAt: now, updatedAt: now });
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("POST /api/categories error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const category = await Category.findByIdAndUpdate(id, { ...updates, updatedAt: Date.now() }, { new: true }).lean();
        return NextResponse.json(category);
    } catch (error) {
        console.error("PUT /api/categories error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await Category.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/categories error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
