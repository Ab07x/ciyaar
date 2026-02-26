
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeriesClientPage from "./SeriesClientPage";
import connectDB from "@/lib/mongodb";
import { Series } from "@/lib/models";

// Force dynamic rendering as we rely on slug param
export const dynamic = "force-dynamic";

async function getSeries(slug: string) {
    try {
        await connectDB();
        const series = await Series.findOne({ slug }).lean();
        if (!series) return null;
        return JSON.parse(JSON.stringify(series));
    } catch (e) {
        console.error("Error fetching series for metadata:", e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const series = await getSeries(slug);

    if (!series) {
        return {
            title: "Series Not Found | Fanbroj",
            description: "The series you are looking for does not exist."
        };
    }

    const seriesName = series.titleSomali || series.title;
    const year = series.firstAirDate?.split("-")[0] || "";
    const isDubbed = series.isDubbed;

    const title = isDubbed
        ? `${seriesName} Af Somali | Musalsal ${series.title} ${year} | Fanbroj`
        : `${series.title} Af Somali | Musalsal | Fanbroj`;

    const description = isDubbed
        ? `Daawo ${seriesName} (${series.title}) musalsal af somali cusub ${year} bilaash HD. ${(series.genres || []).slice(0, 3).join(", ")} – Fanbroj (Fanproj). ${(series.overviewSomali || series.overview || "").slice(0, 120)}`
        : `Daawo ${series.title} musalsal af somali ${year} bilaash online HD. Fanbroj – ${(series.overviewSomali || series.overview || "").slice(0, 140)}`;

    const posterUrl = series.posterUrl?.startsWith("/")
        ? `https://fanbroj.net${series.posterUrl}`
        : series.posterUrl || "";
    const imageUrl = series.backdropUrl || posterUrl || "/og-image.jpg";

    const keywords = [
        series.title,
        series.titleSomali,
        `${series.title} af somali`,
        `${series.title} musalsal af somali`,
        `daawo ${series.title} af somali`,
        `${series.title} ${year}`,
        ...(series.tags || []),
        ...(series.genres || []),
        "musalsal af somali", "musalsal af somali cusub", "musalsal af somali cusub 2026",
        "hindi af somali", "fanbroj", "fanproj", "fanproj nxt",
        "daawo bilaash", "musalsal cusub",
        year,
    ].filter(Boolean).join(", ");

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical: `https://fanbroj.net/series/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `https://fanbroj.net/series/${slug}`,
            siteName: "Fanbroj",
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${seriesName} - Musalsal Af Somali ${year} | Fanbroj`,
                },
            ],
            type: "video.tv_show",
        },
        twitter: {
            card: "summary_large_image",
            title: `${seriesName} - Musalsal Af Somali ${year} | Fanbroj`,
            description,
            images: [imageUrl],
        },
    };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const series = await getSeries(slug);

    if (!series) return notFound();

    // JSON-LD: @graph with TVSeries + VideoObject + BreadcrumbList
    const seriesName = series.titleSomali || series.title;
    const year = series.firstAirDate?.split("-")[0] || "";
    const posterUrl = series.posterUrl?.startsWith("/")
        ? `https://fanbroj.net${series.posterUrl}`
        : series.posterUrl || "";
    const canonicalUrl = `https://fanbroj.net/series/${slug}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            // 1. TVSeries entity
            {
                "@type": "TVSeries",
                "@id": `${canonicalUrl}#tvseries`,
                name: seriesName,
                alternateName: series.titleSomali ? series.title : undefined,
                description: series.overviewSomali || series.overview || "",
                image: posterUrl || undefined,
                startDate: series.firstAirDate || undefined,
                endDate: series.lastAirDate || undefined,
                numberOfSeasons: series.numberOfSeasons || undefined,
                numberOfEpisodes: series.numberOfEpisodes || undefined,
                genre: series.genres || [],
                inLanguage: series.isDubbed ? "so" : "en",
                url: canonicalUrl,
                ...(series.rating && series.rating > 0 ? {
                    aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: series.rating,
                        bestRating: 10,
                        ratingCount: Math.max(series.views || 1, 1),
                    },
                } : {}),
                potentialAction: {
                    "@type": "WatchAction",
                    target: canonicalUrl,
                },
                provider: {
                    "@type": "Organization",
                    name: "Fanproj",
                    url: "https://fanbroj.net",
                },
            },
            // 2. VideoObject — enables Google video rich results
            {
                "@type": "VideoObject",
                "@id": `${canonicalUrl}#video`,
                name: series.isDubbed
                    ? `${seriesName} (${series.title}) – Musalsal Af Somali ${year}`
                    : `${seriesName} – Af Somali ${year}`,
                description: series.overviewSomali || series.overview || `Daawo ${seriesName} Af Somali bilaash HD – Fanproj.`,
                thumbnailUrl: posterUrl || "https://fanbroj.net/og-preview.png",
                uploadDate: series.createdAt || series.firstAirDate || new Date().toISOString(),
                inLanguage: "so",
                publisher: {
                    "@type": "Organization",
                    name: "Fanproj",
                    url: "https://fanbroj.net",
                    logo: {
                        "@type": "ImageObject",
                        url: "https://fanbroj.net/icon-192.png",
                    },
                },
                potentialAction: {
                    "@type": "WatchAction",
                    target: canonicalUrl,
                },
            },
            // 3. BreadcrumbList — shows "Fanproj > Musalsal > [Title]" in SERP
            {
                "@type": "BreadcrumbList",
                "@id": `${canonicalUrl}#breadcrumb`,
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Fanproj", item: "https://fanbroj.net" },
                    { "@type": "ListItem", position: 2, name: "Musalsal", item: "https://fanbroj.net/series" },
                    { "@type": "ListItem", position: 3, name: seriesName, item: canonicalUrl },
                ],
            },
        ],
    };

    // Clean undefined values from JSON-LD
    const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd));

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanJsonLd) }}
            />
            <SeriesClientPage initialSeries={series} />
        </>
    );
}
