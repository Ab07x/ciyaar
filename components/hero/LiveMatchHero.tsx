
import Link from "next/link";
import Image from "next/image";
import { Play, ExternalLink } from "lucide-react";
import { LiveBadge } from "@/components/ui/LiveBadge";

interface LiveMatchHeroProps {
    match: any;
}

export function LiveMatchHero({ match }: LiveMatchHeroProps) {
    if (!match) return null;

    return (
        <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden bg-black">
            {/* Background Image (Stadium/Generic or Match specific) */}
            <div className="absolute inset-0">
                <Image
                    src="/img/stadium-bg.jpg" // Fallback or dynamic
                    alt="Stadium"
                    fill
                    className="object-cover opacity-40 mix-blend-overlay"
                    priority
                />
                {/* Team Colors Gradient (Optional - purely decorative) */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-blue-900/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-stadium-dark via-transparent to-stadium-dark/40" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-stadium-dark to-transparent" />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">

                <div className="mb-6 animate-pulse">
                    <LiveBadge text="LIVE NOW" />
                </div>

                {/* VS Display */}
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 lg:gap-24 mb-10 w-full max-w-5xl justify-center">

                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-4 flex-1">
                        <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]">
                            {match.teamALogo ? (
                                <Image
                                    src={match.teamALogo}
                                    alt={match.teamA}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10">
                                    <span className="text-white font-black text-4xl md:text-5xl">
                                        {match.teamA?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter text-shadow-lg">
                            {match.teamA}
                        </h2>
                    </div>

                    {/* Score / VS Center */}
                    <div className="flex flex-col items-center">
                        <div className="text-4xl md:text-6xl font-black text-white/20 italic tracking-widest">
                            VS
                        </div>
                        <div className="mt-2 px-4 py-1 bg-white/5 rounded-full backdrop-blur border border-white/10 text-sm font-bold text-accent-green">
                            {match.leagueName}
                        </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-4 flex-1">
                        <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]">
                            {match.teamBLogo ? (
                                <Image
                                    src={match.teamBLogo}
                                    alt={match.teamB}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/10">
                                    <span className="text-white font-black text-4xl md:text-5xl">
                                        {match.teamB?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter text-shadow-lg">
                            {match.teamB}
                        </h2>
                    </div>
                </div>

                {/* Primary CTA */}
                <Link
                    href={`/match/${match.slug}`}
                    className="group relative inline-flex items-center gap-3 px-8 md:px-12 py-4 md:py-5 bg-accent-red hover:bg-red-600 text-white font-black text-lg md:text-xl rounded-full transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)]"
                >
                    <span className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20" />
                    <Play fill="currentColor" size={24} />
                    DAAWO CIYAARTA
                </Link>

            </div>
        </div>
    )
}
