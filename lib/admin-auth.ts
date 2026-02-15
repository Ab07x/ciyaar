import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "fanbroj_admin_session";
const ADMIN_SECRET = process.env.ADMIN_TOKEN || "Ab128390";

/**
 * Create a signed admin session value using HMAC.
 * Format: "timestamp.hmac"
 */
export function createAdminSessionValue(): string {
    const timestamp = Date.now().toString();
    const hmac = crypto.createHmac("sha256", ADMIN_SECRET).update(timestamp).digest("hex");
    return `${timestamp}.${hmac}`;
}

/**
 * Verify the admin session cookie is valid (signed with the correct secret).
 * Also accepts the legacy "authenticated" value for backwards compatibility
 * during the transition period.
 */
export function isAdminAuthenticated(req: NextRequest): boolean {
    const value = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!value) return false;

    // Accept signed value: "timestamp.hmac"
    const dotIndex = value.indexOf(".");
    if (dotIndex > 0) {
        const timestamp = value.substring(0, dotIndex);
        const providedHmac = value.substring(dotIndex + 1);
        const expectedHmac = crypto.createHmac("sha256", ADMIN_SECRET).update(timestamp).digest("hex");

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

/**
 * Set the admin session cookie on a response object.
 */
export function setAdminSessionCookie(response: NextResponse, isSecure: boolean) {
    const value = createAdminSessionValue();
    response.cookies.set(ADMIN_COOKIE_NAME, value, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    });
}
