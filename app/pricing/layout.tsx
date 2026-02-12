import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Qiimaha & Plans | Fanproj Premium – Bilaash & VIP | Fanbroj",
    description: "Daawo filimaha Af Somali bilaash ama Premium. Fanproj Premium: xayeysiis la'aan, 800+ filim, HD quality, offline download. Qiimaha bilaash ah.",
    keywords: [
        "fanproj premium", "fanproj pricing", "fanbroj vip",
        "filim af somali bilaash", "fanproj subscription", "fanproj free",
    ],
    openGraph: {
        title: "Fanproj Premium – Plans & Pricing",
        description: "Daawo 800+ filim Af Somali bilaash ama VIP. Xayeysiis la'aan, HD quality.",
        url: "https://fanbroj.net/pricing",
    },
    alternates: {
        canonical: "https://fanbroj.net/pricing",
    },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
