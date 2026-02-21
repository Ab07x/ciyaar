
import MovieViewClient from "./MovieViewClient";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

// Force dynamic rendering to ensure Admin sees updates instantly
export const revalidate = 0;
export const dynamicParams = true;

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Strip "-af-somali" suffix to get the actual DB slug
function getDbSlug(urlSlug: string): string {
    return urlSlug.replace(/-af-somali$/, "");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const dbSlug = getDbSlug(slug);
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://fanbroj.net'}/api/movies/${dbSlug}`, { cache: 'no-store' });
    const movie = res.ok ? await res.json() : null;

    if (!movie) {
        return {
            title: "Movie Not Found - Fanbroj",
        };
    }

    const year = movie.releaseDate?.split("-")[0] || "";
    const isDubbed = movie.isDubbed;
    const movieName = movie.titleSomali || movie.title;

    const seoTitle = isDubbed
        ? `${movieName} (${movie.title}) Hindi Af Somali ${year} - Daawo Online FREE | Fanproj`
        : `${movie.title} Af Somali ${year} - Daawo Online | Fanproj`;

    const seoDescription = isDubbed
        ? `Daawo ${movieName} (${movie.title}) oo Hindi Af Somali ah ${year} bilaash ah HD. ${(movie.genres || []).slice(0, 3).join(", ")} - Fanproj (Fanbroj). ${(movie.overviewSomali || movie.overview || "").slice(0, 120)}`
        : `Daawo ${movie.title} Af Somali ${year} online HD. ${(movie.overviewSomali || movie.overview || "").slice(0, 140)}`;

    const keywords = [
        movie.title,
        movie.titleSomali,
        `${movie.title} af somali`,
        `${movie.title} hindi af somali`,
        `daawo ${movie.title} af somali`,
        `${movie.title} ${year}`,
        `${movie.title} af somali ${year}`,
        ...(movie.tags || []),
        ...(movie.genres || []),
        "af somali", "hindi af somali", "hindi af somali cusub",
        "fanproj", "fanbroj", "fanproj aflaam", "fanproj play",
        "daawo online", "filim hindi af somali",
        year,
    ].filter(Boolean).join(", ");

    const posterUrl = movie.posterUrl?.startsWith("/")
        ? `https://fanbroj.net${movie.posterUrl}`
        : movie.posterUrl || "";

    return {
        title: seoTitle,
        description: seoDescription,
        keywords,
        alternates: {
            canonical: `https://fanbroj.net/movies/${dbSlug}-af-somali`,
        },
        openGraph: {
            type: "video.movie",
            title: seoTitle,
            description: seoDescription,
            url: `https://fanbroj.net/movies/${dbSlug}-af-somali`,
            siteName: "Fanproj – Fanbroj.net",
            images: [
                {
                    url: posterUrl,
                    width: 500,
                    height: 750,
                    alt: `${movieName} - Hindi Af Somali ${year} | Fanproj`,
                },
            ],
            releaseDate: movie.releaseDate,
        },
        twitter: {
            card: "summary_large_image",
            title: isDubbed ? `${movieName} - Hindi Af Somali ${year} | Fanproj` : `${movie.title} - Af Somali | Fanproj`,
            description: seoDescription,
            images: [posterUrl],
        },
    };
}

export async function generateStaticParams() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://fanbroj.net'}/api/movies?limit=20`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        const movies = Array.isArray(data) ? data : data?.movies || [];
        const params: { slug: string }[] = [];
        for (const movie of movies) {
            if (movie?.slug) {
                params.push({ slug: `${movie.slug}-af-somali` });
            }
        }
        return params;
    } catch (e) {
        console.warn("Failed to generate static params for movies", e);
        return [];
    }
}

export default async function MovieViewPage({ params }: PageProps) {
    const { slug } = await params;
    const dbSlug = getDbSlug(slug);

    // Redirect old URLs to new af-somali URLs for SEO
    if (!slug.endsWith("-af-somali")) {
        permanentRedirect(`/movies/${dbSlug}-af-somali`);
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://fanbroj.net'}/api/movies/${dbSlug}`, { cache: 'no-store' });
    const movie = res.ok ? await res.json() : null;

    // JSON-LD: @graph with Movie + VideoObject + BreadcrumbList
    // VideoObject enables Google's video rich results (increases CTR significantly)
    // BreadcrumbList enables breadcrumb display in SERPs
    const movieName = movie ? (movie.titleSomali || movie.title) : "";
    const year = movie?.releaseDate?.split("-")[0] || "";
    const posterUrl = movie?.posterUrl?.startsWith("/")
        ? `https://fanbroj.net${movie.posterUrl}`
        : movie?.posterUrl || "";
    const canonicalUrl = `https://fanbroj.net/movies/${dbSlug}-af-somali`;

    const jsonLd = movie ? {
        "@context": "https://schema.org",
        "@graph": [
            // 1. Movie entity
            {
                "@type": "Movie",
                "@id": `${canonicalUrl}#movie`,
                name: movieName,
                alternateName: movie.titleSomali ? movie.title : undefined,
                description: movie.overviewSomali || movie.overview || "",
                image: posterUrl || undefined,
                datePublished: movie.releaseDate,
                genre: movie.genres || [],
                inLanguage: movie.isDubbed ? "so" : "en",
                url: canonicalUrl,
                ...(movie.rating && movie.rating > 0 ? {
                    aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: movie.rating,
                        bestRating: 10,
                        ratingCount: Math.max(movie.views || 1, 1),
                    },
                } : {}),
                ...(movie.duration ? { duration: `PT${movie.duration}M` } : {}),
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
                name: movie.isDubbed
                    ? `${movieName} (${movie.title}) – Hindi Af Somali ${year}`
                    : `${movieName} – Af Somali ${year}`,
                description: movie.overviewSomali || movie.overview || `Daawo ${movieName} Af Somali bilaash HD – Fanproj.`,
                thumbnailUrl: posterUrl || "https://fanbroj.net/og-preview.png",
                uploadDate: movie.createdAt || movie.releaseDate || new Date().toISOString(),
                ...(movie.duration ? { duration: `PT${movie.duration}M` } : {}),
                embedUrl: canonicalUrl,
                contentUrl: canonicalUrl,
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
                ...(movie.rating && movie.rating > 0 ? {
                    aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: movie.rating,
                        bestRating: 10,
                        ratingCount: Math.max(movie.views || 1, 1),
                    },
                } : {}),
            },
            // 3. BreadcrumbList — shows "Fanproj > Movies > [Title]" in SERP
            {
                "@type": "BreadcrumbList",
                "@id": `${canonicalUrl}#breadcrumb`,
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Fanproj", item: "https://fanbroj.net" },
                    { "@type": "ListItem", position: 2, name: "Hindi Af Somali", item: "https://fanbroj.net/hindi-af-somali" },
                    { "@type": "ListItem", position: 3, name: movieName, item: canonicalUrl },
                ],
            },
        ],
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <MovieViewClient slug={dbSlug} preloadedMovie={movie} />
        </>
    );
}
