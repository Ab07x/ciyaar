"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";

const categories = [
    "Wararka Kubadda Cagta",
    "Warbixino Ciyaareed",
    "Wararka Suuqa Kala Iibsiga",
    "Wararka Premier League",
    "Wararka Champions League",
    "Wararka Horyaalka Talyaaniga",
    "Wararka Horyaalka Spain"
] as const;

export default function NewBlogPostPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: categories[0] as string,
        content: "",
        excerpt: "",
        coverImage: "",
        isPublished: false,
        author: "Admin",
    });

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleTitleChange = (title: string) => {
        setFormData({
            ...formData,
            title,
            slug: generateSlug(title),
        });
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) {
            alert("Title and content are required");
            return;
        }
        setSaving(true);
        try {
            await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            router.push("/kism/blog");
        } catch (error) {
            console.error(error);
            alert("Failed to create post");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/kism/blog" className="p-2 bg-stadium-elevated rounded-lg hover:bg-stadium-hover">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-black">NEW POST</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? "Saving..." : "Publish"}
                </button>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Post title..."
                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 text-lg"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Slug</label>
                    <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2">Author</label>
                        <input
                            type="text"
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Cover Image URL</label>
                    <input
                        type="text"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Excerpt</label>
                    <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Short description..."
                        rows={2}
                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Content (Markdown)</label>
                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Write your post content in markdown..."
                        rows={15}
                        className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="w-5 h-5 rounded"
                    />
                    <label className="font-semibold">Publish immediately</label>
                </div>
            </div>
        </div>
    );
}
