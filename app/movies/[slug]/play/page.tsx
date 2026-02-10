import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import MoviePlayClient from "./MoviePlayClient";

export const revalidate = 0;

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
        return { title: "Movie Not Found - Fanbroj" };
    }

    return {
        title: `Daawo ${movie.titleSomali || movie.title} Af Somali - Fanbroj`,
        description: movie.overviewSomali || movie.overview,
        robots: "noindex", // Don't index play pages
    };
}

export default async function MoviePlayPage({ params }: PageProps) {
    const { slug } = await params;
    const dbSlug = getDbSlug(slug);

    // Redirect old URLs to new af-somali URLs
    if (!slug.endsWith("-af-somali")) {
        permanentRedirect(`/movies/${dbSlug}-af-somali/play`);
    }

    const movie = await fetchQuery(api.movies.getMovieBySlug, { slug: dbSlug });
    const settings = await fetchQuery(api.settings.getSettings);

    if (!movie) {
        notFound();
    }

    return <MoviePlayClient slug={dbSlug} preloadedMovie={movie} preloadedSettings={settings} />;
}
