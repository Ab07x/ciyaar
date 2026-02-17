import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("avatar") as File | null;
        const userId = formData.get("userId") as string | null;

        if (!file || !userId) {
            return NextResponse.json({ error: "Missing avatar or userId" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${userId}-${Date.now()}.webp`;
        const outputPath = path.join(process.cwd(), "public", "uploads", "avatars", filename);

        await sharp(buffer)
            .resize(256, 256, { fit: "cover" })
            .webp({ quality: 80 })
            .toFile(outputPath);

        const avatarUrl = `/uploads/avatars/${filename}`;

        await connectDB();

        // Delete old avatar file if exists
        const user = await User.findById(userId);
        if (user?.avatarUrl && user.avatarUrl.startsWith("/uploads/avatars/")) {
            const oldPath = path.join(process.cwd(), "public", user.avatarUrl);
            await fs.unlink(oldPath).catch(() => {});
        }

        await User.findByIdAndUpdate(userId, { avatarUrl });

        return NextResponse.json({ success: true, avatarUrl });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
