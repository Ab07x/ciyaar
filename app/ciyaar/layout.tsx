import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Daawo Ciyaar Live Maanta | Football & Sports Streaming | Fanproj TV",
    description: "Daawo ciyaaraha kubadda cagta oo live tooska ah. Premier League, La Liga, Champions League, Koobka Adduunka - dhammaantood Af Somali. Fanproj TV, Fanbroj ciyaar live.",
    keywords: [
        "ciyaar live", "daawo ciyaar live", "ciyaar maanta",
        "fanproj tv", "fanproj ciyaar", "fanbroj live",
        "kubadda cagta live", "football live somali",
        "premier league live", "champions league live af somali",
    ],
    openGraph: {
        title: "Ciyaar Live Maanta – Football & Sports | Fanproj TV",
        description: "Daawo ciyaaraha kubadda cagta oo live ah tooska. Premier League, La Liga, Champions League - Fanproj TV.",
        url: "https://fanbroj.net/ciyaar",
        images: ["/og-image.jpg"],
    },
    alternates: {
        canonical: "https://fanbroj.net/ciyaar",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Daawo Ciyaar Live Maanta – Fanproj TV",
    "description": "Daawo ciyaaraha kubadda cagta oo live tooska ah. Premier League, La Liga, Champions League.",
    "url": "https://fanbroj.net/ciyaar",
    "isPartOf": { "@id": "https://fanbroj.net/#website" },
    "mainEntity": {
        "@type": "ItemList",
        "name": "Live & Upcoming Sports Matches",
        "itemListElement": [],
    },
    "provider": {
        "@type": "Organization",
        "name": "Fanproj TV",
        "url": "https://fanbroj.net",
    },
};

export default function CiyaarLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="container mx-auto px-4 py-8">{children}</div>
        </>
    );
}
