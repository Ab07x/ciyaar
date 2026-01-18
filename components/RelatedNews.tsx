"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Newspaper } from "lucide-react";

export function RelatedNews({ limit = 3 }: { limit?: number }) {
    const posts = useQuery(api.posts.listPosts, { isPublished: true, limit });

    if (!posts || posts.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {posts.map((post) => (
                <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="flex flex-col p-4 bg-stadium-elevated border border-border-strong rounded-xl hover:border-accent-green transition-all group"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Newspaper size={14} className="text-accent-green" />
                        <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                            {post.category}
                        </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-accent-green transition-colors line-clamp-2 leading-snug">
                        {post.title}
                    </h4>
                </Link>
            ))}
        </div>
    );
}
