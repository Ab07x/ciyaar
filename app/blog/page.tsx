"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Tag, ChevronRight } from "lucide-react";
import { BlogCard } from "@/components/BlogCard";
import { AdSlot } from "@/components/AdSlot";

const categories = ["All", "News", "Market", "Match Preview", "Analysis"] as const;

export default function BlogPage() {
    const posts = useQuery(api.posts.listPosts, { isPublished: true });

    if (posts === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-black mb-4">
                    WAR<span className="text-accent-green">ARKA</span>
                </h1>
                <p className="text-text-secondary text-lg">
                    Wararka ugu dambeeyay ee ciyaaraha
                </p>
            </div>

            <AdSlot slotKey="archive_sidebar" className="mb-12" />

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className="px-4 py-2 rounded-full text-sm font-bold bg-stadium-elevated border border-border-subtle hover:border-accent-green transition-colors"
                    >
                        {cat === "All" ? "Dhammaan" : cat}
                    </button>
                ))}
            </div>

            {/* Posts Grid */}
            {posts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-bold mb-2">Wax maqaallo ah ma jiraan</h3>
                    <p className="text-text-muted">Wararka cusub ayaa soo soconaya dhowaan</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post: any) => (
                        <BlogCard key={post._id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
