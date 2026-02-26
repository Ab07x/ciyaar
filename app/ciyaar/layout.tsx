import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ciyaaraha Live Af Somali | Kubadda Cagta | Fanbroj",
    description: "Daawo ciyaaraha kubadda cagta oo live tooska ah Af Somali. Premier League, La Liga, Champions League, Koobka Adduunka – Fanbroj (Fanproj TV). Ciyaar live bilaash.",
    keywords: [
        "ciyaar live", "ciyaaraha live af somali", "daawo ciyaar live",
        "ciyaar maanta", "kubadda cagta live", "kubadda cagta af somali",
        "fanbroj tv", "fanproj tv", "fanbroj ciyaar", "fanbroj",
        "football live somali", "premier league live af somali",
        "champions league live af somali", "la liga live",
        "fanproj nxt", "fanprojnet", "streamnxt fanproj", "fanbaroj",
    ],
    openGraph: {
        title: "Ciyaaraha Live Af Somali | Kubadda Cagta | Fanbroj",
        description: "Daawo ciyaaraha kubadda cagta live Af Somali. Premier League, La Liga, Champions League – Fanbroj.",
        url: "https://fanbroj.net/ciyaar",
        siteName: "Fanbroj",
        images: ["/og-preview.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Ciyaaraha Live Af Somali | Fanbroj",
        description: "Daawo ciyaaraha kubadda cagta live Af Somali – Premier League, Champions League – Fanbroj.",
        images: ["/og-preview.png"],
    },
    alternates: {
        canonical: "https://fanbroj.net/ciyaar",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "CollectionPage",
            "@id": "https://fanbroj.net/ciyaar#collectionpage",
            "name": "Ciyaaraha Live Af Somali – Kubadda Cagta | Fanbroj",
            "description": "Daawo ciyaaraha kubadda cagta oo live tooska ah Af Somali. Premier League, La Liga, Champions League – Fanbroj.",
            "url": "https://fanbroj.net/ciyaar",
            "isPartOf": { "@id": "https://fanbroj.net/#website" },
            "breadcrumb": { "@id": "https://fanbroj.net/ciyaar#breadcrumb" },
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
        },
        {
            "@type": "BreadcrumbList",
            "@id": "https://fanbroj.net/ciyaar#breadcrumb",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Fanproj", "item": "https://fanbroj.net" },
                { "@type": "ListItem", "position": 2, "name": "Ciyaaraha Live", "item": "https://fanbroj.net/ciyaar" },
            ],
        },
    ],
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
