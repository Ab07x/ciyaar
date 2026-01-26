"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StreamPlayer } from "@/components/StreamPlayer";

function EmbedContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get("url");
    const poster = searchParams.get("poster") || "/bgcdn.webp";

    if (!url) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <p>Missing stream URL</p>
            </div>
        );
    }

    // Auto-fix HTTP to HTTPS if needed to prevent Mixed Content errors
    const secureUrl = url.startsWith("http://") ? url.replace("http://", "https://") : url;

    return (
        <div className="fixed inset-0 bg-black">
            <StreamPlayer
                source={{
                    url: secureUrl,
                    type: "m3u8"
                }}
                poster={poster}
                className="w-full h-full rounded-none"
            />
        </div>
    );
}

export default function LiveEmbedPage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen w-full animate-pulse" />}>
            <EmbedContent />
        </Suspense>
    );
}
