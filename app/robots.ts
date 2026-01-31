import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://fanbroj.net"; // Default to production domain

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/kism/", "/dashboard/"],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
