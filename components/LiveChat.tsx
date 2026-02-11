"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { Send, User, Crown, Info, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LiveChatProps {
    matchId: string;
    className?: string;
}

export function LiveChat({ matchId, className }: LiveChatProps) {
    const { userId, isPremium } = useUser();
    const { data: messages, mutate: refreshMessages } = useSWR(
        `/api/messages?matchId=${matchId}&limit=100`,
        fetcher,
        { refreshInterval: 3000 } // Poll every 3 seconds for live chat
    );

    const [nickname, setNickname] = useState<string>("");
    const [isSettingNickname, setIsSettingNickname] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load nickname from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("fanbroj_nickname");
        if (saved) {
            setNickname(saved);
            setIsSettingNickname(false);
        }
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSetNickname = (e: React.FormEvent) => {
        e.preventDefault();
        if (nickname.trim()) {
            localStorage.setItem("fanbroj_nickname", nickname.trim());
            setIsSettingNickname(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId || !nickname) return;

        try {
            const content = newMessage.trim();
            setNewMessage(""); // Clear early for better UX
            await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matchId,
                    userId,
                    nickname,
                    content,
                    isPremium,
                }),
            });
            refreshMessages();
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    if (isSettingNickname) {
        return (
            <div className={cn("bg-stadium-elevated border border-border-strong rounded-2xl p-6 flex flex-col items-center justify-center text-center h-[400px]", className)}>
                <div className="w-16 h-16 bg-accent-green/20 rounded-full flex items-center justify-center mb-4">
                    <User className="text-accent-green" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">KU SOO DHAWAW CHAT-KA</h3>
                <p className="text-text-muted text-sm mb-6 max-w-[250px]">Fadlan qoro magacaaga si aad ula sheekaysato jamaahiirta kale.</p>
                <form onSubmit={handleSetNickname} className="w-full max-w-[300px] flex flex-col gap-3">
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Gali magacaaga..."
                        className="bg-stadium-dark border border-border-subtle rounded-xl px-4 py-3 focus:outline-none focus:border-accent-green transition-colors"
                        maxLength={20}
                        required
                    />
                    <button type="submit" className="bg-accent-green text-black font-black py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                        BILOW CHAT-KA
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className={cn("bg-stadium-elevated border border-border-strong rounded-2xl flex flex-col overflow-hidden h-[500px]", className)}>
            {/* Header */}
            <div className="p-4 border-b border-border-strong bg-stadium-hover flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent-red rounded-full animate-pulse" />
                    <span className="font-bold text-sm uppercase tracking-tighter">LIVE CHAT</span>
                </div>
                <div className="text-[10px] text-text-muted flex items-center gap-1">
                    <Info size={12} />
                    Xushmee dadka kale
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
                {messages === undefined ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-accent-green animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                        <MessageCircle size={48} strokeWidth={1} className="mb-2" />
                        <p className="text-sm">Fariin wali lama soo dirin. Noqo qofka ugu horeeya!</p>
                    </div>
                ) : (
                    messages.slice().reverse().map((msg) => (
                        <div key={msg._id} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                    msg.isPremium ? "text-accent-gold bg-accent-gold/10" : "text-text-muted bg-stadium-hover"
                                )}>
                                    {msg.isPremium && <Crown size={10} className="inline mr-1 -mt-0.5" />}
                                    {msg.nickname}
                                </span>
                                <span className="text-[9px] text-text-muted">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm bg-stadium-hover p-2 rounded-lg rounded-tl-none border border-border-subtle/50 text-text-secondary">
                                {msg.content}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Input */}
            <div className="p-4 border-t border-border-strong">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Farriintaada halkan ku qor..."
                        className="flex-1 bg-stadium-dark border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-green transition-colors"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-accent-green text-black p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-90 transition-all"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
