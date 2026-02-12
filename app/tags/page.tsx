import type { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import { Movie } from "@/lib/models";
import Link from "next/link";
import { Tag, Film } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Dhammaan Tags – Hindi Af Somali, Fanproj, Saafi Films | Fanproj",
    description: "Browse dhammaan categories iyo tags ee filimaha Af Somali. Hindi Af Somali cusub, Fanproj NXT, Fanproj Play, Astaan Films, Saafi Films, Bollywood Af Somali iyo wax badan.",
    keywords: [
        "fanproj tags", "hindi af somali tags", "filim categories",
        "fanproj nxt", "fanproj play", "saafi films", "astaan films",
        "streamnxt", "fanbroj categories",
    ],
    openGraph: {
        title: "Browse Tags – Hindi Af Somali, Fanproj NXT, Saafi Films",
        description: "Dhammaan tags iyo categories ee filimaha Af Somali – Fanproj",
        url: "https://fanbroj.net/tags",
    },
    alternates: {
        canonical: "https://fanbroj.net/tags",
    },
};

export default async function TagsIndexPage() {
    await connectDB();

    const result = await Movie.aggregate([
        { $match: { isPublished: true, tags: { $exists: true, $ne: [] } } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    const tags = result.map((r: any) => ({
        name: r._id,
        slug: r._id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        count: r.count,
    }));

    const totalMovies = tags.reduce((sum: number, t: any) => sum + t.count, 0);

    return (
        <div className="min-h-screen bg-[#0d1b2a]">
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
                        Browse dhammaan filimaha Af Somali ee Fanproj (Fanbroj) oo loo kala qaybiyay tags. Hindi Af Somali cusub,
                        Fanproj NXT, Fanproj Play, Astaan Films Hindi Af Somali, Saafi Films, StreamNXT, Bollywood Af Somali,
                        Zee Films Af Somali, Fanproj Aflaam – dhammaantood bilaash ah HD.
                    </p>
                </div>
            </div>
        </div>
    );
}
