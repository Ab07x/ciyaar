import { NextResponse } from "next/server";

export async function GET() {
    return new NextResponse(
        `User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://fanbroj.net/sitemap.xml`,
        {
            headers: {
                "Content-Type": "text/plain",
            },
        }
    );
}
