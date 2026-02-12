import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Raadi Filimaha Af Somali | Search Movies & Series | Fanproj",
    description: "Raadi filimaha Hindi Af Somali cusub, musalsal, ciyaar live iyo wax badan. Search 800+ movies oo Af Somali ah bilaash HD – Fanproj (Fanbroj).",
    keywords: [
        "raadi filim af somali", "search hindi af somali", "fanproj search",
        "filim cusub 2026", "musalsal af somali", "fanbroj search",
    ],
    openGraph: {
        title: "Raadi Filimaha Af Somali | Fanproj",
        description: "Search 800+ filim oo Af Somali ah – Hindi, Action, Drama, Comedy iyo wax badan",
        url: "https://fanbroj.net/search",
    },
    alternates: {
        canonical: "https://fanbroj.net/search",
    },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return children;
}
