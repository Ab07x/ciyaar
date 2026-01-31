import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /kism routes (except /kism/login)
    if (pathname.startsWith("/kism") && pathname !== "/kism/login") {
        const adminSession = request.cookies.get("fanbroj_admin_session");

        if (!adminSession || adminSession.value !== "authenticated") {
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
