export const revalidate = 0;
import type { Metadata } from "next";
import MatchClientPage from "./MatchClientPage";

interface MatchPageProps { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
    const { slug } = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://fanbroj.net'}/api/matches/${slug}`, { cache: 'no-store' });
    const match = res.ok ? await res.json() : null;

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
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://fanbroj.net'}/api/matches/${slug}`, { cache: 'no-store' });
    const match = res.ok ? await res.json() : null;

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
        "eventStatus": match.status === "live" ? "https://schema.org/EventScheduled" :
            match.status === "finished" ? "https://schema.org/EventCompleted" :
                "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
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
            <MatchClientPage slug={slug} />
        </>
    );
}
