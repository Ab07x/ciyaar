"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminBlogPage() {
    const { data: posts, mutate } = useSWR("/api/posts", fetcher);

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            "Wararka Kubadda Cagta": "bg-green-600",
            "Warbixino Ciyaareed": "bg-blue-600",
            "Wararka Suuqa Kala Iibsiga": "bg-orange-600",
            "Wararka Premier League": "bg-purple-600",
            "Wararka Champions League": "bg-indigo-600",
            "Wararka Horyaalka Talyaaniga": "bg-teal-600",
            "Wararka Horyaalka Spain": "bg-red-600",
        };
        return colors[category] || "bg-gray-600";
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this post?")) return;
        await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
        mutate();
    };

    const handlePublish = async (id: string) => {
        await fetch("/api/posts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isPublished: true }),
        });
        mutate();
    };

    const handleUnpublish = async (id: string) => {
        await fetch("/api/posts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isPublished: false }),
        });
        mutate();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">BLOG</h1>
                    <p className="text-text-muted">Manage blog posts and news articles</p>
                </div>
                <Link
                    href="/kism/blog/new"
                    className="px-6 py-3 bg-accent-green text-black rounded-xl font-bold flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Post
                </Link>
            </div>

            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-hover">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Title</th>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Category</th>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Status</th>
                            <th className="text-left px-4 py-3 text-sm font-bold text-text-muted">Date</th>
                            <th className="text-right px-4 py-3 text-sm font-bold text-text-muted">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts?.map((post: any) => (
                            <tr key={post._id} className="border-t border-border-subtle hover:bg-stadium-hover/50">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{post.title}</div>
                                    <div className="text-xs text-text-muted">/{post.slug}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getCategoryColor(post.category)}`}>
                                        {post.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {post.isPublished ? (
                                        <span className="text-accent-green text-sm font-bold">Published</span>
                                    ) : (
                                        <span className="text-text-muted text-sm">Draft</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-text-muted">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {post.isPublished ? (
                                            <button
                                                onClick={() => handleUnpublish(post._id)}
                                                className="p-2 hover:bg-stadium-hover rounded-lg text-text-muted hover:text-yellow-500"
                                                title="Unpublish"
                                            >
                                                <EyeOff size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePublish(post._id)}
                                                className="p-2 hover:bg-stadium-hover rounded-lg text-text-muted hover:text-accent-green"
                                                title="Publish"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        )}
                                        <Link
                                            href={`/kism/blog/${post._id}`}
                                            className="p-2 hover:bg-stadium-hover rounded-lg text-text-muted hover:text-white"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(post._id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!posts || posts.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                                    No blog posts yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
