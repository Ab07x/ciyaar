"use client";

import useSWR from "swr";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ShortsPlayer } from "@/components/shorts/ShortsPlayer";
import { Loader2 } from "lucide-react";

function ShortsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const startIndex = parseInt(searchParams.get("start") || "0", 10);

    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: shorts } = useSWR("/api/shorts?limit=50", fetcher);

    const handleClose = () => {
        router.back();
    };

    // Loading state
    if (shorts === undefined) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-accent-green animate-spin" />
                    <p className="text-white/70 text-sm">Loading shorts...</p>
                </div>
            </div>
        );
    }

    // Empty state
    if (shorts.length === 0) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-white text-2xl font-bold mb-2">No Shorts Available</h2>
                    <p className="text-white/60 mb-6">Check back later for new content</p>
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 bg-accent-green text-black font-bold rounded-xl hover:brightness-110 transition-all"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ShortsPlayer
            shorts={shorts}
            initialIndex={Math.min(startIndex, shorts.length - 1)}
            onClose={handleClose}
        />
    );
}

export default function ShortsPage() {
    return (
        <Suspense
            fallback={
                <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-accent-green animate-spin" />
                </div>
            }
        >
            <ShortsContent />
        </Suspense>
    );
}
