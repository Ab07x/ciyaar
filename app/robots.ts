import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://fanbroj.net";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/admin/",
                    "/kism/",
                    "/dashboard/",
                    "/embed/",
                    "/pay",
                    "/success",
                    "/login",
                    "/_next/",
                ],
            },
            {
                userAgent: "Googlebot",
                allow: "/",
                disallow: [
                    "/api/",
                    "/admin/",
                    "/kism/",
                    "/dashboard/",
                    "/embed/",
                    "/pay",
                    "/success",
                    "/login",
                    "/_next/",
                ],
            },
            {
                userAgent: "Googlebot-Image",
                allow: ["/", "/img/", "/_next/image/"],
            },
            {
                userAgent: "Googlebot-Video",
                allow: "/",
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
