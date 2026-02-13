import type { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";
import Link from "next/link";
import { Film, ChevronLeft, Tag } from "lucide-react";
import { optimizeImageUrl } from "@/components/MoviePosterImage";

export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true;

interface PageProps {
    params: Promise<{ tag: string }>;
}

// Convert URL slug back to tag name
function tagFromSlug(slug: string): string {
    return decodeURIComponent(slug).replace(/-/g, " ");
}

// SEO Metadata for each tag page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { tag: tagSlug } = await params;
    const tagName = tagFromSlug(tagSlug);
    const displayTag = tagName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const title = `${displayTag} – Daawo Filimaan Af Somali | Fanproj`;
    const description = `Daawo dhammaan filimaha ${displayTag} oo Af Somali ah bilaash HD. ${displayTag} cusub 2025 & 2026 – Fanproj (Fanbroj). Hindi Af Somali, Fanproj NXT, Fanproj Play.`;

    return {
        title,
        description,
        keywords: [
            tagName, `${tagName} af somali`, `${tagName} 2025`, `${tagName} 2026`,
            "fanproj", "fanbroj", "hindi af somali", "daawo online",
        ],
        openGraph: {
            title,
            description,
            url: `https://fanbroj.net/tags/${tagSlug}`,
            siteName: "Fanproj – Fanbroj.net",
            images: ["/og-image.jpg"],
        },
        alternates: {
            canonical: `https://fanbroj.net/tags/${tagSlug}`,
        },
    };
}

// Pre-generate top tags for faster indexing
export async function generateStaticParams() {
    try {
        await connectDB();
        const result = await Movie.aggregate([
            { $match: { isPublished: true, tags: { $exists: true, $ne: [] } } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 100 },
        ]);
        return result.map((r: any) => ({
            tag: r._id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        }));
    } catch {
        return [];
    }
}

export default async function TagPage({ params }: PageProps) {
    const { tag: tagSlug } = await params;
    const tagName = tagFromSlug(tagSlug);

    let movies: any[] = [];
    try {
        await connectDB();
        movies = await Movie.find({
            isPublished: true,
            tags: { $regex: new RegExp(`^${tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        })
            .select("title titleSomali slug posterUrl releaseDate rating genres isDubbed isPremium views tags")
            .sort({ views: -1, createdAt: -1 })
            .lean();
    } catch {
        // DB not available at build time
    }

    const displayTag = tagName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    // Get related tags from these movies
    const relatedTagsMap: Record<string, number> = {};
    for (const movie of movies as any[]) {
        for (const t of movie.tags || []) {
            const normalized = t.toLowerCase();
            if (normalized !== tagName.toLowerCase()) {
                relatedTagsMap[normalized] = (relatedTagsMap[normalized] || 0) + 1;
            }
        }
    }
    const relatedTags = Object.entries(relatedTagsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([t, count]) => ({
            name: t,
            slug: t.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            count,
        }));

    // JSON-LD for tag page
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${displayTag} - Filimaan Af Somali`,
        description: `Dhammaan filimaha ${displayTag} oo Af Somali ah`,
        url: `https://fanbroj.net/tags/${tagSlug}`,
        numberOfItems: movies.length,
        isPartOf: { "@id": "https://fanbroj.net/#website" },
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
                    <Link href="/movies" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors">
                        <ChevronLeft size={18} />
                        <span className="text-sm">All Movies</span>
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Tag size={24} className="text-[#E50914]" />
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                            #{displayTag}
                        </h1>
                    </div>
                    <p className="text-white/60 text-lg">
                        {movies.length} filim oo {displayTag} ah – Daawo bilaash Af Somali
                    </p>
                </div>
            </section>

            {/* Related Tags - Internal Linking (SEO gold) */}
            {relatedTags.length > 0 && (
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-wrap gap-2">
                        {relatedTags.map((rt) => (
                            <Link
                                key={rt.slug}
                                href={`/tags/${rt.slug}`}
                                className="px-3 py-1.5 bg-[#1a3a5c] hover:bg-[#2a4a6c] border border-[#2a4a6c] rounded-full text-sm text-white/70 hover:text-white transition-colors"
                            >
                                #{rt.name} <span className="text-white/40">({rt.count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Movies Grid */}
            <div className="container mx-auto px-4 pb-16">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
                    {(movies as any[]).map((movie) => (
                        <Link
                            key={movie._id}
                            href={`/movies/${movie.slug}-af-somali`}
                            className="group block relative rounded-lg overflow-hidden bg-[#1a3a5c] border border-[#2a4a6c] hover:border-[#E50914]/50 transition-all"
                        >
                            <div className="relative aspect-[2/3]">
                                {movie.posterUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={optimizeImageUrl(movie.posterUrl, "poster") || movie.posterUrl}
                                        alt={`${movie.titleSomali || movie.title} Af Somali`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#1a3a5c] flex items-center justify-center">
                                        <Film size={32} className="text-white/20" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                {movie.isDubbed && (
                                    <div className="absolute top-2 left-2 bg-[#9AE600] px-1.5 py-0.5 rounded text-[10px] font-bold text-black">
                                        AF-SOMALI
                                    </div>
                                )}

                                {movie.rating && movie.rating > 0 && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#1a3a5c]/90 px-1.5 py-0.5 rounded text-[10px] text-white font-bold">
                                        ★ {movie.rating.toFixed(1)}
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                    <h3 className="font-bold text-xs text-white line-clamp-2">
                                        {movie.titleSomali || movie.title}
                                    </h3>
                                    <span className="text-[10px] text-gray-400">
                                        {movie.releaseDate?.split("-")[0]}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {movies.length === 0 && (
                    <div className="text-center py-16">
                        <Film size={64} className="mx-auto mb-4 text-white/10" />
                        <p className="text-white/50">Ma jiraan filimo leh tag-kan.</p>
                    </div>
                )}
            </div>

            {/* SEO Footer Text */}
            <div className="container mx-auto px-4 pb-12">
                <div className="border-t border-[#1a3a5c] pt-8">
                    <p className="text-white/30 text-xs leading-relaxed max-w-3xl">
                        Daawo dhammaan filimaha {displayTag} oo Af Somali ah bilaash. {displayTag} cusub 2025 iyo 2026
                        oo lagu daawo karo Fanproj (Fanbroj). Hindi Af Somali, Fanproj NXT, Fanproj Play, Astaan Films,
                        Saafi Films – dhammaantood halkan ku daawo HD quality.
                    </p>
                </div>
            </div>
        </div>
    );
}
