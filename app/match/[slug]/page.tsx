import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import MatchClientPage from "./MatchClientPage";

interface MatchPageProps { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
    const { slug } = await params;
    const match = await fetchQuery(api.matches.getMatchBySlug, { slug });

    if (!match) return { title: "Match Not Found - Fanbroj" };

    const title = `${match.teamA} vs ${match.teamB}`;
    const description = `${title} waa ciyaar ka tirsan ${match.leagueName || "Horyaallada adduunka"}. Daawo ciyaarta maanta Fanbroj si toos ah.`;
    const imageUrl = match.thumbnailUrl || "https://fanbroj.net/og-image.jpg";

    return {
        title: `${title} – Daawo Ciyaar Live | Fanbroj`,
        description,
        openGraph: {
            title: `${title} – Daawo Ciyaar Live | Fanbroj`,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${title} live maanta`,
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} – Daawo Ciyaar Live | Fanbroj`,
            description,
            images: [imageUrl],
        },
    };
}

export default async function MatchPage({ params }: MatchPageProps) {
    const { slug } = await params;
    const match = await fetchQuery(api.matches.getMatchBySlug, { slug });

    const jsonLd = match ? {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": `${match.teamA} vs ${match.teamB}`,
        "description": `${match.teamA} vs ${match.teamB} live streaming on Fanbroj.net`,
        "startDate": new Date(match.kickoffAt).toISOString(),
        "homeTeam": {
            "@type": "SportsTeam",
            "name": match.teamA,
        },
        "awayTeam": {
            "@type": "SportsTeam",
            "name": match.teamB,
        },
        "location": {
            "@type": "Place",
            "name": match.leagueName || "Stadium",
        },
        "eventStatus": match.status === "live" ? "https://schema.org/EventLive" :
            match.status === "finished" ? "https://schema.org/EventPostponed" : // Approximate for finished
                "https://schema.org/EventScheduled",
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <MatchClientPage slug={slug} />
        </>
    );
}
