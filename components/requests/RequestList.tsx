"use client";

import useSWR, { mutate } from "swr";
import { useUser } from "@/providers/UserProvider";
import { useToast } from "@/providers/ToastProvider";
import { ThumbsUp, CheckCircle2, Clock, XCircle, Film, Tv } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function RequestList() {
    const { userId } = useUser();
    const toast = useToast();

    // In a real app complexity, these should probably be PAGINATED
    const { data: requests } = useSWR("/api/requests?limit=50", fetcher);
    const { data: myVotes } = useSWR(userId ? `/api/requests/votes?userId=${userId}` : null, fetcher);

    const handleVote = async (requestId: any) => {
        if (!userId) {
            toast("Please login to vote", "error");
            return;
        }

        // Optimistic check
        if (myVotes?.includes(requestId)) return;

        try {
            await fetch("/api/requests/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, userId }),
            });
            mutate("/api/requests?limit=50");
            mutate(`/api/requests/votes?userId=${userId}`);
            toast("Voted!", "success");
        } catch (error) {
            toast("Failed to vote", "error");
        }
    };

    if (requests === undefined) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-stadium-card rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-12 text-text-secondary">
                No requests yet. Be the first to request something!
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Codsigii Ugu Dambeeyay</h2>
            {requests.map((req: any) => {
                const hasVoted = myVotes?.includes(req._id);

                return (
                    <div key={req._id} className="bg-stadium-card border border-border-subtle rounded-xl p-4 flex items-center gap-4 group hover:border-white/20 transition-colors">
                        {/* Poster */}
                        <div className="relative w-16 h-24 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                            {req.posterUrl ? (
                                <Image src={req.posterUrl} alt={req.title} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-text-muted">
                                    {req.type === "movie" ? <Film size={24} /> : <Tv size={24} />}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg truncate text-white group-hover:text-accent-green transition-colors">
                                    {req.title}
                                </h3>
                                <span className="text-xs font-bold text-text-muted px-1.5 py-0.5 bg-white/10 rounded">
                                    {req.year}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                                <span className="text-text-secondary capitalize flex items-center gap-1">
                                    {req.type === "movie" ? "🎬 Filim" : "📺 Musalsal"}
                                </span>

                                {/* Status Badge */}
                                {req.status === "pending" && (
                                    <span className="flex items-center gap-1 text-yellow-500">
                                        <Clock size={12} /> Pending
                                    </span>
                                )}
                                {req.status === "approved" && (
                                    <span className="flex items-center gap-1 text-blue-400">
                                        <CheckCircle2 size={12} /> Approved
                                    </span>
                                )}
                                {req.status === "fulfilled" && (
                                    <span className="flex items-center gap-1 text-accent-green">
                                        <CheckCircle2 size={12} /> Fulfilled
                                    </span>
                                )}
                                {req.status === "rejected" && (
                                    <span className="flex items-center gap-1 text-accent-red">
                                        <XCircle size={12} /> Rejected
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Vote Button */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => handleVote(req._id)}
                                disabled={hasVoted || req.status === "fulfilled" || req.status === "rejected"}
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                    hasVoted
                                        ? "bg-accent-green text-black cursor-default"
                                        : "bg-white/5 hover:bg-white/10 text-white"
                                )}
                            >
                                <ThumbsUp size={20} fill={hasVoted ? "currentColor" : "none"} />
                            </button>
                            <span className="text-sm font-bold text-text-secondary">{req.votes}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
