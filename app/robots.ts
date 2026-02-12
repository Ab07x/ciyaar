import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://fanbroj.net";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/kism/", "/dashboard/", "/api/", "/embed/"],
            },
            {
                userAgent: "Googlebot",
                allow: "/",
                disallow: ["/kism/", "/dashboard/", "/api/", "/embed/"],
            },
            {
                userAgent: "Googlebot-Image",
                allow: "/",
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
