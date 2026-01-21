"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MatchCard } from "@/components/MatchCard";
import { MovieCard } from "@/components/MovieCard";
import { SeriesCard } from "@/components/SeriesCard";
import { List } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

export default function MyListPage() {
    const { userId } = useUser();
    const myList = useQuery(api.mylist.getMyList, userId ? { userId } : "skip");

    if (myList === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-accent-green/20 rounded-xl flex items-center justify-center text-accent-green">
                    <List size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-black">Liiskeyga</h1>
                    <p className="text-text-muted">Filimada, musalsalada iyo ciyaaraha aan keydsaday</p>
                </div>
            </div>

            {myList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {myList.map((item) => {
                        const { contentType, details } = item;
                        if (!details) return null;

                        if (contentType === "match") {
                            return <MatchCard key={item._id} {...details} />;
                        }
                        if (contentType === "movie") {
                            return (
                                <MovieCard
                                    key={item._id}
                                    id={details._id}
                                    slug={details.slug}
                                    title={details.titleSomali || details.title}
                                    posterUrl={details.posterUrl}
                                    year={details.releaseDate?.split("-")[0] || ""}
                                    rating={details.rating}
                                    isPremium={details.isPremium}
                                />
                            );
                        }
                        if (contentType === "series") {
                            return (
                                <SeriesCard
                                    key={item._id}
                                    id={details._id}
                                    slug={details.slug}
                                    title={details.titleSomali || details.title}
                                    posterUrl={details.posterUrl}
                                    seasons={details.numberOfSeasons}
                                    episodes={details.numberOfEpisodes}
                                    year={details.firstAirDate?.split("-")[0] || ""}
                                    isPremium={details.isPremium}
                                />
                            );
                        }
                        return null;
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-stadium-elevated border border-border-strong rounded-2xl">
                    <List size={48} className="text-text-muted mb-4 opacity-20" />
                    <h2 className="text-xl font-bold mb-2">Liiskaagu wuu maranyahay</h2>
                    <p className="text-text-secondary text-center max-w-sm mb-6">
                        Ku dar filimada iyo musalsalada aad jeceshahay si aad hadhow u daawato.
                    </p>
                </div>
            )}
        </div>
    );
}
