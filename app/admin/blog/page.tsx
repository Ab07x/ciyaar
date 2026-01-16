"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

export default function AdminBlogPage() {
    const posts = useQuery(api.posts.listPosts, {});
    const deletePost = useMutation(api.posts.deletePost);
    const publishPost = useMutation(api.posts.publishPost);
    const unpublishPost = useMutation(api.posts.unpublishPost);

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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">BLOG</h1>
                    <p className="text-text-muted">Maamul wararka iyo maqaallada</p>
                </div>
                <Link
                    href="/admin/blog/new"
                    className="px-4 py-2 bg-accent-green text-black rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} />
                    Maqaal Cusub
                </Link>
            </div>

            {/* Posts Table */}
            <div className="bg-stadium-elevated border border-border-strong rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stadium-dark border-b border-border-strong">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Title</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Category</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Views</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Date</th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts?.map((post) => (
                            <tr key={post._id} className="border-b border-border-subtle last:border-0">
                                <td className="px-4 py-3">
                                    <div className="font-bold">{post.title}</div>
                                    <div className="text-xs text-text-muted">/blog/{post.slug}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getCategoryColor(post.category)}`}>
                                        {post.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-accent-green">
                                    {post.views || 0}
                                </td>
                                <td className="px-4 py-3">
                                    {post.isPublished ? (
                                        <span className="text-accent-green text-sm">Published</span>
                                    ) : (
                                        <span className="text-text-muted text-sm">Draft</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-text-muted text-sm">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => post.isPublished ? unpublishPost({ id: post._id }) : publishPost({ id: post._id })}
                                            className="p-2 hover:bg-stadium-hover rounded-lg"
                                            title={post.isPublished ? "Unpublish" : "Publish"}
                                        >
                                            {post.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <Link
                                            href={`/admin/blog/${post._id}`}
                                            className="p-2 hover:bg-stadium-hover rounded-lg"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => deletePost({ id: post._id })}
                                            className="p-2 hover:bg-stadium-hover rounded-lg text-accent-red"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {posts?.length === 0 && (
                    <div className="p-12 text-center text-text-muted">
                        Wax maqaallo ah ma jiraan. Abuur mid cusub!
                    </div>
                )}
            </div>
        </div>
    );
}
