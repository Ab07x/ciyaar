
"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface TrailerModalProps {
    isOpen: boolean;
    onClose: () => void;
    trailerUrl: string;
}

export function TrailerModal({ isOpen, onClose, trailerUrl }: TrailerModalProps) {
    const [videoId, setVideoId] = useState<string | null>(null);

    useEffect(() => {
        if (trailerUrl) {
            // Extract Video ID
            // Supports:
            // - https://www.youtube.com/watch?v=VIDEO_ID
            // - https://youtu.be/VIDEO_ID
            // - VIDEO_ID (if just ID is passed)
            let id = "";
            if (trailerUrl.includes("v=")) {
                id = trailerUrl.split("v=")[1]?.split("&")[0];
            } else if (trailerUrl.includes("youtu.be/")) {
                id = trailerUrl.split("youtu.be/")[1];
            } else {
                id = trailerUrl;
            }
            setVideoId(id);
        }
    }, [trailerUrl]);

    if (!isOpen || !videoId) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/10">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all duration-200 hover:scale-110"
                >
                    <X size={24} />
                </button>

                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title="Movie Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                />
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
