"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useUser } from "@/providers/UserProvider";

export function ContinueWatchingRow() {
    const { userId } = useUser();
    const items = useQuery(api.watch.getContinueWatching, userId ? { userId } : "skip");
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!items || items.length === 0) return null;

    return (
        <section className="py-8 animate-in fade-in duration-500">
            <div className="container mx-auto px-4 mb-4 flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-accent-gold rounded-full"></span>
                    RELEASED — CONTINUE WATCHING
                </h2>
            </div>

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 px-4 pb-4 items-stretch scrollbar-hide snap-x"
                style={{ scrollPaddingLeft: "1rem" }}
            >
                {items.map((item) => {
                    if (!item.details) return null;
                    const details = item.details as any; // Type inference helper

                    // Determine image
                    const image = details.backgroundUrl || details.backdropUrl || details.posterUrl || details.thumbnailUrl;
                    const title = details.title || details.name;
                    const progressPercent = Math.min(100, Math.max(0, (item.progressSeconds / item.durationSeconds) * 100));

                    // Determine link
                    let href = "#";
                    if (item.contentType === "movie") href = `/movies/${item.contentId}`;
                    if (item.contentType === "match") href = `/match/${item.contentId}`;
                    if (item.contentType === "episode") href = `/series/${item.seriesId}`; // Or deep link to episode if structured

                    return (
                        <Link
                            key={item._id}
                            href={href}
                            className="relative flex-none w-[200px] md:w-[280px] aspect-video bg-stadium-elevated rounded-xl overflow-hidden group border border-border-subtle hover:border-accent-gold/50 transition-all snap-start"
                        >
                            {/* Background Image */}
                            <img
                                src={image || "/placeholder.jpg"}
                                alt={title}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                            />

                            {/* Overlay Play Icon */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <div className="w-12 h-12 rounded-full bg-accent-gold text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                                <p className="text-white font-bold text-sm truncate mb-2">{title}</p>

                                {/* Progress Bar */}
                                <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-gold rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    );
}
