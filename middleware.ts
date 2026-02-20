import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "fanbroj_admin_session";
const ADMIN_SECRET = process.env.ADMIN_TOKEN || "Ab128390";

async function getHmacKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(ADMIN_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

async function verifyAdminSession(value: string | undefined): Promise<boolean> {
    if (!value) return false;

    // Signed format: "timestamp.hmac"
    const dotIndex = value.indexOf(".");
    if (dotIndex > 0) {
        const timestamp = value.substring(0, dotIndex);
        const providedHmac = value.substring(dotIndex + 1);

        // Must be 64 lowercase hex chars (SHA-256)
        if (providedHmac.length !== 64 || !/^[0-9a-f]+$/.test(providedHmac)) return false;

        try {
            const key = await getHmacKey();
            // crypto.subtle.verify is timing-safe
            const isValid = await crypto.subtle.verify(
                "HMAC",
                key,
                hexToBytes(providedHmac),
                new TextEncoder().encode(timestamp)
            );
            if (!isValid) return false;

            // Check if session is within 7 days
            const age = Date.now() - Number(timestamp);
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            return age >= 0 && age < maxAge;
        } catch {
            return false;
        }
    }

    // Legacy fallback — accept "authenticated" for existing sessions
    return value === "authenticated";
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /kism routes (except /kism/login and /api/kism/login)
    if (
        pathname.startsWith("/kism") &&
        pathname !== "/kism/login" &&
        !pathname.startsWith("/api/kism/login")
    ) {
        const adminSession = request.cookies.get(ADMIN_COOKIE_NAME);
        const isValid = await verifyAdminSession(adminSession?.value);

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
