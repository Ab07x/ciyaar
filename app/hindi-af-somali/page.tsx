import type { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";
import Link from "next/link";
import { Film } from "lucide-react";

// Revalidate every hour — picks up newly added movies
export const revalidate = 3600;

// ═══════════════════════════════════════════════════════════════
// TARGET KEYWORDS (from GSC data):
//   "hindi af somali"           — 29,742 impressions, 11% CTR  → target 25%+ = +4,200 clicks/mo
//   "film hindi af somali"      — 10,852 impressions,  7% CTR  → target 20%+ = +1,400 clicks/mo
//   "filim hindi afsomali"      —  6,816 impressions,  6% CTR
//   "hindi af somali cusub"     —  4,314 impressions, 11% CTR
//   "hindi afsomali"            —  4,565 impressions, 13% CTR
//   "astaan films hindi af somali" — 5,657 impressions, 16% CTR
// ═══════════════════════════════════════════════════════════════
export const metadata: Metadata = {
    title: "Hindi Af Somali – Daawo Filimaha Cusub 2025 & 2026 | Fanproj",
    description:
        "Daawo dhammaan filimaha Hindi Af Somali cusub 2025 & 2026 bilaash HD. Film Hindi Afsomali cusub – Astaan Films, Saafi Films, Bollywood Af Somali. Fanproj (Fanbroj) – goobta ugu weyn.",
    keywords: [
        "hindi af somali", "hindi af somali cusub", "hindi af somali cusub 2025",
        "filim hindi af somali", "filim hindi afsomali", "film hindi af somali",
        "hindi afsomali", "fanproj hindi af somali", "fanbroj hindi af somali",
        "astaan films hindi af somali", "saafi films hindi af somali",
        "bollywood af somali", "daawo hindi af somali",
        "hindi af somali 2025", "hindi af somali 2026",
        "fanproj afsomali", "fanproj aflaam",
    ],
    alternates: {
        canonical: "https://fanbroj.net/hindi-af-somali",
    },
    openGraph: {
        title: "Hindi Af Somali – Daawo Filimaha Cusub 2025 & 2026 | Fanproj",
        description:
            "Daawo dhammaan filimaha Hindi Af Somali cusub bilaash HD. Astaan Films, Saafi Films, Bollywood Af Somali – Fanproj (Fanbroj).",
        url: "https://fanbroj.net/hindi-af-somali",
        type: "website",
        images: [{ url: "/og-preview.png", width: 1200, height: 630, alt: "Hindi Af Somali – Fanproj" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Hindi Af Somali – Daawo Filimaha Cusub 2025 & 2026 | Fanproj",
        description: "Daawo dhammaan filimaha Hindi Af Somali cusub bilaash HD – Fanproj (Fanbroj).",
        images: ["/og-preview.png"],
    },
};

export default async function HindiAfSomaliPage() {
    let movies: any[] = [];
    let recentMovies: any[] = [];
    let totalCount = 0;

    try {
        await connectDB();
        [movies, totalCount] = await Promise.all([
            Movie.find({ isPublished: true, isDubbed: true })
                .select("title titleSomali slug posterUrl releaseDate rating isPremium views genres")
                .sort({ views: -1 })
                .limit(48)
                .lean(),
            Movie.countDocuments({ isPublished: true, isDubbed: true }),
        ]);

        // Recent 2025+ releases sorted by date
        recentMovies = await Movie.find({
            isPublished: true,
            isDubbed: true,
            releaseDate: { $gte: "2025-01-01" },
        })
            .select("title titleSomali slug posterUrl releaseDate rating isPremium views")
            .sort({ releaseDate: -1 })
            .limit(12)
            .lean();
    } catch {
        // DB not available at build time
    }

    // JSON-LD: CollectionPage + BreadcrumbList + ItemList
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": "https://fanbroj.net/hindi-af-somali#collectionpage",
                url: "https://fanbroj.net/hindi-af-somali",
                name: "Filimaha Hindi Af Somali Cusub 2025 & 2026",
                description:
                    "Dhammaan filimaha Hindi Af Somali cusub – daawo bilaash HD online. Astaan Films, Saafi Films, Bollywood Af Somali.",
                numberOfItems: totalCount,
                isPartOf: { "@id": "https://fanbroj.net/#website" },
                breadcrumb: { "@id": "https://fanbroj.net/hindi-af-somali#breadcrumb" },
            },
            {
                "@type": "BreadcrumbList",
                "@id": "https://fanbroj.net/hindi-af-somali#breadcrumb",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Fanproj", item: "https://fanbroj.net" },
                    { "@type": "ListItem", position: 2, name: "Hindi Af Somali", item: "https://fanbroj.net/hindi-af-somali" },
                ],
            },
            {
                "@type": "ItemList",
                name: "Filimaha Hindi Af Somali Cusub",
                numberOfItems: Math.min(movies.length, 20),
                itemListElement: (movies as any[]).slice(0, 20).map((movie, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    item: {
                        "@type": "Movie",
                        name: movie.titleSomali || movie.title,
                        url: `https://fanbroj.net/movies/${movie.slug}-af-somali`,
                        image: movie.posterUrl || undefined,
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
                        <span className="text-white/70">Hindi Af Somali</span>
                    </nav>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">
                        Filimaha{" "}
                        <span className="text-[#E50914]">Hindi Af Somali</span>{" "}
                        Cusub
                    </h1>
                    <p className="text-white/60 text-lg max-w-2xl mb-8 leading-relaxed">
                        Daawo <strong className="text-white">{totalCount || "933"}+</strong> filim Hindi ah oo loogu
                        dubbay Af Somali – bilaash HD. Fanproj waa goobta ugu weyn film Hindi Af Somali cusub
                        2025 &amp; 2026.
                    </p>

                    {/* Sub-navigation */}
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/hindi-af-somali/2025"
                            className="px-5 py-2.5 bg-[#E50914] hover:bg-[#C50812] text-white font-bold rounded-full text-sm transition-colors"
                        >
                            Cusub 2025 🔥
                        </Link>
                        <Link
                            href="/movies"
                            className="px-5 py-2.5 bg-[#1a3a5c] hover:bg-[#2a4a6c] text-white font-semibold rounded-full text-sm border border-[#2a4a6c] transition-colors"
                        >
                            Dhammaan Filimada
                        </Link>
                        <Link
                            href="/tags/astaan-films"
                            className="px-5 py-2.5 bg-[#1a3a5c] hover:bg-[#2a4a6c] text-white font-semibold rounded-full text-sm border border-[#2a4a6c] transition-colors"
                        >
                            Astaan Films
                        </Link>
                        <Link
                            href="/tags/saafi-films"
                            className="px-5 py-2.5 bg-[#1a3a5c] hover:bg-[#2a4a6c] text-white font-semibold rounded-full text-sm border border-[#2a4a6c] transition-colors"
                        >
                            Saafi Films
                        </Link>
                        <Link
                            href="/series"
                            className="px-5 py-2.5 bg-[#1a3a5c] hover:bg-[#2a4a6c] text-white font-semibold rounded-full text-sm border border-[#2a4a6c] transition-colors"
                        >
                            Musalsal Af Somali
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Recently Added 2025 ── */}
            {recentMovies.length > 0 && (
                <section className="container mx-auto px-4 py-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black">
                            <span className="text-[#E50914]">Cusub</span> – Hindi Af Somali 2025
                        </h2>
                        <Link
                            href="/hindi-af-somali/2025"
                            className="text-sm text-[#E50914] hover:underline font-semibold"
                        >
                            Dhammaanba arag →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {(recentMovies as any[]).map((movie) => (
                            <MovieCard key={String(movie._id)} movie={movie} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── All Hindi Af Somali ── */}
            <section className="container mx-auto px-4 pb-10">
                <h2 className="text-2xl font-black mb-6">
                    Dhammaan Filimaha{" "}
                    <span className="text-[#E50914]">Hindi Af Somali</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {(movies as any[]).map((movie) => (
                        <MovieCard key={String(movie._id)} movie={movie} />
                    ))}
                </div>
                {movies.length === 0 && (
                    <div className="text-center py-20">
                        <Film size={64} className="mx-auto mb-4 text-white/10" />
                        <p className="text-white/40">Filimaha waa la soo rarayo...</p>
                    </div>
                )}
                <div className="mt-10 text-center">
                    <Link
                        href="/movies"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[#E50914] hover:bg-[#C50812] text-white font-bold rounded-full transition-colors text-sm"
                    >
                        Dhammaanba {totalCount || "933"}+ Filimada Arag
                    </Link>
                </div>
            </section>

            {/* ── Partner Brands ── */}
            <section className="container mx-auto px-4 pb-10">
                <h2 className="text-xl font-bold mb-4 text-white/80">
                    Shabakadaha Hindi Af Somali – Fanproj
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Astaan Films Af Somali", href: "/tags/astaan-films" },
                        { label: "Saafi Films Af Somali", href: "/tags/saafi-films" },
                        { label: "Zee Films Af Somali", href: "/tags/zee-films" },
                        { label: "StreamNXT – Fanproj", href: "/tags/streamnxt" },
                    ].map((partner) => (
                        <Link
                            key={partner.label}
                            href={partner.href}
                            className="flex items-center justify-center p-4 bg-[#1a3a5c] hover:bg-[#2a4a6c] border border-[#2a4a6c] hover:border-[#E50914]/40 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all text-center"
                        >
                            {partner.label}
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── SEO Copy (indexable, human-readable) ── */}
            <section className="container mx-auto px-4 pb-16">
                <div className="bg-[#1a3a5c]/20 border border-[#1a3a5c] rounded-2xl p-8 max-w-4xl">
                    <h2 className="text-lg font-bold mb-4">
                        Filimaha Hindi Af Somali – Fanproj (Fanbroj.net)
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed mb-3">
                        Fanproj (Fanbroj.net) waa goobta ugu weyn ee Soomaalida lagu daawo filimaha Hindi Af Somali
                        cusub. Waxaanu haysanaa {totalCount || "933"}+ filim oo loogu dubbay Af Somali, oo ay ku
                        jiraan filimaha Astaan Films, Saafi Films, Zee Films, iyo StreamNXT. Dhammaan filimahan
                        waxaad ku daawanaysaa HD quality, bilaash ama Premium.
                    </p>
                    <p className="text-white/50 text-sm leading-relaxed mb-3">
                        Filimaha cusub ee Hindi Af Somali 2025 iyo 2026 waxaanu ku darannaa goor kasta.
                        Fanproj NXT, Fanproj Play, Fanproj TV – dhammaantood waxaad ka heli kartaa halkan
                        fanbroj.net. Waxaad sidoo kale daawanaysaa musalsalada Af Somali cusub iyo ciyaaraha
                        live tooska ah.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {[
                            "Hindi Af Somali 2025",
                            "Hindi Af Somali 2026",
                            "Filim Hindi Afsomali",
                            "Bollywood Af Somali",
                            "Fanproj NXT",
                            "Fanproj Play",
                            "Astaan Films",
                            "Saafi Films",
                        ].map((kw) => (
                            <span
                                key={kw}
                                className="px-3 py-1 bg-[#1a3a5c] border border-[#2a4a6c] rounded-full text-xs text-white/50"
                            >
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

function MovieCard({ movie }: { movie: any }) {
    const year = movie.releaseDate?.split("-")[0];
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
                        alt={`${title} Hindi Af Somali${year ? ` ${year}` : ""}`}
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
                    {year && <span className="text-[10px] text-gray-400">{year}</span>}
                </div>
            </div>
        </Link>
    );
}
