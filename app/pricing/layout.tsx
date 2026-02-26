import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Qiimaha & Plans | Fanbroj Premium – Bilaash & VIP",
    description: "Daawo filimaha Hindi Af Somali bilaash ama Premium. Fanbroj Premium: xayeysiis la'aan, 900+ filim, HD quality, offline download. Qiimaha bilaash ah. Fanbroj, Fanproj.",
    keywords: [
        "fanbroj premium", "fanproj premium", "fanbroj pricing", "fanbroj vip",
        "filim af somali bilaash", "fanbroj subscription", "fanproj free",
        "hindi af somali", "fanbroj", "fanproj", "fanprojnet",
    ],
    openGraph: {
        title: "Fanbroj Premium – Plans & Pricing",
        description: "Daawo 900+ filim Hindi Af Somali bilaash ama VIP. Xayeysiis la'aan, HD quality – Fanbroj.",
        url: "https://fanbroj.net/pricing",
        siteName: "Fanbroj",
    },
    twitter: {
        card: "summary_large_image",
        title: "Fanbroj Premium – Plans & Pricing",
        description: "Daawo 900+ filim Hindi Af Somali bilaash ama VIP – Fanbroj.",
    },
    alternates: {
        canonical: "https://fanbroj.net/pricing",
    },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
