"use client";

import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { useEffect, useRef, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AdSlotProps {
    slotKey: string;
    className?: string;
}

export function AdSlot({ slotKey, className = "" }: AdSlotProps) {
    const { isPremium, userId } = useUser();
    const { data: ad } = useSWR(`/api/ads?slotKey=${slotKey}`, fetcher);
    const { data: settings } = useSWR("/api/settings", fetcher);
    const { data: hasActivePPV } = useSWR(
        userId ? `/api/data?type=ppv-active&userId=${userId}` : null,
        fetcher
    );

    // Don't show ads to premium users
    if (isPremium) return null;

    // Don't show ads to users with active PPV access (they watched ads to unlock)
    if (hasActivePPV) return null;

    // Don't show if ads disabled globally
    if (settings && !settings.adsEnabled) return null;

    // Don't show if ad not found or disabled
    if (!ad || !ad.enabled) return null;

    // ─── Custom HTML ───
    if (ad.network === "custom" && ad.codeHtml) {
        return (
            <div
                className={`ad-slot ${className}`}
                dangerouslySetInnerHTML={{ __html: ad.codeHtml }}
            />
        );
    }

    // ─── AdSense ───
    if (ad.network === "adsense" && ad.adsenseClient && ad.adsenseSlot) {
        return (
            <div className={`ad-slot ${className}`}>
                <ins
                    className="adsbygoogle"
                    style={{ display: "block" }}
                    data-ad-client={ad.adsenseClient}
                    data-ad-slot={ad.adsenseSlot}
                    data-ad-format={ad.format === "responsive" ? "auto" : "rectangle"}
                    data-full-width-responsive="true"
                />
            </div>
        );
    }

    // ─── Adsterra ───
    if (ad.network === "adsterra" && ad.adsterraKey) {
        return (
            <AdsterraSlot
                atKey={ad.adsterraKey}
                domain={ad.adsterraDomain}
                className={className}
            />
        );
    }

    // ─── Monetag ───
    if (ad.network === "monetag" && ad.monetagId) {
        return (
            <MonetagSlot monetagId={ad.monetagId} className={className} />
        );
    }

    // ─── Monetag OnClick (Popunder) ───
    if (ad.network === "monetag_onclick" && ad.monetagId) {
        return <MonetagOnClickSlot monetagId={ad.monetagId} />;
    }

    // ─── Monetag Direct Link ───
    if (ad.network === "monetag_direct" && ad.monetagDirectUrl) {
        return (
            <MonetagDirectSlot
                url={ad.monetagDirectUrl}
                text={ad.monetagDirectText}
                className={className}
            />
        );
    }

    // ─── Monetag In-Page Push ───
    if (ad.network === "monetag_inpage" && ad.monetagId) {
        return (
            <MonetagInPageSlot monetagId={ad.monetagId} className={className} />
        );
    }

    // ─── VAST Video Ad ───
    if (ad.network === "vast" && ad.vastUrl) {
        return (
            <div className={`ad-slot ${className}`}>
                <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
                    <video
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        onEnded={(e) => (e.currentTarget.style.display = "none")}
                    >
                        <source src={ad.vastUrl} type="video/mp4" />
                    </video>
                </div>
            </div>
        );
    }

    // ─── Direct Video Ad ───
    if (ad.network === "video" && ad.videoUrl) {
        return (
            <VideoAdSlot
                videoUrl={ad.videoUrl}
                skipAfter={ad.videoSkipAfter}
                className={className}
            />
        );
    }

    // ─── Popup Ad ───
    if (ad.network === "popup" && ad.popupUrl) {
        return (
            <PopupAdSlot
                popupUrl={ad.popupUrl}
                width={ad.popupWidth}
                height={ad.popupHeight}
                className={className}
            />
        );
    }

    // Placeholder for unconfigured slots
    return (
        <div className={`ad-slot bg-stadium-elevated border-2 border-dashed border-border-strong rounded-xl p-8 text-center ${className}`}>
            <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">
                Xayeysiis
            </span>
        </div>
    );
}

// ─── Adsterra Sub-Component ───
function AdsterraSlot({ atKey, domain, className }: { atKey: string; domain?: string; className: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !atKey) return;
        const script = document.createElement("script");
        script.src = `https://${domain || "www.highperformanceformat.com"}/${atKey}/invoke.js`;
        script.async = true;
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                const scripts = containerRef.current.querySelectorAll("script");
                scripts.forEach((s) => s.remove());
            }
        };
    }, [atKey, domain]);

    return (
        <div className={`ad-slot ${className}`} ref={containerRef}>
            <div id={atKey} />
        </div>
    );
}

