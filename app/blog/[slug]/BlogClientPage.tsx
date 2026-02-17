"use client";

import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Tag, ChevronLeft } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { ViewCounter } from "@/components/ViewCounter";
import { SocialShare } from "@/components/SocialShare";
import { MatchLinks } from "@/components/MatchLinks";

interface BlogClientPageProps {
    slug: string;
}

export default function BlogClientPage({ slug }: BlogClientPageProps) {
    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: post } = useSWR(`/api/posts/${slug}`, fetcher);

    if (post === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    if (post === null) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-black mb-4">Maqaalkan lama helin</h1>
                <p className="text-text-secondary mb-8">
                    Fadlan hubi URL-ka aad soo raacday
                </p>
                <Link
                    href="/blog"
                    className="bg-accent-green text-black px-6 py-3 rounded-lg font-bold"
                >
                    Ku laabo Wararka
                </Link>
            </div>
        );
    }

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
        <article className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back Link */}
            <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-8 transition-colors"
            >
                <ChevronLeft size={18} />
                Ku laabo Wararka
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${getCategoryColor(post.category)}`}>
                    {post.category}
                </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                {post.title}
            </h1>

            <div className="mb-6">
                <ViewCounter id={post._id} collection="posts" initialViews={post.views} />
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-text-muted text-sm mb-8">
                <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("so-SO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })
                        : "Draft"}
                </div>
                {post.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Tag size={16} />
                        {post.tags.join(", ")}
                    </div>
                )}
                <SocialShare title={post.title} url={`/blog/${post.slug}`} className="ml-auto" />
            </div>

            {/* Featured Image */}
            {post.featuredImageUrl && (
                <div className="relative aspect-video mb-8 rounded-2xl overflow-hidden">
                    <Image
                        src={post.featuredImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            )}

            {/* Ad Slot - Top */}
            <AdSlot slotKey="blog_in_content_1" className="mb-8" />

            {/* Excerpt */}
            <p className="text-xl text-text-secondary mb-8 border-l-4 border-accent-green pl-6 italic">
                {post.excerpt}
            </p>

            {/* Content */}
            <div className="prose prose-invert prose-lg max-w-none">
                {(post.content as string).split("\n\n").map((paragraph: string, i: number) => {
                    if (paragraph.startsWith("## ")) {
                        return (
                            <h2 key={i} className="text-2xl font-bold mt-8 mb-4">
                                {paragraph.replace("## ", "")}
                            </h2>
                        );
                    }
                    if (paragraph.startsWith("### ")) {
                        return (
                            <h3 key={i} className="text-xl font-bold mt-6 mb-3">
                                {paragraph.replace("### ", "")}
                            </h3>
                        );
                    }
                    return (
                        <p key={i} className="text-text-secondary mb-4 leading-relaxed">
                            {paragraph}
                        </p>
                    );
                })}
            </div>

            {/* Ad Slot - Bottom */}
            <AdSlot slotKey="blog_in_content_2" className="mt-8" />

            {/* Tags */}
            {post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border-subtle">
                    <h4 className="text-sm font-bold text-text-muted uppercase mb-4">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag: string, i: number) => (
                            <span
                                key={i}
                                className="px-3 py-1 bg-stadium-elevated border border-border-subtle rounded-full text-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Internal Linking: Related Matches */}
            <div className="mt-12 pt-8 border-t border-border-strong">
                <h3 className="text-xl font-black mb-6 uppercase">Ciyaaraha Maanta ee Live ka ah</h3>
                <MatchLinks limit={3} />
            </div>

            {/* Back to Blog */}
            <div className="mt-12 text-center text-sm">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-accent-green hover:underline"
                >
                    <ChevronLeft size={18} />
                    Wararka kale
                </Link>
            </div>
        </article>
    );
}
