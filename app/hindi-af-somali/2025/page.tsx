import type { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";
import Link from "next/link";
import { Film } from "lucide-react";

export const revalidate = 3600;

// ═══════════════════════════════════════════════════════════════
// TARGET KEYWORDS:
//   "filim hindi afsomali 2025"      — 15,931 impressions, 4.5% CTR (HUGE gap — fix title)
//   "hindi af somali cusub 2025"     —  3,596 impressions, 12% CTR
//   "fanproj afsomali 2025"          —  1,235 impressions, 35% CTR
//   "hindi af somali cusub"          —  4,314 impressions, 11% CTR
// Expected uplift: 4.5% → 20%+ CTR = +2,400 clicks/month
// ═══════════════════════════════════════════════════════════════
export const metadata: Metadata = {
    title: "Filim Hindi Afsomali 2025 – Daawo Cusub HD Bilaash | Fanproj",
    description:
        "Filim Hindi Afsomali 2025 cusub – daawo dhammaan filimaha la soo daayay 2025 oo HD ah bilaash. Hindi Af Somali cusub 2025: Astaan Films, Saafi Films, Bollywood Af Somali – Fanproj (Fanbroj).",
    keywords: [
        "filim hindi afsomali 2025", "filim hindi af somali 2025",
        "hindi af somali cusub 2025", "hindi af somali 2025",
        "fanproj afsomali 2025", "fanproj hindi af somali 2025",
        "hindi afsomali cusub 2025", "bollywood af somali 2025",
        "astaan films 2025 af somali", "saafi films 2025 af somali",
        "film cusub 2025 af somali", "daawo filim cusub 2025",
        "fanproj 2025", "fanbroj 2025",
    ],
    alternates: {
        canonical: "https://fanbroj.net/hindi-af-somali/2025",
    },
    openGraph: {
        title: "Filim Hindi Afsomali 2025 – Daawo Cusub HD Bilaash | Fanproj",
        description:
            "Daawo dhammaan filimaha Hindi Af Somali cusub 2025 bilaash HD. Astaan Films, Saafi Films, Bollywood – Fanproj (Fanbroj).",
        url: "https://fanbroj.net/hindi-af-somali/2025",
        type: "website",
        images: [{ url: "/og-preview.png", width: 1200, height: 630, alt: "Filim Hindi Afsomali 2025 – Fanproj" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Filim Hindi Afsomali 2025 | Fanproj",
        description: "Daawo filimaha Hindi Af Somali cusub 2025 bilaash HD – Fanproj (Fanbroj).",
        images: ["/og-preview.png"],
    },
};

export default async function HindiAfSomali2025Page() {
    let movies: any[] = [];
    let totalCount = 0;

    try {
        await connectDB();
        [movies, totalCount] = await Promise.all([
            Movie.find({
                isPublished: true,
                isDubbed: true,
                releaseDate: { $gte: "2025-01-01", $lt: "2026-01-01" },
            })
                .select("title titleSomali slug posterUrl releaseDate rating isPremium views genres")
                .sort({ releaseDate: -1, views: -1 })
                .limit(60)
                .lean(),
            Movie.countDocuments({
                isPublished: true,
                isDubbed: true,
                releaseDate: { $gte: "2025-01-01", $lt: "2026-01-01" },
            }),
        ]);
    } catch {
        // DB not available at build time
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": "https://fanbroj.net/hindi-af-somali/2025#collectionpage",
                url: "https://fanbroj.net/hindi-af-somali/2025",
                name: "Filim Hindi Afsomali 2025 – Filimaha Cusub",
                description: "Dhammaan filimaha Hindi Af Somali la soo daayay 2025 – daawo bilaash HD.",
                numberOfItems: totalCount,
                isPartOf: { "@id": "https://fanbroj.net/#website" },
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Fanproj", item: "https://fanbroj.net" },
                    { "@type": "ListItem", position: 2, name: "Hindi Af Somali", item: "https://fanbroj.net/hindi-af-somali" },
                    { "@type": "ListItem", position: 3, name: "2025", item: "https://fanbroj.net/hindi-af-somali/2025" },
                ],
            },
            {
                "@type": "ItemList",
                name: "Filim Hindi Afsomali 2025 Cusub",
                numberOfItems: Math.min(movies.length, 20),
                itemListElement: (movies as any[]).slice(0, 20).map((movie, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    item: {
                        "@type": "Movie",
                        name: movie.titleSomali || movie.title,
                        url: `https://fanbroj.net/movies/${movie.slug}-af-somali`,
                        image: movie.posterUrl || undefined,
                        dateCreated: movie.releaseDate,
                    },
                })),
            },
        ],
    };

    return (
        <div className="min-h-screen bg-[#0d1b2a]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── Hero ── */}
            <section className="relative py-14 md:py-20 border-b border-[#1a3a5c] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#E50914]/8 via-transparent to-transparent" />
                <div className="container mx-auto px-4 relative z-10">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/40 mb-6">
                        <Link href="/" className="hover:text-white transition-colors">Fanproj</Link>
                        <span>/</span>
                        <Link href="/hindi-af-somali" className="hover:text-white transition-colors">Hindi Af Somali</Link>
                        <span>/</span>
                        <span className="text-white/70">2025</span>
                    </nav>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">
                        Filim Hindi Afsomali{" "}
                        <span className="text-[#E50914]">2025</span> Cusub
                    </h1>
                    <p className="text-white/60 text-lg max-w-2xl mb-8 leading-relaxed">
                        Daawo{" "}
                        <strong className="text-white">{totalCount || "100"}+ filim</strong> Hindi Af Somali ah oo la
                        soo daayay 2025 — bilaash HD quality. Cusub lagu daray goor kasta.
                    </p>

                    {/* Year nav */}
                    <div className="flex flex-wrap gap-3">
                        <span className="px-5 py-2.5 bg-[#E50914] text-white font-bold rounded-full text-sm cursor-default">
                            2025 ✓
                        </span>
                        <Link
                            href="/hindi-af-somali"
                            className="px-5 py-2.5 bg-[#1a3a5c] hover:bg-[#2a4a6c] text-white font-semibold rounded-full text-sm border border-[#2a4a6c] transition-colors"
                        >
                            Dhammaan Sanadaha
                        </Link>
                        <Link
                            href="/movies"
                            className="px-5 py-2.5 bg-[#1a3a5c] hover:bg-[#2a4a6c] text-white font-semibold rounded-full text-sm border border-[#2a4a6c] transition-colors"
                        >
                            Dhammaan Filimada
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Movies Grid ── */}
            <section className="container mx-auto px-4 py-10 pb-16">
                {movies.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-white/50 text-sm">
                                <strong className="text-white">{totalCount}</strong> filim — Hindi Af Somali 2025
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {(movies as any[]).map((movie) => (
                                <MovieCard2025 key={String(movie._id)} movie={movie} />
                            ))}
                        </div>
                        <div className="mt-10 text-center">
                            <Link
                                href="/hindi-af-somali"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-[#1a3a5c] hover:bg-[#2a4a6c] border border-[#2a4a6c] text-white font-bold rounded-full transition-colors text-sm"
                            >
                                ← Dhammaan Hindi Af Somali
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <Film size={64} className="mx-auto mb-4 text-white/10" />
                        <p className="text-white/40">Filimaha 2025 waa la soo rarayo...</p>
                    </div>
                )}
            </section>

            {/* ── SEO Copy ── */}
            <section className="container mx-auto px-4 pb-16">
                <div className="bg-[#1a3a5c]/20 border border-[#1a3a5c] rounded-2xl p-8 max-w-4xl">
                    <h2 className="text-lg font-bold mb-4">
                        Filim Hindi Afsomali 2025 – Fanproj
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed mb-3">
                        Halkan waxaad ka helaysaa dhammaan filimaha Hindi Af Somali ee la soo daayay 2025.
                        Fanproj (Fanbroj.net) waxaanu ku darannaa filimaha cusub goor kasta —
                        Astaan Films, Saafi Films, Zee Films iyo dheeraad kale.
                        Dhammaan filmada waxaad ku daawanaysaa HD quality, bilaash ama Premium.
                    </p>
                    <p className="text-white/40 text-xs">
                        Fanproj NXT · Fanproj Play · Fanproj TV · StreamNXT ·
                        Hindi Af Somali Cusub 2025 · Filim Cusub 2025 · Bollywood Af Somali 2025
                    </p>
                </div>
            </section>
        </div>
    );
}

