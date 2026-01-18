import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Wararka Kubadda Cagta Maanta | Fanbroj News",
    description: "Kala soco Fanbroj wararkii ugu dambeeyay ee kubadda cagta, horyaallada Yurub, iyo faallooyinka ciyaaraha Soomaaliyeed.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
