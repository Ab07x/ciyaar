import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserSession } from "@/lib/models";
import { USER_SESSION_COOKIE, clearUserSessionCookie, hashSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const sessionToken = request.cookies.get(USER_SESSION_COOKIE)?.value;

        if (sessionToken) {
            const tokenHash = hashSessionToken(sessionToken);
            await UserSession.updateOne(
                { tokenHash, revokedAt: { $exists: false } },
                { $set: { revokedAt: Date.now() } }
            );
        }

        const response = NextResponse.json({ success: true });
        clearUserSessionCookie(response);
        return response;
    } catch (error) {
        console.error("POST /api/auth/logout error:", error);
        const response = NextResponse.json({ success: true });
        clearUserSessionCookie(response);
        return response;
    }
}