function MovieCard2025({ movie }: { movie: any }) {
    const year = movie.releaseDate?.split("-")[0];
    const month = movie.releaseDate ? new Date(movie.releaseDate).toLocaleString("en", { month: "short" }) : null;
    const title = movie.titleSomali || movie.title;
    return (
        <Link
            href={`/movies/${movie.slug}-af-somali`}
            className="group block relative rounded-lg overflow-hidden bg-[#1a3a5c] border border-[#2a4a6c] hover:border-[#E50914]/50 transition-all"
        >
            <div className="relative aspect-[2/3]">
                {movie.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={movie.posterUrl}
                        alt={`${title} Hindi Af Somali ${year}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-[#1a3a5c] flex items-center justify-center">
                        <Film size={32} className="text-white/20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-2 left-2 bg-[#9AE600] px-1.5 py-0.5 rounded text-[10px] font-bold text-black">
                    AF-SOMALI
                </div>
                {movie.rating > 0 && (
                    <div className="absolute top-2 right-2 bg-[#1a3a5c]/90 px-1.5 py-0.5 rounded text-[10px] text-white font-bold">
                        ★ {movie.rating?.toFixed(1)}
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                    <h3 className="font-bold text-xs text-white line-clamp-2">{title}</h3>
                    {month && year && (
                        <span className="text-[10px] text-gray-400">
                            {month} {year}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
