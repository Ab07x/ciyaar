"use client";

import { useState, useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Loader2, Film, Tv, Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/providers/UserProvider";
import { useToast } from "@/providers/ToastProvider";
import Image from "next/image";

interface SearchResult {
    id: number;
    title: string;
    posterUrl?: string;
    year: string;
    rating: number;
}

export function RequestForm({ onRequestSubmitted }: { onRequestSubmitted: () => void }) {
    const { userId } = useUser();
    const toast = useToast();
    const searchTMDB = useAction(api.tmdb.searchTMDB);
    const submitRequest = useMutation(api.requests.submitRequest);

    const [query, setQuery] = useState("");
    const [type, setType] = useState<"movie" | "tv">("movie");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (query.length > 2) {
                setIsSearching(true);
                try {
                    const data = await searchTMDB({ query, type });
                    setResults(data);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [query, type, searchTMDB]);

    const handleRequest = async (item: SearchResult) => {
        if (!userId) {
            toast("Please login to request content", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await submitRequest({
                userId,
                tmdbId: item.id,
                type,
                title: item.title,
                posterUrl: item.posterUrl,
                year: item.year,
            });

            if (result.status === "created") {
                toast("Request submitted successfully!", "success");
            } else if (result.status === "voted") {
                toast("Already requested! Added your vote.", "success");
            } else {
                toast("You have already voted for this request.", "info");
            }

            setQuery("");
            setResults([]);
            onRequestSubmitted();
        } catch (error) {
            console.error(error);
            toast("Failed to submit request", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-stadium-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="text-accent-green" />
                Codso Filim ama Musalsal
            </h2>

            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setType("movie")}
                    className={`flex-1 py-2 rounded-lg font-bold transition-colors ${type === "movie" ? "bg-accent-green text-black" : "bg-white/5 hover:bg-white/10"}`}
                >
                    Filim
                </button>
                <button
                    onClick={() => setType("tv")}
                    className={`flex-1 py-2 rounded-lg font-bold transition-colors ${type === "tv" ? "bg-accent-green text-black" : "bg-white/5 hover:bg-white/10"}`}
                >
                    Musalsal
                </button>
            </div>

            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Raadi ${type === "movie" ? "filim" : "musalsal"}...`}
                        className="w-full bg-stadium-elevated border border-border-subtle rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-accent-green/50"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-accent-green" size={20} />
                        </div>
                    )}
                </div>

                {results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-stadium-elevated border border-border-subtle rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                        {results.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                <div className="relative w-12 h-16 bg-white/10 rounded overflow-hidden flex-shrink-0">
                                    {item.posterUrl ? (
                                        <Image src={item.posterUrl} alt={item.title} fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            {type === "movie" ? <Film size={16} /> : <Tv size={16} />}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold truncate">{item.title}</h4>
                                    <p className="text-xs text-text-muted">{item.year}</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleRequest(item)}
                                    disabled={isSubmitting}
                                >
                                    Codso
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
