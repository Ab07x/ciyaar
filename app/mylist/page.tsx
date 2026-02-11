"use client";

import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { MovieCard } from "@/components/MovieCard";
import { SeriesCard } from "@/components/SeriesCard";
import { MatchCard } from "@/components/MatchCard";
import { FolderHeart, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function MyListPage() {
    const { userId } = useUser();
    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: myList } = useSWR(userId ? `/api/mylist?userId=${userId}` : null, fetcher);

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
                <h1 className="text-3xl font-bold mb-2">Liiskaagu Waa Banaan Yahay</h1>
                <p className="text-text-secondary max-w-md mb-8">
                    Kudar filimada, musalsalada, iyo ciyaaraha aad rabto inaad daawato hadhow.
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
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                <FolderHeart className="text-accent-gold" />
                My List
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {myList.map((item: any) => {
                    if (!item.details) return null;

                    if (item.contentType === "movie") {
                        return <MovieCard key={item._id} {...(item.details as any)} />;
                    }
                    if (item.contentType === "series") {
                        return <SeriesCard key={item._id} {...(item.details as any)} />;
                    }
                    if (item.contentType === "match") {
                        return <MatchCard key={item._id} {...(item.details as any)} />;
                    }
                    return null;
                })}
            </div>
        </div>
    );
}
