import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Live TV & Channels – Daawo Sports, News & Entertainment | Fanproj TV",
    description: "Daawo Live TV channels oo ku jira Fanproj TV. Sports live, news, entertainment, Somali channels – dhammaantood bilaash streaming HD.",
    keywords: [
        "fanproj tv", "live tv somali", "live sports streaming",
        "fanbroj live", "daawo live", "somali tv channels",
        "fanproj channels", "live football somali",
    ],
    openGraph: {
        title: "Live TV & Channels | Fanproj TV",
        description: "Daawo Live TV – Sports, News & Entertainment channels bilaash HD",
        url: "https://fanbroj.net/live",
    },
    alternates: {
        canonical: "https://fanbroj.net/live",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Live TV & Channels – Fanproj TV",
    "description": "Daawo Live TV channels – Sports, News, Entertainment bilaash HD streaming.",
    "url": "https://fanbroj.net/live",
    "isPartOf": { "@id": "https://fanbroj.net/#website" },
    "mainEntity": {
        "@type": "ItemList",
        "name": "Live TV Channels",
        "itemListElement": [],
    },
    "provider": {
        "@type": "Organization",
        "name": "Fanproj TV",
        "url": "https://fanbroj.net",
    },
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}
