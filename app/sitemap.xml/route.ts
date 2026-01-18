import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

export async function GET() {
  const matches = await fetchQuery(api.matches.listMatches, {});
  const posts = await fetchQuery(api.posts.listPosts, { isPublished: true });

  const baseUrl = "https://fanbroj.net";

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>always</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${baseUrl}/ciyaar</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      <url>
        <loc>${baseUrl}/blog</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      ${matches.map((m) => `
      <url>
        <loc>${baseUrl}/match/${m.slug}</loc>
        <lastmod>${new Date(m.updatedAt || Date.now()).toISOString()}</lastmod>
        <changefreq>hourly</changefreq>
        <priority>0.8</priority>
      </url>
      `).join("")}
      ${posts.map((p) => `
      <url>
        <loc>${baseUrl}/blog/${p.slug}</loc>
        <lastmod>${new Date(p.updatedAt || p._creationTime).toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>
      `).join("")}
    </urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
