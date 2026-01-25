"use client";

import { LeaderboardTable } from "@/components/LeaderboardTable";
import { AdSlot } from "@/components/AdSlot";
import { Trophy, Star, Target } from "lucide-react";

export default function LeaderboardPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">
                    Tartanka <span className="text-accent-green">Sadaasha</span>
                </h1>
                <p className="text-text-secondary max-w-xl mx-auto text-lg">
                    Sadaali ciyaaraha, hel dhibco, oo noqo horyaalka Fanbroj!
                    Todobaad walba abaalmarino qaali ah.
                </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-stadium-card border border-white/5 p-6 rounded-xl text-center">
                    <div className="w-12 h-12 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-green">
                        <Target size={24} />
                    </div>
                    <h3 className="font-bold mb-2">1. Sadaali</h3>
                    <p className="text-sm text-text-muted">Dooro cidda badinaysa ama barbaraha ka hor inta aysan ciyaartu bilaaban.</p>
                </div>
                <div className="bg-stadium-card border border-white/5 p-6 rounded-xl text-center">
                    <div className="w-12 h-12 bg-accent-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-gold">
                        <Star size={24} />
                    </div>
                    <h3 className="font-bold mb-2">2. Dhibco Ururso</h3>
                    <p className="text-sm text-text-muted">
                        <span className="text-white font-bold">10 dhibcood</span> haddii aad saxdo guusha.
                        <span className="text-white font-bold block">15 dhibcood</span> haddii aad saxdo barbaraha.
                    </p>
                </div>
                <div className="bg-stadium-card border border-white/5 p-6 rounded-xl text-center">
                    <div className="w-12 h-12 bg-accent-red/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-red">
                        <Trophy size={24} />
                    </div>
                    <h3 className="font-bold mb-2">3. Guuleyso</h3>
                    <p className="text-sm text-text-muted">Qofka ugu dhibcaha badan todobaadkii wuxuu helayaa VIP access bilaash ah.</p>
                </div>
            </div>

            <AdSlot slotKey="leaderboard_top" className="mb-8" />

            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Trophy className="text-accent-gold" />
                    Hogaanka
                </h2>
                {/* Could add filter tabs: Weekly | Monthly | All Time */}
            </div>

            <LeaderboardTable limit={50} />

        </div>
    );
}
