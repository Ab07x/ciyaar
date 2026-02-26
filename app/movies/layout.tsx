import type { Metadata } from "next";

// Targets (GSC data):
//   "hindi af somali"            — 29K impressions
//   "filim hindi afsomali 2025"  — 14.8K impressions
//   "film hindi af somali"       — 11K impressions
//   "filin hindi af somali"      — 7.3K (misspelling)
//   "filim hindi afsomali"       — 5.5K impressions
//   "hindi af somali cusub"      — 4.3K impressions
//   "hindi af somali cusub 2026" — 1.1K impressions
export const metadata: Metadata = {
    title: "Daawo Filimada Hindi Af Somali Cusub 2026 | Fanbroj",
    description:
        "Daawo filimada Hindi Af Somali cusub 2026 bilaash HD. Filim hindi afsomali, film hindi af somali, filin hindi af somali cusub – Fanbroj (Fanproj). 900+ filim oo Af Somali ah. Astaan Films, Saafi Films, Zee Films, Mysomali.",
    keywords: [
        "hindi af somali", "hindi af somali cusub", "hindi af somali cusub 2026",
        "filim hindi afsomali", "filim hindi afsomali 2025", "filim hindi afsomali 2026",
        "film hindi af somali", "filin hindi af somali",
        "hindi afsomali", "hindi af somali cusub 2025",
        "fanproj nxt", "fanproj aflaam", "fanproj play",
        "astaan films hindi af somali", "saafi films", "saafi films hindi af somali",
        "zee films", "mysomali", "daawo filim af somali", "bollywood af somali",
        "fanproj", "fanbroj", "fanprojnet", "fanbaroj", "streamnxt fanproj",
    ],
    openGraph: {
        title: "Daawo Filimada Hindi Af Somali Cusub 2026 | Fanbroj",
        description:
            "Daawo filimada Hindi Af Somali cusub 2026 bilaash HD. Saafi Films, Mysomali, Astaan Films – Fanbroj.",
        url: "https://fanbroj.net/movies",
        siteName: "Fanbroj",
        type: "website",
        images: [{ url: "/og-preview.png", width: 1200, height: 630, alt: "Daawo Filimada Hindi Af Somali Cusub 2026 – Fanbroj" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Daawo Filimada Hindi Af Somali Cusub 2026 | Fanbroj",
        description: "Daawo filim hindi afsomali cusub 2026 bilaash HD – Fanbroj. Saafi Films, Mysomali, Astaan Films.",
        images: ["/og-preview.png"],
    },
    alternates: {
        canonical: "https://fanbroj.net/movies",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "CollectionPage",
            "@id": "https://fanbroj.net/movies#collectionpage",
            url: "https://fanbroj.net/movies",
            name: "Filimada Hindi Af Somali Cusub 2026",
            description: "Daawo dhammaan filimada Hindi Af Somali cusub 2026 bilaash HD – Fanbroj (Fanproj).",
            isPartOf: { "@id": "https://fanbroj.net/#website" },
            breadcrumb: { "@id": "https://fanbroj.net/movies#breadcrumb" },
        },
        {
            "@type": "BreadcrumbList",
            "@id": "https://fanbroj.net/movies#breadcrumb",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Fanbroj", item: "https://fanbroj.net" },
                { "@type": "ListItem", position: 2, name: "Filimada Hindi Af Somali Cusub 2026", item: "https://fanbroj.net/movies" },
            ],
        },
    ],
};

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
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
