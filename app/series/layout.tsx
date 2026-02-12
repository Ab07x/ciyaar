import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Daawo Musalsal Hindi Af Somali Cusub 2026 | Fanproj Series",
    description: "Daawo musalsalada Hindi Af Somali cusub ee 2025 & 2026. Musalsal cusub, Indian drama Af Somali, Turkish drama - dhammaantood bilaash ah Fanproj (Fanbroj).",
    keywords: [
        "musalsal hindi af somali", "musalsal cusub", "musalsal af somali",
        "hindi drama af somali", "turkish drama af somali",
        "fanproj musalsal", "fanproj series", "fanbroj series",
        "indian drama somali", "saafi films musalsal",
    ],
    openGraph: {
        title: "Musalsal Hindi Af Somali Cusub 2026 – Fanproj Series",
        description: "Daawo musalsalada Hindi Af Somali cusub oo bilaash ah. Musalsal cusub, drama Af Somali - Fanproj.",
        url: "https://fanbroj.net/series",
        images: ["/og-image.jpg"],
    },
    alternates: {
        canonical: "https://fanbroj.net/series",
    },
};

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