// ─── Monetag Sub-Component ───
function MonetagSlot({ monetagId, className }: { monetagId: string; className: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !monetagId) return;
        const script = document.createElement("script");
        script.src = `https://alwingulla.com/88/tag.min.js`;
        script.dataset.zone = monetagId;
        script.async = true;
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                const scripts = containerRef.current.querySelectorAll("script");
                scripts.forEach((s) => s.remove());
            }
        };
    }, [monetagId]);

    return <div className={`ad-slot ${className}`} ref={containerRef} />;
}

// ─── Monetag OnClick (Popunder) Sub-Component ───
function MonetagOnClickSlot({ monetagId }: { monetagId: string }) {
    useEffect(() => {
        if (!monetagId) return;
        const script = document.createElement("script");
        script.src = "https://alwingulla.com/88/tag.min.js";
        script.dataset.zone = monetagId;
        script.async = true;
        document.body.appendChild(script);

        return () => {
            script.remove();
        };
    }, [monetagId]);

    return null;
}

// ─── Monetag Direct Link Sub-Component ───
function MonetagDirectSlot({ url, text, className }: { url: string; text?: string; className: string }) {
    return (
        <div className={`ad-slot ${className}`}>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: "block",
                    position: "relative",
                    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
                    border: "1px solid #E50914",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    textDecoration: "none",
                    boxShadow: "0 4px 24px rgba(229, 9, 20, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                    overflow: "hidden",
                }}
            >
                {/* Ad badge */}
                <span
                    style={{
                        position: "absolute",
                        top: "8px",
                        right: "10px",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "#888",
                        textTransform: "uppercase",
                        background: "rgba(255,255,255,0.08)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                    }}
                >
                    Ad
                </span>
                {/* CTA text */}
                <span
                    style={{
                        display: "block",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        background: "linear-gradient(90deg, #FFD700, #E50914, #FFD700)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                >
                    {text || "Watch Now"}
                </span>
            </a>
        </div>
    );
}

// ─── Monetag In-Page Push Sub-Component ───
function MonetagInPageSlot({ monetagId, className }: { monetagId: string; className: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !monetagId) return;
        const script = document.createElement("script");
        script.src = "https://alwingulla.com/88/tag.min.js";
        script.dataset.zone = monetagId;
        script.async = true;
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                const scripts = containerRef.current.querySelectorAll("script");
                scripts.forEach((s) => s.remove());
            }
        };
    }, [monetagId]);

    return <div className={`ad-slot ${className}`} ref={containerRef} />;
}

// ─── Video Ad Sub-Component ───
function VideoAdSlot({ videoUrl, skipAfter, className }: { videoUrl: string; skipAfter?: number; className: string }) {
    const [canSkip, setCanSkip] = useState(false);
    const [hidden, setHidden] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (skipAfter && skipAfter > 0) {
            timerRef.current = setTimeout(() => setCanSkip(true), skipAfter * 1000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [skipAfter]);

    if (hidden) return null;

    return (
        <div className={`ad-slot ${className} relative`}>
            <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
                <video
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    onEnded={() => setHidden(true)}
                >
                    <source src={videoUrl} type="video/mp4" />
                </video>
                {canSkip && (
                    <button
                        onClick={() => setHidden(true)}
                        className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 text-black font-bold text-sm rounded-lg hover:bg-white transition-colors"
                    >
                        Skip Ad →
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Popup Ad Sub-Component ───
function PopupAdSlot({ popupUrl, width, height, className }: { popupUrl: string; width?: number; height?: number; className: string }) {
    const [opened, setOpened] = useState(false);

    const handleClick = () => {
        if (!opened) {
            window.open(popupUrl, "_blank", `width=${width || 800},height=${height || 600}`);
            setOpened(true);
        }
    };

    return (
        <div
            className={`ad-slot ${className} cursor-pointer`}
            onClick={handleClick}
        >
            <div className="bg-gradient-to-r from-accent-green/10 to-accent-gold/10 border border-accent-green/30 rounded-xl p-4 text-center">
                <span className="text-sm font-bold text-accent-green">Sponsored Content</span>
            </div>
        </div>
    );
}
