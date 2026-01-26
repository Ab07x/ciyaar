"use client";

import { useState, useEffect } from "react";
import { StreamPlayer } from "@/components/StreamPlayer";
import { Tv, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function LiveTVPage() {
    // Fetch channels from database
    const channels = useQuery(api.channels.list, { isLive: true });

    // State
    const [selectedChannel, setSelectedChannel] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Auto-select first channel when loaded
    useEffect(() => {
        if (channels && channels.length > 0 && !selectedChannel) {
            setSelectedChannel(channels[0]);
        }
    }, [channels, selectedChannel]);

    const handleChannelChange = (channel: any) => {
        setIsLoading(true);
        setSelectedChannel(channel);
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleRefresh = () => {
        setIsLoading(true);
        setRefreshKey(prev => prev + 1);
        setTimeout(() => setIsLoading(false), 500);
    };

    // Loading State
    if (!channels) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-red-600 w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent p-4 flex items-center justify-between">
                <Link
                    href="/tv"
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                    <span className="font-medium">Back</span>
                </Link>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <Tv size={20} />
                    </div>
                    <span className="font-bold text-xl">Live TV</span>
                </div>

                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </header>

            {/* Header content remains same... */}
            <div className="flex h-screen pt-20">
                {/* Video Player Area */}
                <main className="flex-1 p-4">
                    <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden">
                        {selectedChannel ? (
                            <StreamPlayer
                                key={`${selectedChannel._id}-${refreshKey}`}
                                source={{
                                    url: selectedChannel.embeds[0]?.url || "",
                                    type: "m3u8",
                                }}
                                className="w-full h-full rounded-2xl"
                                onError={(error) => console.error("Stream error:", error)}
                                onReady={() => setIsLoading(false)}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                Select a channel
                            </div>
                        )}
                    </div>

                    {/* Now Playing Info */}
                    {selectedChannel && (
                        <div className="mt-4 flex items-center gap-4">
                            <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
                                {selectedChannel.thumbnailUrl ? (
                                    <img
                                        src={selectedChannel.thumbnailUrl}
                                        alt={selectedChannel.name}
                                        className="w-10 h-10 object-contain"
                                    />
                                ) : (
                                    <Tv className="w-8 h-8 text-white/50" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedChannel.name}</h2>
                                <p className="text-gray-400 capitalize">
                                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                                    {selectedChannel.category || "Live"}
                                </p>
                            </div>
                        </div>
                    )}
                </main>

                {/* Channel Sidebar */}
                <aside className="w-80 bg-zinc-900/50 backdrop-blur-xl p-4 overflow-y-auto border-l border-white/10">
                    <h3 className="text-lg font-bold mb-4 text-white/80">Channels</h3>

                    <div className="space-y-2">
                        {channels.map((channel: any) => (
                            <button
                                key={channel._id}
                                onClick={() => handleChannelChange(channel)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${selectedChannel?._id === channel._id
                                    ? "bg-red-600 text-white"
                                    : "bg-zinc-800/50 hover:bg-zinc-800 text-white/80 hover:text-white"
                                    }`}
                            >
                                <div className="w-10 h-10 bg-black/30 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {channel.thumbnailUrl ? (
                                        <img
                                            src={channel.thumbnailUrl}
                                            alt={channel.name}
                                            className="w-6 h-6 object-contain"
                                        />
                                    ) : (
                                        <Tv size={16} />
                                    )}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="font-medium truncate">{channel.name}</p>
                                    <p className="text-xs text-white/50 capitalize">{channel.category}</p>
                                </div>
                                {selectedChannel?._id === channel._id && (
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl">
                        <p className="text-sm text-gray-400">
                            📡 <strong>Stream Info</strong><br />
                            These streams are restreamed from your AWS Lightsail server via HLS.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
