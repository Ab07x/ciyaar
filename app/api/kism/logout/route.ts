import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const response = NextResponse.json({ success: true });

    // Check if request is via HTTPS or HTTP
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const isSecure = protocol === "https";

    // Clear session cookie with matching settings from login
    response.cookies.set("fanbroj_admin_session", "", {
        httpOnly: false, // Must match login setting
        secure: isSecure,
        sameSite: "lax",
        maxAge: 0, // Expire immediately
        path: "/",
    });

    return response;
}
