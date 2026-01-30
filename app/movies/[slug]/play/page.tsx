import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MoviePlayClient from "./MoviePlayClient";

export const revalidate = 0;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const movie = await fetchQuery(api.movies.getMovieBySlug, { slug });

    if (!movie) {
        return { title: "Movie Not Found - Fanbroj" };
    }

    return {
        title: `Watch ${movie.titleSomali || movie.title} - Fanbroj`,
        description: movie.overviewSomali || movie.overview,
        robots: "noindex", // Don't index play pages
    };
}

export default async function MoviePlayPage({ params }: PageProps) {
    const { slug } = await params;
    const movie = await fetchQuery(api.movies.getMovieBySlug, { slug });
    const settings = await fetchQuery(api.settings.getSettings);

    if (!movie) {
        notFound();
    }

    return <MoviePlayClient slug={slug} preloadedMovie={movie} preloadedSettings={settings} />;
}
