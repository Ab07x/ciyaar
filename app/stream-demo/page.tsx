"use client";

import { useState } from "react";
import { StreamPlayer, encodeStreamUrl } from "@/components/StreamPlayer";
import { cn } from "@/lib/utils";
import { Radio, Play, Copy, Check } from "lucide-react";

// Test m3u8 streams from user
const testStreams = [
    {
        label: "Big Buck Bunny (Recommended)",
        url: "https://live-hls-abr-cdn.livepush.io/live/bigbuckbunnyclip/index.m3u8",
        type: "m3u8" as const,
        isLive: true,
    },
    {
        label: "Live Akamai Stream",
        url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
        type: "m3u8" as const,
        isLive: true,
    },
    {
        label: "Tears of Steel",
        url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        type: "m3u8" as const,
        isLive: false,
    },
    {
        label: "Apple FMP4 Demo",
        url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
        type: "m3u8" as const,
        isLive: false,
    },
    {
        label: "Live Akamai #2",
        url: "https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8",
        type: "m3u8" as const,
        isLive: true,
    },
];

export default function StreamDemoPage() {
    const [activeStreamIndex, setActiveStreamIndex] = useState(0);
    const [customUrl, setCustomUrl] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [copied, setCopied] = useState(false);

    const activeStream = testStreams[activeStreamIndex];
    const currentUrl = useCustom && customUrl ? customUrl : activeStream.url;

    const handleCopyProtected = () => {
        const encoded = encodeStreamUrl(currentUrl);
        navigator.clipboard.writeText(encoded);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-stadium-dark">
            {/* Header */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-accent-green/20 text-accent-green rounded-xl flex items-center justify-center">
                        <Radio size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">Stream Player Demo</h1>
                        <p className="text-text-muted text-sm">Test HLS.js m3u8 streaming with quality selection</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Player */}
                    <div className="lg:col-span-2">
                        <div className="bg-stadium-elevated rounded-2xl overflow-hidden border border-border-strong p-4">
                            <StreamPlayer
                                source={{
                                    url: currentUrl,
                                    type: "m3u8",
                                    isProtected: false,
                                }}
                                className="rounded-xl"
                            />
                        </div>

                        {/* Stream Info */}
                        <div className="mt-4 bg-stadium-elevated rounded-xl border border-border-strong p-4">
                            <div className="flex items-center gap-2 mb-2">
                                {(useCustom ? false : activeStream.isLive) && (
                                    <span className="flex items-center gap-1.5 bg-accent-red px-2 py-1 rounded-full text-xs font-bold">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        LIVE
                                    </span>
                                )}
                                <span className="px-2 py-1 bg-accent-green/20 text-accent-green rounded-full text-xs font-bold">
                                    HLS.js
                                </span>
                            </div>
                            <h2 className="text-lg font-bold">{useCustom ? "Custom URL" : activeStream.label}</h2>
                            <p className="text-text-muted text-sm font-mono truncate mt-1">{currentUrl}</p>

                            {/* Protected URL Generator */}
                            <div className="mt-4 pt-4 border-t border-border-subtle">
                                <label className="text-xs text-text-muted uppercase font-bold block mb-2">
                                    Protected URL (Base64 encoded)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={encodeStreamUrl(currentUrl)}
                                        readOnly
                                        className="flex-1 bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm font-mono text-text-muted"
                                    />
                                    <button
                                        onClick={handleCopyProtected}
                                        className="px-4 py-2 bg-accent-green text-black rounded-lg font-semibold flex items-center gap-2"
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Stream List */}
                    <div className="lg:col-span-1">
                        <div className="bg-stadium-elevated rounded-2xl border border-border-strong p-4">
                            <h3 className="font-bold mb-4">Test Streams</h3>

                            <div className="space-y-2 mb-6">
                                {testStreams.map((stream, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setActiveStreamIndex(index);
                                            setUseCustom(false);
                                        }}
                                        className={cn(
                                            "w-full text-left p-3 rounded-xl transition-all flex items-center gap-3",
                                            activeStreamIndex === index && !useCustom
                                                ? "bg-accent-green/20 border border-accent-green"
                                                : "bg-stadium-hover hover:bg-stadium-dark border border-transparent"
                                        )}
                                    >
                                        <div className="w-10 h-10 bg-stadium-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Play size={16} className="text-accent-green" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate">{stream.label}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {stream.isLive && (
                                                    <span className="text-xs text-accent-red font-bold">LIVE</span>
                                                )}
                                                <span className="text-xs text-text-muted">m3u8</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Custom URL Input */}
                            <div className="pt-4 border-t border-border-subtle">
                                <label className="text-xs text-text-muted uppercase font-bold block mb-2">
                                    Custom m3u8 URL
                                </label>
                                <input
                                    type="text"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="https://example.com/stream.m3u8"
                                    className="w-full bg-stadium-dark border border-border-subtle rounded-lg px-3 py-2 text-sm mb-2"
                                />
                                <button
                                    onClick={() => {
                                        if (customUrl) setUseCustom(true);
                                    }}
                                    disabled={!customUrl}
                                    className="w-full px-4 py-2 bg-accent-green text-black rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Play Custom URL
                                </button>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="mt-4 bg-stadium-elevated rounded-2xl border border-border-strong p-4">
                            <h3 className="font-bold mb-3">Player Features</h3>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent-green rounded-full" />
                                    HLS.js for m3u8 streams
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent-green rounded-full" />
                                    Quality selection (Auto/Manual)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent-green rounded-full" />
                                    Base64 URL protection
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent-green rounded-full" />
                                    Iframe fallback for embeds
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-accent-green rounded-full" />
                                    Error recovery & retry
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
