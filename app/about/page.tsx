import type { Metadata } from "next";
import { Info, CheckCircle2, Globe, Clock, Smartphone, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
    title: "About Fanbroj Productions | Somali Sports & OTT Platform",
    description: "Learn about Fanbroj Productions, the leading platform for Somali live sports, dubbed movies, and series.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-stadium-dark pb-20">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-accent-green/5 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase">
                        About <span className="text-accent-green">Fanbroj Productions</span>
                    </h1>
                    <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
                        Hal meel oo Somali ku daawato ciyaar iyo filim, meel kasta oo aad joogto.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto space-y-16">

                    {/* Intro */}
                    <div className="bg-stadium-elevated border border-border-strong rounded-3xl p-8 md:p-12 shadow-2xl">
                        <h2 className="text-2xl md:text-3xl font-black mb-6 text-white uppercase tracking-tight">Kusoo Dhawaada Fanbroj</h2>
                        <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed space-y-6">
                            <p className="text-lg">
                                <strong>Fanbroj Productions</strong> waa madal casri ah oo loogu talagalay bulshada Soomaaliyeed, kuna midaynaysa <strong>ciyaaraha live</strong>, <strong>filimada af-Soomaali</strong>, iyo <strong>musalsalada caalamiga ah</strong> hal meel.
                            </p>
                            <p>
                                Waxaan abuurnay Fanbroj si aan u fududeyno daawashada:
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                                {[
                                    { text: "Ciyaaro live (Premier League, La Liga, iwm)", icon: <Globe size={20} className="text-accent-green" /> },
                                    { text: "Filimo Af-Soomaali Dubbed", icon: <CheckCircle2 size={20} className="text-accent-green" /> },
                                    { text: "Musalsalo & taxane caalami ah", icon: <CheckCircle2 size={20} className="text-accent-green" /> },
                                    { text: "Warar & falanqayn ciyaareed", icon: <MessageSquare size={20} className="text-accent-green" /> }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                        {item.icon}
                                        <span className="font-bold text-white">{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-white uppercase">Maxay Fanbroj Diiradda Saartaa?</h2>
                            <p className="text-text-secondary">Waxaan had iyo jeer ku dadaalnaa bixinta adeeg hufan oo la isku halayn karo.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { title: "Xawaare degdeg ah", desc: "Servers-keena waxay ku yaalaan meelo istiraatiiji ah.", icon: <Clock /> },
                                { title: "Daawasho aan buffering lahayn", desc: "U isticmaal internet yar tayada ugu sareeysa.", icon: <CheckCircle2 /> },
                                { title: "Multi-Platform Support", desc: "Mobile, Desktop & Smart TV support.", icon: <Smartphone /> },
                                { title: "Somali-u-habboon", desc: "Khibrad fudud oo luqadaada ah.", icon: <Globe /> }
                            ].map((feature, i) => (
                                <div key={i} className="flex gap-4 p-6 bg-stadium-elevated border border-white/5 rounded-2xl hover:border-accent-green/30 transition-colors">
                                    <div className="text-accent-green">{feature.icon}</div>
                                    <div>
                                        <h3 className="font-bold text-white">{feature.title}</h3>
                                        <p className="text-sm text-text-muted">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hadafka */}
                    <div className="text-center py-16 border-t border-white/5">
                        <h2 className="text-sm font-black text-accent-green uppercase tracking-widest mb-4">Our Mission</h2>
                        <blockquote className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter">
                            "In Fanbroj noqdo hal meel oo <span className="text-accent-green">Somali ku daawato</span> ciyaar iyo filim, meel kasta oo aad joogto."
                        </blockquote>
                    </div>
                </div>
            </section>
        </div>
    );
}
