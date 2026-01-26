"use client";

import { useState } from "react";
import { StreamPlayer } from "@/components/StreamPlayer";
import { Tv, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

// Your restreamed beIN Sports channels
// Replace YOUR_LIGHTSAIL_IP with your actual IP
const LIGHTSAIL_IP = "13.61.187.198";

const LIVE_CHANNELS = [
    {
        id: "bein1",
        name: "beIN Sports 1 HD",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/BeIN_Sports_logo_%282017%29.svg",
        streamUrl: `http://${LIGHTSAIL_IP}/hls/bein1/index.m3u8`,
        category: "Sports",
    },
    {
        id: "bein2",
        name: "beIN Sports 2 HD",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/BeIN_Sports_logo_%282017%29.svg",
        streamUrl: `http://${LIGHTSAIL_IP}/hls/bein2/index.m3u8`,
        category: "Sports",
    },
    {
        id: "bein3",
        name: "beIN Sports 3 HD",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/BeIN_Sports_logo_%282017%29.svg",
        streamUrl: `http://${LIGHTSAIL_IP}/hls/bein3/index.m3u8`,
        category: "Sports",
    },
    {
        id: "bein4",
        name: "beIN Sports 4 HD",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/BeIN_Sports_logo_%282017%29.svg",
        streamUrl: `http://${LIGHTSAIL_IP}/hls/bein4/index.m3u8`,
        category: "Sports",
    },
    {
        id: "bein5",
        name: "beIN Sports 5 HD",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/BeIN_Sports_logo_%282017%29.svg",
        streamUrl: `http://${LIGHTSAIL_IP}/hls/bein5/index.m3u8`,
        category: "Sports",
    },
];

export default function LiveTVPage() {
    const [selectedChannel, setSelectedChannel] = useState(LIVE_CHANNELS[0]);
    const [isLoading, setIsLoading] = useState(false);

    const handleChannelChange = (channel: typeof LIVE_CHANNELS[0]) => {
        setIsLoading(true);
        setSelectedChannel(channel);
        // Reset loading after a brief moment
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleRefresh = () => {
        setIsLoading(true);
        // Force re-mount of StreamPlayer
        const currentChannel = selectedChannel;
        setSelectedChannel({ ...currentChannel, id: `${currentChannel.id}-refresh-${Date.now()}` });
        setTimeout(() => {
            setSelectedChannel(currentChannel);
            setIsLoading(false);
        }, 100);
    };

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

            <div className="flex h-screen pt-20">
                {/* Video Player Area */}
                <main className="flex-1 p-4">
                    <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden">
                        <StreamPlayer
                            key={selectedChannel.id}
                            source={{
                                url: selectedChannel.streamUrl,
                                type: "m3u8",
                            }}
                            className="w-full h-full rounded-2xl"
                            onError={(error) => console.error("Stream error:", error)}
                            onReady={() => setIsLoading(false)}
                        />
                    </div>

                    {/* Now Playing Info */}
                    <div className="mt-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
                            <img
                                src={selectedChannel.logo}
                                alt={selectedChannel.name}
                                className="w-10 h-10 object-contain"
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{selectedChannel.name}</h2>
                            <p className="text-gray-400">
                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                                Live Now
                            </p>
                        </div>
                    </div>
                </main>

                {/* Channel Sidebar */}
                <aside className="w-80 bg-zinc-900/50 backdrop-blur-xl p-4 overflow-y-auto border-l border-white/10">
                    <h3 className="text-lg font-bold mb-4 text-white/80">Channels</h3>

                    <div className="space-y-2">
                        {LIVE_CHANNELS.map((channel) => (
                            <button
                                key={channel.id}
                                onClick={() => handleChannelChange(channel)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${selectedChannel.id === channel.id
                                    ? "bg-red-600 text-white"
                                    : "bg-zinc-800/50 hover:bg-zinc-800 text-white/80 hover:text-white"
                                    }`}
                            >
                                <div className="w-10 h-10 bg-black/30 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img
                                        src={channel.logo}
                                        alt={channel.name}
                                        className="w-6 h-6 object-contain"
                                    />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="font-medium truncate">{channel.name}</p>
                                    <p className="text-xs text-white/50">{channel.category}</p>
                                </div>
                                {selectedChannel.id === channel.id && (
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
