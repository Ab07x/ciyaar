import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        const adminToken = process.env.ADMIN_TOKEN;

        if (!adminToken) {
            return NextResponse.json(
                { error: "Admin token not configured" },
                { status: 500 }
            );
        }

        if (token !== adminToken) {
            return NextResponse.json(
                { error: "Token qaldan" },
                { status: 401 }
            );
        }

        const response = NextResponse.json({ success: true });

        // Set httpOnly cookie
        response.cookies.set("fanbroj_admin_session", "authenticated", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch {
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }
}
