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
    const description = `Daawo ciyaarta ${title} LIVE HD quality on Fanbroj.net. ${match.leagueName}`;
    const imageUrl = match.thumbnailUrl || "https://fanbroj.net/og-image.jpg"; // Fallback OG image

    return {
        title: `${title} - Fanbroj Live`,
        description,
        openGraph: {
            title: `${title} - Fanbroj Live`,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} - Fanbroj Live`,
            description,
            images: [imageUrl],
        },
    };
}

export default async function MatchPage({ params }: MatchPageProps) {
    const { slug } = await params;
    return <MatchClientPage slug={slug} />;
}
