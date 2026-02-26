import type { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";
import Link from "next/link";
import { Tag, Film } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Filimada Af Somali - Tags & Categories | Fanbroj",
    description: "Browse dhammaan categories iyo tags ee filimaha Hindi Af Somali cusub 2026. Filim hindi afsomali, musalsal af somali, film hindi af somali, Saafi Films, Mysomali – Fanbroj (Fanproj). Daawo bilaash.",
    keywords: [
        "hindi af somali", "filim hindi afsomali", "film hindi af somali",
        "hindi af somali cusub", "hindi af somali cusub 2026",
        "musalsal af somali", "fanproj nxt", "fanbroj",
        "fanproj", "fanprojnet", "streamnxt fanproj", "fanbaroj",
        "filimada af somali", "daawo bilaash",
        "filin hindi af somali", "saafi films", "astaan films",
        "mysomali", "zee films",
    ],
    openGraph: {
        title: "Filimada Af Somali - Tags & Categories | Fanbroj",
        description: "Browse dhammaan filimaha Hindi Af Somali cusub 2026 oo loo kala qaybiyay tags – Fanbroj",
        url: "https://fanbroj.net/tags",
        siteName: "Fanbroj",
        images: ["/og-preview.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Filimada Af Somali - Tags & Categories | Fanbroj",
        description: "Browse dhammaan filimaha Hindi Af Somali cusub 2026 – Fanbroj",
        images: ["/og-preview.png"],
    },
    alternates: {
        canonical: "https://fanbroj.net/tags",
    },
};

export default async function TagsIndexPage() {
    let tags: { name: string; slug: string; count: number }[] = [];
    try {
        await connectDB();
        const result = await Movie.aggregate([
            { $match: { isPublished: true, tags: { $exists: true, $ne: [] } } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        tags = result.map((r: any) => ({
            name: r._id,
            slug: r._id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            count: r.count,
        }));
    } catch {
        // DB not available at build time
    }

    const totalMovies = tags.reduce((sum: number, t: any) => sum + t.count, 0);

    // JSON-LD: CollectionPage + BreadcrumbList + ItemList for tags index
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": "https://fanbroj.net/tags#collectionpage",
                url: "https://fanbroj.net/tags",
                name: "Dhammaan Tags – Filimaha Af Somali",
                description: `Browse ${tags.length} tags across ${totalMovies}+ filim Af Somali – Hindi Af Somali, Fanproj NXT, Saafi Films iyo wax badan.`,
                numberOfItems: tags.length,
                isPartOf: { "@id": "https://fanbroj.net/#website" },
                breadcrumb: { "@id": "https://fanbroj.net/tags#breadcrumb" },
            },
            {
                "@type": "BreadcrumbList",
                "@id": "https://fanbroj.net/tags#breadcrumb",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Fanproj", item: "https://fanbroj.net" },
                    { "@type": "ListItem", position: 2, name: "Tags", item: "https://fanbroj.net/tags" },
                ],
            },
            ...(tags.length > 0 ? [{
                "@type": "ItemList",
                name: "Filim Tags – Af Somali",
                numberOfItems: Math.min(tags.length, 30),
                itemListElement: tags.slice(0, 30).map((tag, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    item: {
                        "@type": "Thing",
                        name: tag.name,
                        url: `https://fanbroj.net/tags/${tag.slug}`,
                    },
                })),
            }] : []),
        ],
    };

    return (
        <div className="min-h-screen bg-[#0d1b2a]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Header */}
            <section className="relative py-12 border-b border-[#1a3a5c]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#E50914]/5 via-transparent to-transparent" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Tag size={28} className="text-[#E50914]" />
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                            All Tags
                        </h1>
                    </div>
                    <p className="text-white/60 text-lg">
                        {tags.length} tags across {totalMovies}+ filim – Browse Hindi Af Somali, Fanproj NXT, Saafi Films iyo wax badan
                    </p>
                </div>
            </section>

            {/* Tags Cloud */}
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-wrap gap-3">
                    {tags.map((tag: any) => {
                        const size = tag.count > 50 ? "text-lg px-5 py-2.5" :
                            tag.count > 20 ? "text-base px-4 py-2" :
                                tag.count > 5 ? "text-sm px-3 py-1.5" : "text-xs px-2.5 py-1";
                        return (
                            <Link
                                key={tag.slug}
                                href={`/tags/${tag.slug}`}
                                className={`${size} bg-[#1a3a5c] hover:bg-[#E50914] border border-[#2a4a6c] hover:border-[#E50914] rounded-full text-white/80 hover:text-white transition-all font-medium`}
                            >
                                #{tag.name}
                                <span className="ml-1.5 text-white/40">{tag.count}</span>
                            </Link>
                        );
                    })}
                </div>

                {tags.length === 0 && (
                    <div className="text-center py-16">
                        <Film size={64} className="mx-auto mb-4 text-white/10" />
                        <p className="text-white/50">Ma jiraan tags wali.</p>
                    </div>
                )}
            </div>

            {/* SEO Footer */}
            <div className="container mx-auto px-4 pb-12">
                <div className="border-t border-[#1a3a5c] pt-8">
                    <p className="text-white/30 text-xs leading-relaxed max-w-3xl">
                        Browse dhammaan filimaha Hindi Af Somali cusub 2026 ee Fanbroj (Fanproj) oo loo kala qaybiyay tags.
                        Filim hindi afsomali, film hindi af somali, filin hindi af somali, hindi af somali cusub 2026,
                        musalsal af somali, Astaan Films, Saafi Films – dhammaantood bilaash ah HD. Fanbroj waa goobta ugu weyn.
                    </p>
                </div>
            </div>
        </div>
    );
}
