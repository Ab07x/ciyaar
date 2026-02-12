import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Live TV & Channels – Daawo Sports, News & Entertainment | Fanproj TV",
    description: "Daawo Live TV channels oo ku jira Fanproj TV. Sports live, news, entertainment, Somali channels – dhammaantood bilaash streaming HD.",
    keywords: [
        "fanproj tv", "live tv somali", "live sports streaming",
        "fanbroj live", "daawo live", "somali tv channels",
        "fanproj channels", "live football somali",
    ],
    openGraph: {
        title: "Live TV & Channels | Fanproj TV",
        description: "Daawo Live TV – Sports, News & Entertainment channels bilaash HD",
        url: "https://fanbroj.net/live",
    },
    alternates: {
        canonical: "https://fanbroj.net/live",
    },
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
    return children;
}
