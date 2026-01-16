import { NextResponse } from "next/server";

export async function GET() {
    return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://fanbroj.net/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>always</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://fanbroj.net/ciyaar</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
    </urlset>`,
        {
            headers: {
                "Content-Type": "application/xml",
            },
        }
    );
}
