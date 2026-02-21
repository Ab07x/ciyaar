import type { Metadata } from "next";

// Targets:
//   "filim hindi afsomali 2025"  — 15,931 impressions, 4.5% CTR (fix: include "2025" in title + compelling desc)
//   "film hindi af somali"       — 10,852 impressions, 7% CTR
//   "hindi af somali"            — 29,742 impressions, 11% CTR
//   "fanproj aflaam"             —  2,899 impressions
export const metadata: Metadata = {
    title: "Filim Hindi Af Somali 2025 – Daawo 933+ Filim Cusub HD Bilaash | Fanproj",
    description:
        "Filim Hindi Afsomali 2025 & 2026 – daawo 933+ film cusub oo HD ah bilaash. Astaan Films, Saafi Films, Bollywood Af Somali. Fanproj (Fanbroj) – goobta ugu weyn film Hindi Af Somali cusub.",
    keywords: [
        "hindi af somali", "hindi af somali cusub", "filim hindi af somali",
        "filim hindi afsomali 2025", "filim hindi afsomali 2026",
        "film hindi af somali", "hindi afsomali", "hindi af somali cusub 2025",
        "fanproj aflaam", "fanproj films", "fanproj play", "fanproj afsomali",
        "astaan films hindi af somali", "saafi films hindi af somali",
        "daawo filim af somali", "bollywood af somali",
        "fanproj", "fanbroj", "mysomali",
    ],
    openGraph: {
        title: "Filim Hindi Af Somali 2025 – Daawo 933+ Filim HD Bilaash | Fanproj",
        description:
            "Daawo 933+ filim Hindi Af Somali cusub 2025 & 2026 bilaash HD. Astaan Films, Saafi Films, Bollywood Af Somali – Fanproj (Fanbroj).",
        url: "https://fanbroj.net/movies",
        type: "website",
        images: [{ url: "/og-preview.png", width: 1200, height: 630, alt: "Filim Hindi Af Somali – Fanproj" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Filim Hindi Af Somali 2025 | Fanproj",
        description: "Daawo 933+ filim Hindi Af Somali cusub 2025 & 2026 bilaash HD – Fanproj (Fanbroj).",
        images: ["/og-preview.png"],
    },
    alternates: {
        canonical: "https://fanbroj.net/movies",
    },
};

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
