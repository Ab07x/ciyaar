import type { Metadata } from "next";
import PricingClient from "./PricingClient";

/* ── SEO metadata ────────────────────────────────────────────── */

export const metadata: Metadata = {
    title: "Pricing – Fanbroj Premium | Stream Somali Movies & Live Sports",
    description:
        "Choose your Fanbroj plan. Stream 12,000+ Somali films, live Premier League, Champions League & NBA in HD. From $3.20/month. Pay via EVC Plus, Zaad, Sahal, M-Pesa, PayPal or card.",
    openGraph: {
        title: "Fanbroj Premium – From $3.20/month",
        description:
            "12,000+ Somali films, live sports HD, zero ads. Start today with EVC Plus, Zaad, PayPal or card.",
        url: "https://fanbroj.net/pricing",
        siteName: "Fanbroj",
        images: [
            { url: "https://fanbroj.net/img/lm-bg.jpg", width: 1200, height: 630, alt: "Fanbroj Premium" },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Fanbroj Premium – From $3.20/month",
        description: "12,000+ Somali films, live sports, zero ads.",
        images: ["https://fanbroj.net/img/lm-bg.jpg"],
    },
    alternates: { canonical: "https://fanbroj.net/pricing" },
    keywords: [
        "fanbroj premium", "somali streaming", "somali movies online", "evc plus subscription",
        "zaad payment streaming", "somali tv online", "premier league somali",
        "champions league live somali", "af somali films", "fanbroj pricing",
    ],
};

/* ── JSON-LD: Product schema ─────────────────────────────────── */

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Fanbroj Premium",
    description: "Stream 12,000+ Somali movies, live sports and series in HD. Ad-free. Instant access.",
    brand: { "@type": "Brand", name: "Fanbroj" },
    url: "https://fanbroj.net/pricing",
    image: "https://fanbroj.net/img/lm-bg.jpg",
    offers: [
        {
            "@type": "Offer",
            name: "Starter – Single Match",
            price: "0.20",
            priceCurrency: "USD",
            priceValidUntil: "2027-12-31",
            availability: "https://schema.org/InStock",
            url: "https://fanbroj.net/pricing",
        },
        {
            "@type": "Offer",
            name: "Plus – 7-Day Plan",
            price: "1.00",
            priceCurrency: "USD",
            priceValidUntil: "2027-12-31",
            availability: "https://schema.org/InStock",
            url: "https://fanbroj.net/pricing",
        },
        {
            "@type": "Offer",
            name: "Pro – Monthly Plan",
            price: "3.20",
            priceCurrency: "USD",
            priceValidUntil: "2027-12-31",
            availability: "https://schema.org/InStock",
            url: "https://fanbroj.net/pricing",
        },
        {
            "@type": "Offer",
            name: "Elite – Yearly Plan",
            price: "11.99",
            priceCurrency: "USD",
            priceValidUntil: "2027-12-31",
            availability: "https://schema.org/InStock",
            url: "https://fanbroj.net/pricing",
        },
    ],
    aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "39246",
        bestRating: "5",
        worstRating: "1",
    },
};

/* ── Page ─────────────────────────────────────────────────────── */

export default function PricingPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PricingClient />
        </>
    );
}
