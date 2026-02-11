import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Post } from "@/lib/models";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");
        const category = searchParams.get("category");
        const published = searchParams.get("isPublished");

        if (slug) {
            const post = await Post.findOne({ slug }).lean();
            return NextResponse.json(post || null);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};
        if (category) filter.category = category;
        if (published !== null && published !== undefined) filter.isPublished = published !== "false";

        const posts = await Post.find(filter).sort({ createdAt: -1 }).lean();
        return NextResponse.json(posts);
    } catch (error) {
        console.error("GET /api/posts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const now = Date.now();
        const post = await Post.create({ ...body, createdAt: now, updatedAt: now });
        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error("POST /api/posts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const post = await Post.findByIdAndUpdate(id, { ...updates, updatedAt: Date.now() }, { new: true }).lean();
        return NextResponse.json(post);
    } catch (error) {
        console.error("PUT /api/posts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await Post.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/posts error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
