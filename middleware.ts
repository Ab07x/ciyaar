import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

const ADMIN_COOKIE_NAME = "fanbroj_admin_session";
const ADMIN_SECRET = process.env.ADMIN_TOKEN || "Ab128390";

/**
 * Verify the admin session cookie value.
 * Accepts both signed "timestamp.hmac" format and legacy "authenticated".
 */
function verifyAdminSession(value: string | undefined): boolean {
    if (!value) return false;

    // Signed format: "timestamp.hmac"
    const dotIndex = value.indexOf(".");
    if (dotIndex > 0) {
        const timestamp = value.substring(0, dotIndex);
        const providedHmac = value.substring(dotIndex + 1);
        const expectedHmac = crypto
            .createHmac("sha256", ADMIN_SECRET)
            .update(timestamp)
            .digest("hex");

        if (providedHmac.length !== expectedHmac.length) return false;

        try {
            const isValid = crypto.timingSafeEqual(
                Buffer.from(providedHmac, "hex"),
                Buffer.from(expectedHmac, "hex")
            );
            if (!isValid) return false;

            // Check if session is within 7 days
            const age = Date.now() - Number(timestamp);
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            return age >= 0 && age < maxAge;
        } catch {
            return false;
        }
    }

    // Legacy fallback — accept "authenticated" for existing sessions
    return value === "authenticated";
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /kism routes (except /kism/login and /api/kism/login)
    if (
        pathname.startsWith("/kism") &&
        pathname !== "/kism/login" &&
        !pathname.startsWith("/api/kism/login")
    ) {
        const adminSession = request.cookies.get(ADMIN_COOKIE_NAME);
        const isValid = verifyAdminSession(adminSession?.value);

        if (!isValid) {
            const loginUrl = new URL("/kism/login", request.url);
            loginUrl.searchParams.set("from", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/kism/:path*"],
};
