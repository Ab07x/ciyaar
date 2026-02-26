"use client";

import { useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ContinueItem {
    id: string;
    type: string;
    slug: string;
    title: string;
    posterUrl?: string;
    percent: number;
    progressSeconds: number;
    durationSeconds: number;
    isPremium?: boolean;
    href: string;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
}

export function ContinueWatching() {
    const { userId } = useUser();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data } = useSWR(
        userId ? `/api/recommendations?userId=${userId}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const items: ContinueItem[] = data?.continueWatching ?? [];
    if (!items.length) return null;

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
    };

    return (
        <section style={{ padding: "0 0 32px" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h2 style={{ fontWeight: 800, fontSize: 18, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                        <Play size={16} style={{ color: "#4ade80" }} fill="#4ade80" />
                        Continue Watching
                    </h2>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button
                            onClick={() => scroll("left")}
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Horizontal scroll row */}
                <div
                    ref={scrollRef}
                    style={{
                        display: "flex",
                        gap: 12,
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        paddingBottom: 4,
                    }}
                >
                    <style>{`.continue-watching-row::-webkit-scrollbar{display:none}`}</style>
                    {items.map(item => {
                        const remaining = item.durationSeconds - item.progressSeconds;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                style={{
                                    flex: "0 0 160px",
                                    textDecoration: "none",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    background: "#111827",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    display: "block",
                                    transition: "transform 0.15s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
                                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                            >
                                {/* Poster */}
                                <div style={{ position: "relative", height: 230, background: "#0f172a" }}>
                                    {item.posterUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.posterUrl}
                                            alt={item.title}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Play size={32} style={{ color: "#374151" }} />
                                        </div>
                                    )}
                                    {/* Play overlay */}
                                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "all 0.2s" }}
                                        className="play-overlay">
                                        <div style={{ background: "rgba(0,0,0,0.7)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Play size={20} fill="#fff" style={{ color: "#fff" }} />
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.15)" }}>
                                        <div style={{ width: `${item.percent}%`, height: "100%", background: "#ef4444" }} />
                                    </div>
                                </div>
                                {/* Info */}
                                <div style={{ padding: "8px 10px" }}>
                                    <p style={{ color: "#e5e7eb", fontSize: 12, fontWeight: 600, margin: "0 0 3px", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                                        {item.title}
                                    </p>
                                    <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>
                                        {remaining > 0 ? formatTime(remaining) : `${item.percent}% watched`}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
