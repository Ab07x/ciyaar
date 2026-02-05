import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

// Admin credentials - set these in environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Support legacy token-only login
        const inputUsername = username?.trim() || "admin";
        const inputPassword = password?.trim() || body.token?.trim();

        if (!inputPassword) {
            return NextResponse.json(
                { error: "Password waa loo baahan yahay (Password required)" },
                { status: 400 }
            );
        }

        // Check DB for custom admin credentials
        let dbAdminUsername: string | undefined;
        let dbAdminPassword: string | undefined;
        try {
            const settings = await fetchQuery(api.settings.getSettings);
            dbAdminUsername = (settings as any)?.adminUsername;
            dbAdminPassword = (settings as any)?.adminPassword;
        } catch (err) {
            console.error("Failed to fetch settings from Convex:", err);
        }

        let isAuthenticated = false;

        // Check against DB credentials first (if set)
        if (dbAdminPassword && dbAdminPassword.trim()) {
            const validUsername = dbAdminUsername?.trim() || "admin";
            if (inputUsername === validUsername && inputPassword === dbAdminPassword.trim()) {
                isAuthenticated = true;
            }
        }

        // Fallback to environment variables
        if (!isAuthenticated && ADMIN_PASSWORD) {
            if (inputUsername === ADMIN_USERNAME && inputPassword === ADMIN_PASSWORD.trim()) {
                isAuthenticated = true;
            }
        }

        if (!isAuthenticated) {
            console.log("[Admin Login] Failed attempt for username:", inputUsername);
            return NextResponse.json(
                { error: "Username ama password qaldan (Invalid credentials)" },
                { status: 401 }
            );
        }

        console.log("[Admin Login] Success for:", inputUsername);
        const response = NextResponse.json({ success: true });

        // Check if request is from direct IP (HTTP) or domain (HTTPS)
        const host = request.headers.get("host") || "";
        const isDirectIP = /^\d+\.\d+\.\d+\.\d+/.test(host);
        const isSecure = !isDirectIP && process.env.NODE_ENV === "production";

        // Set session cookie
        response.cookies.set("fanbroj_admin_session", "authenticated", {
            httpOnly: false,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }
}

// Check auth status
export async function GET(request: Request) {
    const cookieHeader = request.headers.get("cookie") || "";
    const isAuth = cookieHeader.includes("fanbroj_admin_session=authenticated");

    return NextResponse.json({ authenticated: isAuth });
}
