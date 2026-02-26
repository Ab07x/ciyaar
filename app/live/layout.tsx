import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Live TV Af Somali | Daawo Sports, News & Entertainment Bilaash | Fanbroj",
    description: "Daawo Live TV channels Af Somali bilaash HD. Sports live, kubadda cagta, news, entertainment – Fanbroj (Fanproj TV). Premier League, La Liga, Champions League live.",
    keywords: [
        "fanbroj tv", "fanproj tv", "live tv somali", "live tv af somali",
        "live sports streaming", "daawo live", "somali tv channels",
        "fanbroj live", "fanbroj channels", "live football somali",
        "kubadda cagta live", "ciyaar live", "fanbroj", "fanproj",
        "fanproj nxt", "fanprojnet", "streamnxt fanproj", "fanbaroj",
    ],
    openGraph: {
        title: "Live TV Af Somali | Fanbroj",
        description: "Daawo Live TV Af Somali bilaash HD – Sports, News & Entertainment – Fanbroj",
        url: "https://fanbroj.net/live",
        siteName: "Fanbroj",
        images: ["/og-preview.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Live TV Af Somali | Fanbroj",
        description: "Daawo Live TV Af Somali bilaash HD – Sports, News & Entertainment – Fanbroj",
        images: ["/og-preview.png"],
    },
    alternates: {
        canonical: "https://fanbroj.net/live",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "CollectionPage",
            "@id": "https://fanbroj.net/live#collectionpage",
            "name": "Live TV & Channels – Fanbroj TV",
            "description": "Daawo Live TV channels Af Somali – Sports, News, Entertainment bilaash HD streaming – Fanbroj.",
            "url": "https://fanbroj.net/live",
            "isPartOf": { "@id": "https://fanbroj.net/#website" },
            "breadcrumb": { "@id": "https://fanbroj.net/live#breadcrumb" },
            "mainEntity": {
                "@type": "ItemList",
                "name": "Live TV Channels",
                "itemListElement": [],
            },
            "provider": {
                "@type": "Organization",
                "name": "Fanbroj TV",
                "url": "https://fanbroj.net",
            },
        },
        {
            "@type": "BreadcrumbList",
            "@id": "https://fanbroj.net/live#breadcrumb",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Fanbroj", "item": "https://fanbroj.net" },
                { "@type": "ListItem", "position": 2, "name": "Live TV", "item": "https://fanbroj.net/live" },
            ],
        },
    ],
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
