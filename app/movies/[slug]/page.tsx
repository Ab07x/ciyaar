import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import MovieViewClient from "./MovieViewClient";
import type { Metadata } from "next";

// Force dynamic rendering to ensure Admin sees updates instantly
export const revalidate = 0;
export const dynamicParams = true;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const movie = await fetchQuery(api.movies.getMovieBySlug, { slug });

    if (!movie) {
        return {
            title: "Movie Not Found - Fanbroj",
        };
    }

    const keywords = [
        movie.title,
        movie.titleSomali,
        ...(movie.tags || []),
        ...(movie.genres || []),
        "af somali",
        "fanproj",
        "hindi af somali",
        movie.releaseDate?.split("-")[0],
    ].filter(Boolean).join(", ");

    return {
        title: `${movie.titleSomali || movie.title} - Daawo Online | Fanbroj`,
        description: movie.overviewSomali || movie.overview,
        keywords: keywords,
        openGraph: {
            images: [movie.posterUrl || ""],
            title: movie.titleSomali || movie.title,
            description: movie.overviewSomali || movie.overview,
        },
    };
}

export async function generateStaticParams() {
    try {
        const movies = await fetchQuery(api.movies.listMovies, { limit: 20 });
        return movies.map((movie) => ({
            slug: movie.slug,
        }));
    } catch (e) {
        console.warn("Failed to generate static params for movies", e);
        return [];
    }
}

export default async function MovieViewPage({ params }: PageProps) {
    const { slug } = await params;
    const movie = await fetchQuery(api.movies.getMovieBySlug, { slug });

    return <MovieViewClient slug={slug} preloadedMovie={movie} />;
}
