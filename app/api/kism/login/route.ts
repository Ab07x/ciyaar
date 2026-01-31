import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { token } = await request.json();
        const inputToken = token?.trim();

        if (!inputToken) {
            return NextResponse.json(
                { error: "Password waa loo baahan yahay (Password required)" },
                { status: 400 }
            );
        }

        // 1. Check DB for custom Admin Password
        let dbAdminPassword: string | undefined;
        try {
            const settings = await fetchQuery(api.settings.getSettings);
            dbAdminPassword = (settings as any)?.adminPassword;
        } catch (err) {
            console.error("Failed to fetch settings from Convex:", err);
            // Continue to fallback
        }

        let isAuthenticated = false;

        // Environment Variable - always available as primary
        const envAdminToken = process.env.ADMIN_TOKEN;

        // Check against DB password if set, or env token
        if (dbAdminPassword && dbAdminPassword.trim()) {
            // DB Password has priority
            if (inputToken === dbAdminPassword.trim()) {
                isAuthenticated = true;
            }
        }

        // Also check env token (either as fallback or additional valid token)
        if (!isAuthenticated && envAdminToken && inputToken === envAdminToken.trim()) {
            isAuthenticated = true;
        }

        if (!isAuthenticated) {
            console.log("[Admin Login] Failed attempt");
            return NextResponse.json(
                { error: "Token qaldan (Invalid Password)" },
                { status: 401 }
            );
        }

        const response = NextResponse.json({ success: true });

        // Set cookie - NOT httpOnly so client can check it
        response.cookies.set("fanbroj_admin_session", "authenticated", {
            httpOnly: false, // Allow client-side check
            secure: process.env.NODE_ENV === "production",
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
