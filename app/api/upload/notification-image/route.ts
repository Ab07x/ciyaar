import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Create notifications directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "notifications");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `notification-${timestamp}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        // Save file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);

        // Return the public URL
        const publicUrl = `/notifications/${filename}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed" },
            { status: 500 }
        );
    }
}
