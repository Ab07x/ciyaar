"use client";

import { useState } from "react";
import { Badge } from "./Badge";
import { CountdownTimer } from "./CountdownTimer";
import { StreamPlayer } from "./StreamPlayer";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@/lib/utils";
import { MessageSquare, Crown } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

interface Embed { label: string; url: string; type?: "m3u8" | "iframe" | "video" | "auto"; isProtected?: boolean; }

interface PlayerStageProps {
    match: {
        _id: Id<"matches">;
        status: "live" | "upcoming" | "finished";
        kickoffAt: number;
        embeds: Embed[];
        isPremium: boolean;
        requiredPlan?: "match" | "weekly" | "monthly" | "yearly" | null;
        summary?: string | null;
    };
    settings: { whatsappNumber: string; };
    className?: string;
}

export function PlayerStage({ match, settings, className }: PlayerStageProps) {
    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const { isPremium, redeemCode } = useUser();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [localUnlocked, setLocalUnlocked] = useState(false);
    const [isTimerFinished, setIsTimerFinished] = useState(false);

    const isUnlocked = !match.isPremium || isPremium || localUnlocked;

    const handleRedeem = async () => {
        if (!code.trim()) return;
        setLoading(true); setError("");
        const result = await redeemCode(code.trim(), match._id);
        setLoading(false);
        if (result.success) setLocalUnlocked(true);
        else setError(result.error || "Code qaldan");
    };

    // Premium Lock
    if (match.isPremium && !isUnlocked) {
        const phone = settings?.whatsappNumber || "";
        const whatsappLink = `https://wa.me/${phone.replace(/\D/g, "")}?text=Waxaan rabaa inaan furo match ${match._id}`;
        return (
            <div className={cn("player-stage bg-stadium-elevated flex items-center justify-center p-4", className)}>
                <div className="bg-stadium-dark border-2 border-accent-gold rounded-2xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-4"><Crown size={32} className="text-accent-gold" /></div>
                    <h3 className="text-2xl font-bold text-accent-gold mb-2">PREMIUM</h3>
                    <p className="text-text-secondary mb-6">Ciyaartan waxaa u baahan subscription</p>
                    <div className="space-y-4">
                        <div className="flex gap-2"><input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="flex-1 bg-stadium-elevated border border-border-subtle rounded-lg px-4 py-3 uppercase text-center tracking-wider" /><button onClick={handleRedeem} disabled={loading} className="px-6 py-3 bg-accent-green text-black font-bold rounded-lg">{loading ? "..." : "Fur"}</button></div>
                        {error && <p className="text-accent-red text-sm">{error}</p>}
                        <div className="flex gap-3">
                            <Link href="/pricing" className="flex-1 px-4 py-3 bg-accent-gold text-black font-bold rounded-lg text-center">Iibso</Link>
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"><MessageSquare size={18} />WhatsApp</a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Upcoming
    if (match.status === "upcoming") {
        return (
            <div className={cn("player-stage bg-stadium-elevated flex flex-col items-center justify-center p-8", className)}>
                <Badge variant="upcoming" className="mb-4" />
                {!isTimerFinished && <h3 className="text-xl font-bold mb-6">Ciyaartu weli ma bilaaban</h3>}
                <CountdownTimer kickoffAt={match.kickoffAt} onComplete={() => setIsTimerFinished(true)} />
            </div>
        );
    }

    // Finished
    if (match.status === "finished") {
        return (
            <div className={cn("player-stage bg-stadium-elevated flex flex-col items-center justify-center p-8 text-center", className)}>
                <Badge variant="finished" className="mb-4" />
                <h3 className="text-2xl font-bold mb-4">Ciyaartu way dhamaatay</h3>
                {match.summary && <p className="text-text-secondary max-w-lg mx-auto mb-6">{match.summary}</p>}
                <div className="bg-stadium-hover p-6 rounded-xl border border-border-subtle"><p className="text-text-muted italic">Natiijooyinka iyo dib-u-eegista ciyaarta ayaa lasoo gelin doonaa dhowaan.</p></div>
            </div>
        );
    }

    // Live
    const activeEmbed = match.embeds[activeEmbedIndex];
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="player-stage bg-black rounded-2xl overflow-hidden border border-border-subtle shadow-2xl">
                {activeEmbed?.url ? (
                    <StreamPlayer
                        source={{
                            url: activeEmbed.url,
                            label: activeEmbed.label,
                            type: activeEmbed.type || "auto",
                            isProtected: activeEmbed.isProtected
                        }}
                        className="absolute inset-0"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-text-muted">Lama hayo linkiyadii ciyaarta.</div>
                )}
            </div>
            {match.embeds.length > 1 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-text-muted uppercase font-bold tracking-wider mr-2">Haddii uusan shaqaynin → Bedel Link:</span>
                    {match.embeds.map((embed, index) => (
                        <button key={index} onClick={() => setActiveEmbedIndex(index)} className={cn("px-4 py-2 text-sm font-semibold rounded-md border transition-all", activeEmbedIndex === index ? "bg-accent-green text-black border-accent-green" : "bg-stadium-elevated text-text-secondary border-border-subtle hover:border-text-muted")}>{embed.label || `Link ${index + 1}`}</button>
                    ))}
                </div>
            )}
        </div>
    );
}
