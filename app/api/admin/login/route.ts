import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { token } = await request.json();
        const inputToken = token?.trim();

        // 1. Check DB for custom Admin Password
        const settings = await fetchQuery(api.settings.getSettings);
        const dbAdminPassword = (settings as any)?.adminPassword;

        let isAuthenticated = false;

        if (dbAdminPassword) {
            // Priority: DB Password
            if (inputToken === dbAdminPassword) {
                isAuthenticated = true;
            }
        } else {
            // Fallback: Environment Variable
            const envAdminToken = process.env.ADMIN_TOKEN;
            if (envAdminToken && inputToken === envAdminToken) {
                isAuthenticated = true;
            }
        }

        if (!isAuthenticated) {
            return NextResponse.json(
                { error: "Token qaldan (Invalid Password)" },
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
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }
}
