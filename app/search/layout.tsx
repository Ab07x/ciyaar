import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Raadi Filimaha Hindi Af Somali | Search Movies & Musalsal | Fanbroj",
    description: "Raadi filimaha Hindi Af Somali cusub 2026, musalsal, ciyaar live iyo wax badan. Search 900+ movies oo Af Somali ah bilaash HD – Fanbroj (Fanproj). Saafi Films, Mysomali, Astaan Films.",
    keywords: [
        "raadi filim af somali", "search hindi af somali", "fanbroj search",
        "filim cusub 2026", "musalsal af somali", "fanproj search",
        "hindi af somali cusub", "film hindi af somali",
        "fanbroj", "fanproj", "fanprojnet", "streamnxt fanproj",
    ],
    openGraph: {
        title: "Raadi Filimaha Hindi Af Somali | Fanbroj",
        description: "Search 900+ filim oo Af Somali ah – Hindi, Action, Drama, Comedy iyo wax badan – Fanbroj",
        url: "https://fanbroj.net/search",
        siteName: "Fanbroj",
    },
    twitter: {
        card: "summary_large_image",
        title: "Raadi Filimaha Hindi Af Somali | Fanbroj",
        description: "Search 900+ filim oo Af Somali ah bilaash HD – Fanbroj.",
    },
    alternates: {
        canonical: "https://fanbroj.net/search",
    },
    robots: {
        index: false,
        follow: true,
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "SearchResultsPage",
            "@id": "https://fanbroj.net/search#searchpage",
            "name": "Raadi Filimaha Hindi Af Somali – Fanbroj",
            "description": "Raadi filimaha Hindi Af Somali cusub, musalsal, ciyaar live – Fanbroj.",
            "url": "https://fanbroj.net/search",
            "isPartOf": { "@id": "https://fanbroj.net/#website" },
            "breadcrumb": { "@id": "https://fanbroj.net/search#breadcrumb" },
        },
        {
            "@type": "BreadcrumbList",
            "@id": "https://fanbroj.net/search#breadcrumb",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Fanproj", "item": "https://fanbroj.net" },
                { "@type": "ListItem", "position": 2, "name": "Search", "item": "https://fanbroj.net/search" },
            ],
        },
    ],
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
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
