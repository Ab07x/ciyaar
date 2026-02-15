import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MoviePlayClient from "@/app/movies/[slug]/play/MoviePlayClient";

export const revalidate = 0;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fanbroj.net";
    const res = await fetch(`${baseUrl}/api/movies/${slug}`, { cache: "no-store" });
    const movie = res.ok ? await res.json() : null;

    if (!movie) {
        return { title: "Movie Not Found - Fanbroj TV" };
    }

    return {
        title: `Daawo ${movie.titleSomali || movie.title} - Fanbroj TV`,
        description: movie.overviewSomali || movie.overview || "Daawo filimada Fanbroj TV.",
        robots: "noindex",
    };
}

export default async function TVMoviePlayPage({ params }: PageProps) {
    const { slug } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fanbroj.net";

    const [movieRes, settingsRes] = await Promise.all([
        fetch(`${baseUrl}/api/movies/${slug}`, { cache: "no-store" }),
        fetch(`${baseUrl}/api/settings`, { cache: "no-store" }),
    ]);

    const movie = movieRes.ok ? await movieRes.json() : null;
    const settings = settingsRes.ok ? await settingsRes.json() : null;

    if (!movie) {
        notFound();
    }

    return (
        <MoviePlayClient
            slug={slug}
            preloadedMovie={movie}
            preloadedSettings={settings}
            uiMode="tv"
        />
    );
}
