"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

const categories = [
    "Wararka Kubadda Cagta",
    "Warbixino Ciyaareed",
    "Wararka Suuqa Kala Iibsiga",
    "Wararka Premier League",
    "Wararka Champions League",
    "Wararka Horyaalka Talyaaniga",
    "Wararka Horyaalka Spain"
] as const;

interface EditBlogPostPageProps {
    params: Promise<{ id: string }>;
}

export default function EditBlogPostPage({ params }: EditBlogPostPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const post = useQuery(api.posts.getPostById, { id: id as Id<"posts"> });
    const updatePost = useMutation(api.posts.updatePost);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        featuredImageUrl: "",
        category: "News" as typeof categories[number],
        tags: "",
        isPublished: false,
        seoTitle: "",
        seoDescription: "",
    });

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                featuredImageUrl: post.featuredImageUrl || "",
                category: post.category,
                tags: post.tags.join(", "),
                isPublished: post.isPublished,
                seoTitle: post.seoTitle || "",
                seoDescription: post.seoDescription || "",
            });
        }
    }, [post]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await updatePost({
            id: id as Id<"posts">,
            ...formData,
            tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        });

        router.push("/admin/blog");
    };

    if (post === undefined) {
        return <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green mx-auto mt-20"></div>;
    }

    return (
        <div className="max-w-4xl space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blog" className="p-2 bg-stadium-elevated rounded-lg">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-black">EDIT POST</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                >
                    <Save size={20} />
                    Update
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-text-muted uppercase text-sm tracking-wider mb-4">Content</h3>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Title (H1)</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">URL Slug</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            required
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Excerpt</label>
                        <textarea
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            required
                            rows={2}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Content (Markdown)</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                            rows={15}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm resize-none"
                        />
                    </div>
                </div>

                {/* Meta */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-text-muted uppercase text-sm tracking-wider mb-4">Meta</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-text-secondary mb-2">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Featured Image URL</label>
                        <input
                            type="text"
                            value={formData.featuredImageUrl}
                            onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <input
                            type="checkbox"
                            id="published"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                            className="w-5 h-5"
                        />
                        <label htmlFor="published" className="text-sm">Published</label>
                    </div>
                </div>

                {/* SEO */}
                <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-text-muted uppercase text-sm tracking-wider mb-4">SEO</h3>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">SEO Title</label>
                        <input
                            type="text"
                            value={formData.seoTitle}
                            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-text-secondary mb-2">SEO Description</label>
                        <textarea
                            value={formData.seoDescription}
                            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                            rows={2}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 resize-none"
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}
