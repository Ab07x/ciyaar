import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Tv, Monitor, Cast, Globe } from "lucide-react";

export const metadata: Metadata = {
    title: "Fanbroj on TV - Android TV, Fire TV & Smart TV",
    description: "Sida loo daawado Fanbroj TV-gaaga. Android TV, Amazon Fire TV, iyo Smart TV Browser.",
    openGraph: {
        title: "Fanbroj Smart TV App",
        description: "Ku raaxeyso shaashada weyn.",
    },
};

export default function TVAppPage() {
    return (
        <div className="min-h-screen bg-stadium-dark pb-20">
            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-6">
                <Link href="/apps" className="flex items-center gap-2 text-text-muted hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to Apps
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden mb-16 py-12">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 text-accent-blue font-bold mb-6 border border-accent-blue/20">
                        <Tv size={18} />
                        <span>Big Screen Experience</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-white">
                        FANBROJ <span className="text-accent-blue">SMART TV</span>
                    </h1>
                    <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
                        Gurigaaga ka dhig shineemo. Daawo ciyaaraha iyo filimaanta adiga oo fadhiya fadhigaaga, tayaduna tahay 4K HDR.
                    </p>

                    {/* TV Mockup */}
                    <div className="relative max-w-4xl mx-auto">
                        <div className="aspect-video bg-black border-8 border-gray-800 rounded-t-xl shadow-2xl relative overflow-hidden group">
                            {/* TV Stand */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-8 bg-gray-800 z-0"></div>

                            {/* Screen Content */}
                            <div className="w-full h-full bg-stadium-elevated flex items-center justify-center relative z-10">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black tracking-widest text-white/20 uppercase">Fanbroj TV</h2>
                                    <p className="text-white/10 mt-2 font-mono">Select a method below</p>
                                </div>
                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Methods Grid */}
            <section className="container mx-auto px-4 mb-20 bg-stadium-elevated py-16 rounded-3xl border border-border-subtle">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Android TV */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                            <Monitor size={40} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Android TV</h3>
                        <p className="text-text-secondary mb-6">Sony, TCL, Xiaomi, Nvidia Shield</p>
                        <ol className="text-left text-sm space-y-3 bg-stadium-dark p-6 rounded-xl border border-border-subtle inline-block w-full max-w-sm">
                            <li className="flex gap-3"><span className="bg-green-500/20 text-green-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">1</span> Fur Google Play Store-ka TV-gaaga.</li>
                            <li className="flex gap-3"><span className="bg-green-500/20 text-green-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">2</span> Ka raadi "Fanbroj".</li>
                            <li className="flex gap-3"><span className="bg-green-500/20 text-green-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">3</span> Install dheh oo gal code-kaaga.</li>
                        </ol>
                    </div>

                    {/* Fire TV */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-6">
                            <Cast size={40} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Fire TV / Stick</h3>
                        <p className="text-text-secondary mb-6">Amazon Fire Stick, Fire TV Cube</p>
                        <ol className="text-left text-sm space-y-3 bg-stadium-dark p-6 rounded-xl border border-border-subtle inline-block w-full max-w-sm">
                            <li className="flex gap-3"><span className="bg-orange-500/20 text-orange-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">1</span> Soo degso app-ka "Downloader".</li>
                            <li className="flex gap-3"><span className="bg-orange-500/20 text-orange-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">2</span> Gali link-gan: <span className="font-mono text-white">fanbroj.net/tv.apk</span></li>
                            <li className="flex gap-3"><span className="bg-orange-500/20 text-orange-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">3</span> Install dheh oo fur.</li>
                        </ol>
                    </div>

                    {/* Browser */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-6">
                            <Globe size={40} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Web Browser</h3>
                        <p className="text-text-secondary mb-6">Samsung Tizen, LG WebOS</p>
                        <ol className="text-left text-sm space-y-3 bg-stadium-dark p-6 rounded-xl border border-border-subtle inline-block w-full max-w-sm">
                            <li className="flex gap-3"><span className="bg-blue-500/20 text-blue-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">1</span> Fur "Internet Browser" TV-gaaga.</li>
                            <li className="flex gap-3"><span className="bg-blue-500/20 text-blue-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">2</span> Booqo: <span className="font-mono text-white">fanbroj.net</span></li>
                            <li className="flex gap-3"><span className="bg-blue-500/20 text-blue-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">3</span> Login dheh oo si toos ah u daawo.</li>
                        </ol>
                    </div>
                </div>
            </section>
        </div>
    );
}
