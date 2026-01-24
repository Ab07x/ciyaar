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
        "description": `${match.teamA} vs ${match.teamB} live streaming - ${match.leagueName}`,
        "startDate": new Date(match.kickoffAt).toISOString(),
        "sport": "Soccer",
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
            "name": "Stadium", // Generic if unknown, or match.stadium if available
        },
        "organizer": {
            "@type": "Organization",
            "name": match.leagueName,
            "url": "https://fanbroj.net"
        },
        "eventStatus": match.status === "live" ? "https://schema.org/EventLive" :
            match.status === "finished" ? "https://schema.org/EventMovedOnline" :
                "https://schema.org/EventScheduled",
        "image": match.thumbnailUrl || "https://fanbroj.net/og-image.jpg",
        "offers": {
            "@type": "Offer",
            "url": `https://fanbroj.net/match/${slug}`,
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/OnlineOnly"
        }
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <div className="relative min-h-screen">
                {/* Background Image */}
                <div
                    className="fixed inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: "url('/stadium.jpg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-stadium-dark/90 via-stadium-dark/80 to-stadium-dark" />
                </div>

                <div className="relative z-10">
                    <MatchClientPage slug={slug} />
                </div>
            </div>
        </>
    );
}
