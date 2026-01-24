"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef } from "react";
import { Upload, Trash2, Copy, FileIcon, ImageIcon, X, Loader2, Check } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/providers/ToastProvider";
import { cn } from "@/lib/utils";

export default function AdminMediaPage() {
    const listMediaApi: any = api.media?.listMedia;
    const generateUploadUrlApi: any = api.media?.generateUploadUrl;
    const saveMediaApi: any = api.media?.saveMedia;
    const deleteMediaApi: any = api.media?.deleteMedia;

    const mediaList = useQuery(listMediaApi) || [];
    const generateUploadUrl = useMutation(generateUploadUrlApi);
    const saveMedia = useMutation(saveMediaApi);
    const deleteMedia = useMutation(deleteMediaApi);

    const toast = useToast();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter state
    const [filter, setFilter] = useState<"all" | "image" | "file">("all");

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
            // Use local API for VPS storage (utilizing AWS Lightsail 80GB)
            const formData = new FormData();
            formData.append("file", file);

            const result = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!result.ok) throw new Error("Upload failed");

            const data = await result.json();

            // Save metadata to Convex (URL reference)
            await saveMedia({
                url: data.url,
                name: data.name,
                type: data.type,
                size: data.size,
            });

            toast("File uploaded to AWS storage", "success");
        } catch (error) {
            console.error(error);
            toast("Upload failed", "error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (id: any, storageId: any) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            await deleteMedia({ id, storageId });
            toast("File deleted", "success");
        } catch (error) {
            toast("Delete failed", "error");
        }
    };

    const copyToClipboard = (url: string) => {
        const fullUrl = `${window.location.origin}${url}`;
        navigator.clipboard.writeText(fullUrl);
        toast("Full URL copied to clipboard!", "success");
    };

    const filteredMedia = mediaList.filter((item: any) => {
        if (!item?.type) return false;
        if (filter === "all") return true;
        if (filter === "image") return item.type.startsWith("image/");
        return !item.type.startsWith("image/");
    });

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black mb-2">Media Library</h1>
                    <p className="text-text-secondary">Upload images and files to use across your site.</p>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "border-2 border-dashed rounded-2xl p-12 mb-10 flex flex-col items-center justify-center cursor-pointer transition-all",
                    isDragging
                        ? "border-accent-green bg-accent-green/5 scale-[1.01]"
                        : "border-border-strong bg-stadium-elevated hover:bg-stadium-hover"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="text-center animate-pulse">
                        <Loader2 size={48} className="text-accent-gold animate-spin mx-auto mb-4" />
                        <p className="font-bold">Uploading...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Upload size={32} className="text-accent-green" />
                        </div>
                        <p className="text-lg font-bold">Click to upload or drag & drop</p>
                        <p className="text-sm text-text-muted mt-2">Images, PDFs, Documents (Max 10MB)</p>
                    </>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter("all")}
                    className={cn("px-4 py-2 rounded-lg font-bold text-sm transition-all",
                        filter === "all" ? "bg-white text-black" : "bg-stadium-elevated text-text-secondary hover:text-white"
                    )}
                >
                    All Files
                </button>
                <button
                    onClick={() => setFilter("image")}
                    className={cn("px-4 py-2 rounded-lg font-bold text-sm transition-all",
                        filter === "image" ? "bg-white text-black" : "bg-stadium-elevated text-text-secondary hover:text-white"
                    )}
                >
                    Images
                </button>
                <button
                    onClick={() => setFilter("file")}
                    className={cn("px-4 py-2 rounded-lg font-bold text-sm transition-all",
                        filter === "file" ? "bg-white text-black" : "bg-stadium-elevated text-text-secondary hover:text-white"
                    )}
                >
                    Documents
                </button>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredMedia?.map((file: any) => {
                    if (!file) return null;
                    return (
                        <div key={file._id} className="group relative bg-stadium-elevated rounded-xl overflow-hidden border border-border-strong hover:border-accent-gold/50 transition-all">
                            {/* Preview */}
                            <div className="aspect-square bg-black/20 flex items-center justify-center relative">
                                {file.type.startsWith("image/") ? (
                                    <Image
                                        src={file.url}
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <FileIcon size={48} className="text-text-muted" />
                                )}

                                {/* Overlay Controls */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                    <button
                                        onClick={() => copyToClipboard(file.url)}
                                        className="bg-white text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform w-full justify-center"
                                    >
                                        <Copy size={14} /> Copy URL
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file._id, file.storageId)}
                                        className="bg-accent-red/20 text-accent-red border border-accent-red/50 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-accent-red/30 transition-colors w-full justify-center"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <p className="font-bold text-sm truncate" title={file.name}>{file.name}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-text-muted uppercase font-bold">{file.type.split("/")[1]}</span>
                                    <span className="text-[10px] text-text-muted">{(file.size / 1024).toFixed(0)} KB</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {mediaList?.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <ImageIcon size={48} className="mx-auto mb-4 text-text-muted" />
                    <p className="text-text-secondary">No media found. Upload something!</p>
                </div>
            )}
        </div>
    );
}
