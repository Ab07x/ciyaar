import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Daawo Ciyaar Live iyo Jadwalka Maanta | Fanbroj Ciyaar",
    description: "Halkan kala soco dhammaan ciyaaraha live-ka ah, jadwalka ciyaaraha maanta iyo kuwa soo socda oo ku baxa Af-Soomaali.",
};

export default function CiyaarLayout({ children }: { children: React.ReactNode }) {
    return <div className="container mx-auto px-4 py-8">{children}</div>;
}
