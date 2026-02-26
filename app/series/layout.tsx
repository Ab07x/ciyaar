import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Musalsal Af Somali Cusub 2026 | Turkish, Hindi, Korean | Fanbroj",
    description: "Daawo musalsal af somali cusub 2026 bilaash HD. Musalsal turkish af somali, hindi drama af somali, Korean drama cusub – Fanbroj (Fanproj). Musalsalada ugu cusub ee Af Somali.",
    keywords: [
        "musalsal af somali", "musalsal af somali cusub", "musalsal af somali cusub 2026",
        "musalsal hindi af somali", "musalsal turkish af somali",
        "musalsal korean af somali", "musalsal cusub",
        "hindi drama af somali", "turkish drama af somali",
        "fanbroj musalsal", "fanproj musalsal", "fanbroj series",
        "saafi films musalsal", "mysomali musalsal",
        "hindi af somali", "fanbroj", "fanproj", "fanprojnet", "streamnxt fanproj",
    ],
    openGraph: {
        title: "Musalsal Af Somali Cusub 2026 | Turkish, Hindi, Korean | Fanbroj",
        description: "Daawo musalsal af somali cusub 2026 bilaash HD. Turkish, Hindi, Korean drama Af Somali – Fanbroj.",
        url: "https://fanbroj.net/series",
        siteName: "Fanbroj",
        images: ["/og-preview.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Musalsal Af Somali Cusub 2026 | Fanbroj",
        description: "Daawo musalsal af somali cusub 2026. Turkish, Hindi, Korean – Fanbroj.",
        images: ["/og-preview.png"],
    },
    alternates: {
        canonical: "https://fanbroj.net/series",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "CollectionPage",
            "@id": "https://fanbroj.net/series#collectionpage",
            url: "https://fanbroj.net/series",
            name: "Musalsal Af Somali Cusub 2026",
            description: "Daawo musalsalada Hindi Af Somali, Turkish, Korean cusub 2026 bilaash HD – Fanbroj (Fanproj).",
            isPartOf: { "@id": "https://fanbroj.net/#website" },
            breadcrumb: { "@id": "https://fanbroj.net/series#breadcrumb" },
        },
        {
            "@type": "BreadcrumbList",
            "@id": "https://fanbroj.net/series#breadcrumb",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Fanbroj", item: "https://fanbroj.net" },
                { "@type": "ListItem", position: 2, name: "Musalsal Af Somali Cusub 2026", item: "https://fanbroj.net/series" },
            ],
        },
    ],
};

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
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
