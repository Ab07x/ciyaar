import type { Metadata } from "next";
import PremiumPlanPage from "./PremiumPlanPage";

export const metadata: Metadata = {
    title: "Get Premium – Fanbroj | Stream 12,000+ Somali Movies & Live Sports",
    description: "Choose your Fanbroj Premium plan. Stream 12,000+ Somali films, live Premier League & Champions League in HD. From $1/week. Pay via EVC Plus, Zaad, Sahal, M-Pesa, PayPal or card.",
    alternates: { canonical: "https://fanbroj.net/premium" },
};

export default function PremiumPage() {
    return <PremiumPlanPage />;
}
