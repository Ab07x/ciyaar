import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to project root uploads/ (NOT public/ — Next.js won't serve dynamic files from public/ in production)
        const uploadDir = path.join(process.cwd(), "uploads");

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch {
            // Directory might already exist
        }

        const ext = path.extname(file.name);
        const filename = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // Served via /uploads/[filename] route handler
        const publicUrl = `/uploads/${filename}`;

        return NextResponse.json({ url: publicUrl, name: file.name, type: file.type, size: file.size });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
