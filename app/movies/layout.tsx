import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Daawo Filimaha Hindi Af Somali Cusub 2026 | Fanproj Movies",
    description: "Daawo dhammaan filimaha Hindi Af Somali cusub ee 2025 & 2026 oo bilaash ah HD quality. Bollywood, Astaan Films, Saafi Films - ku daawo Fanproj (Fanbroj). Hindi afsomali, fanproj aflaam, fanproj play.",
    keywords: [
        "hindi af somali", "hindi af somali cusub", "filim hindi af somali",
        "filim hindi afsomali 2025", "filim hindi afsomali 2026", "film hindi af somali",
        "fanproj", "fanproj aflaam", "fanproj films", "fanproj play",
        "astaan films hindi af somali", "saafi films", "bollywood af somali",
        "daawo filim af somali", "hindi afsomali", "fanproj afsomali",
        "mysomali", "fanbroj movies",
    ],
    openGraph: {
        title: "Hindi Af Somali Cusub 2026 – Daawo Filimaan FREE | Fanproj",
        description: "Daawo filimaha Hindi Af Somali cusub oo dhammaantood bilaash ah HD. Astaan Films, Saafi Films, Bollywood dubbed Af Somali.",
        url: "https://fanbroj.net/movies",
        images: ["/og-image.jpg"],
    },
    alternates: {
        canonical: "https://fanbroj.net/movies",
    },
};

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
