"use client";

import useSWR from "swr";
import { type ComponentType, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { MovieCard } from "@/components/MovieCard";
import { SeriesCard } from "@/components/SeriesCard";
import { MatchCard } from "@/components/MatchCard";
import { BookmarkPlus, FolderHeart, Heart, ListVideo, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ListTab = "mylist" | "favourites" | "watch_later";
type MyListItem = {
    _id?: string;
    contentType?: "movie" | "series" | "match";
    details?: Record<string, unknown> | null;
};

const TAB_CONFIG: Array<{
    id: ListTab;
    label: string;
    title: string;
    empty: string;
    icon: ComponentType<{ className?: string }>;
}> = [
        {
            id: "mylist",
            label: "My List",
            title: "My List",
            empty: "Wali waxba kuma darin My List-kaaga.",
            icon: FolderHeart,
        },
        {
            id: "favourites",
            label: "Favourites",
            title: "Favourites",
            empty: "Wali maadan calaamadeyn waxyaabaha aad ugu jeceshahay.",
            icon: Heart,
        },
        {
            id: "watch_later",
            label: "Watch Later",
            title: "Watch Later",
            empty: "Wali maadan kaydsan wax aad hadhow daawato.",
            icon: BookmarkPlus,
        },
    ];

function normalizeTab(raw: string | null): ListTab {
    const value = String(raw || "").trim().toLowerCase();
    if (value === "favourites" || value === "favorites" || value === "favourite" || value === "favorite") {
        return "favourites";
    }
    if (value === "watch_later" || value === "watch-later" || value === "watchlater" || value === "later") {
        return "watch_later";
    }
    return "mylist";
}

export default function MyListPage() {
    const { userId } = useUser();
    const searchParams = useSearchParams();
    const currentTab = useMemo(() => normalizeTab(searchParams.get("tab")), [searchParams]);
    const currentConfig = TAB_CONFIG.find((tab) => tab.id === currentTab) || TAB_CONFIG[0];
    const HeaderIcon = currentConfig.icon;
    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: myList } = useSWR<MyListItem[]>(
        userId ? `/api/mylist?userId=${userId}&listType=${currentTab}` : null,
        fetcher
    );

    if (myList === undefined) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="h-8 w-48 bg-white/10 rounded mb-8 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (myList.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <FolderHeart className="w-12 h-12 text-text-muted" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{currentConfig.title}</h1>
                <p className="text-text-secondary max-w-md mb-8">
                    {currentConfig.empty}
                </p>
                <Link href="/">
                    <Button variant="primary" leftIcon={<Plus size={18} />}>
                        Raadi Wax Aad Ku Darto
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5">
                {TAB_CONFIG.map((tab) => (
                    <Link
                        key={tab.id}
                        href={`/mylist?tab=${tab.id}`}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border",
                            currentTab === tab.id
                                ? "bg-accent-green text-black border-accent-green"
                                : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {tab.label}
                    </Link>
                ))}
                <Link
                    href="/history"
                    className="ml-auto px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border border-white/10 bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white transition-colors inline-flex items-center gap-2"
                >
                    <ListVideo className="w-4 h-4" />
                    Watch History
                </Link>
            </div>

            <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                <HeaderIcon className="text-accent-gold" />
                {currentConfig.title}
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {myList.map((item) => {
                    if (!item.details || typeof item.details !== "object") return null;

                    if (item.contentType === "movie") {
                        return <MovieCard key={item._id} {...(item.details as unknown as Parameters<typeof MovieCard>[0])} />;
                    }
                    if (item.contentType === "series") {
                        return <SeriesCard key={item._id} {...(item.details as unknown as Parameters<typeof SeriesCard>[0])} />;
                    }
                    if (item.contentType === "match") {
                        return <MatchCard key={item._id} {...(item.details as unknown as Parameters<typeof MatchCard>[0])} />;
                    }
                    return null;
                })}
            </div>
        </div>
    );
}
