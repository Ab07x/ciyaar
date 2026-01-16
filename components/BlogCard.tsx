"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Tag, Eye } from "lucide-react";
import { getBoostedViews, formatViews } from "@/lib/analytics";

interface BlogCardProps {
    post: {
        _id: string;
        slug: string;
        title: string;
        excerpt: string;
        featuredImageUrl?: string;
        category: string;
        publishedAt?: number;
        tags: string[];
        views?: number;
    };
}

export function BlogCard({ post }: BlogCardProps) {
    const getCategoryColor = (category: string) => {
        switch (category) {
            case "News": return "bg-blue-500/20 text-blue-400";
            case "Market": return "bg-purple-500/20 text-purple-400";
            case "Match Preview": return "bg-accent-green/20 text-accent-green";
            case "Analysis": return "bg-accent-gold/20 text-accent-gold";
            default: return "bg-text-muted/20 text-text-muted";
        }
    };

    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group bg-stadium-elevated border border-border-strong rounded-2xl overflow-hidden hover:border-accent-green/50 transition-all"
        >
            {/* Image */}
            <div className="relative aspect-video bg-stadium-dark">
                {post.featuredImageUrl ? (
                    <Image
                        src={post.featuredImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        📰
                    </div>
                )}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(post.category)}`}>
                    {post.category}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <h2 className="text-xl font-bold mb-2 group-hover:text-accent-green transition-colors line-clamp-2">
                    {post.title}
                </h2>
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {post.publishedAt
                                ? new Date(post.publishedAt).toLocaleDateString("so-SO")
                                : "Draft"}
                        </div>
                        <div className="flex items-center gap-1">
                            <Eye size={14} />
                            <span>{formatViews(getBoostedViews(post._id, post.views || 0))}</span>
                        </div>
                    </div>
                    {post.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Tag size={14} />
                            {post.tags[0]}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
