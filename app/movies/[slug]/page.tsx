
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import MovieClient from "./MovieClient";
import type { Metadata } from "next";

// Force static generation for this page (ISR)
// Revalidate every 60 seconds
export const revalidate = 60;
export const dynamicParams = true; // Allow new pages to be generated on demand

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

    return {
        title: movie.titleSomali || movie.title,
        description: movie.overviewSomali || movie.overview,
        openGraph: {
            images: [movie.posterUrl || ""],
            title: movie.titleSomali || movie.title,
            description: movie.overviewSomali || movie.overview,
        },
    };
}

export async function generateStaticParams() {
    // Pre-build pages for the most popular/recent movies (e.g. top 20)
    // fetching all might be too slow if thousands of movies
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

export default async function MoviePage({ params }: PageProps) {
    const { slug } = await params;

    // Prefetch data on server
    const movie = await fetchQuery(api.movies.getMovieBySlug, { slug });
    const settings = await fetchQuery(api.settings.getSettings);

    return (
        <MovieClient
            slug={slug}
            preloadedMovie={movie}
            preloadedSettings={settings}
        />
    );
}
