import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import MovieViewClient from "./MovieViewClient";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
    const movie = await fetchQuery(api.movies.getMovieBySlug, { slug: dbSlug });

    if (!movie) {
        return {
            title: "Movie Not Found - Fanbroj",
        };
    }

    const seoTitle = movie.titleSomali
        ? `${movie.titleSomali} (${movie.title}) Af Somali - Daawo Online | Fanbroj`
        : `${movie.title} Af Somali - Daawo Online | Fanbroj`;

    const keywords = [
        movie.title,
        movie.titleSomali,
        `${movie.title} af somali`,
        `${movie.title} hindi af somali`,
        ...(movie.tags || []),
        ...(movie.genres || []),
        "af somali",
        "fanproj",
        "fanbroj",
        "hindi af somali",
        "daawo online",
        movie.releaseDate?.split("-")[0],
    ].filter(Boolean).join(", ");

    // Use local poster for SEO if available
    const posterUrl = movie.posterUrl?.startsWith("/")
        ? `https://fanbroj.net${movie.posterUrl}`
        : movie.posterUrl || "";

    return {
        title: seoTitle,
        description: movie.overviewSomali || movie.overview,
        keywords: keywords,
        alternates: {
            canonical: `https://fanbroj.net/movies/${dbSlug}-af-somali`,
        },
        openGraph: {
            images: [posterUrl],
            title: seoTitle,
            description: movie.overviewSomali || movie.overview,
        },
    };
}

export async function generateStaticParams() {
    try {
        const movies = await fetchQuery(api.movies.listMovies, { limit: 20 });
        // Generate both old and new URL versions
        const params: { slug: string }[] = [];
        for (const movie of movies) {
            params.push({ slug: movie.slug });
            params.push({ slug: `${movie.slug}-af-somali` });
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
        redirect(`/movies/${dbSlug}-af-somali`);
    }

    const movie = await fetchQuery(api.movies.getMovieBySlug, { slug: dbSlug });

    return <MovieViewClient slug={dbSlug} preloadedMovie={movie} />;
}
