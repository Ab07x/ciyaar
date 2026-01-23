import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone, Tablet, Tv, CheckCircle, Download, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Fanbroj Apps - Daawo Ciyaar iyo Filim Meel Kasta",
    description: "Kala deg Fanbroj App mobilkaaga Android, iOS ama TV-gaaga. Daawo ciyaaraha tooska ah iyo filimaanta ugu shidan.",
    openGraph: {
        title: "Fanbroj Apps - Daawo Ciyaar iyo Filim Meel Kasta",
        description: "Hel khibrada u wanaagsan ee daawashada adigoo isticmaalaya Fanbroj App.",
    },
};

export default function AppsHubPage() {
    return (
        <div className="min-h-screen bg-stadium-dark pb-20">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-accent-green/10 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
                        FANBROJ <span className="text-accent-green">APPS</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto font-medium mb-8 leading-relaxed">
                        Daawo Ciyaaraha Caalamka, Filimaanta Soomaaliga, iyo Musalsalada ugu shidan meel kasta iyo goor kasta.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-text-muted">
                        <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            <CheckCircle size={16} className="text-accent-green" /> Fast Streaming
                        </span>
                        <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            <CheckCircle size={16} className="text-accent-green" /> Low Data Usage
                        </span>
                        <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            <CheckCircle size={16} className="text-accent-green" /> 4K & HD Support
                        </span>
                    </div>
                </div>
            </section>

            {/* Platform Cards */}
            <section className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

                    {/* Android Card */}
                    <div className="group relative bg-stadium-elevated border border-border-subtle rounded-3xl p-8 hover:border-accent-green/50 transition-all duration-300 hover:-translate-y-2 shadow-xl">
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Smartphone size={120} />
                        </div>
                        <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center text-accent-green mb-6 group-hover:scale-110 transition-transform">
                            <Smartphone size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Android App</h2>
                        <p className="text-text-secondary mb-8 leading-relaxed">
                            Khibrada ugu fiican ee mobilada Android. Daawo adiga oo socda.
                        </p>
                        <Link
                            href="/apps/android"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-accent-green text-black font-bold rounded-xl hover:brightness-110 transition-all"
                        >
                            <Download size={20} />
                            Download App
                        </Link>
                    </div>

                    {/* iOS Card */}
                    <div className="group relative bg-stadium-elevated border border-border-subtle rounded-3xl p-8 hover:border-white/50 transition-all duration-300 hover:-translate-y-2 shadow-xl">
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Tablet size={120} />
                        </div>
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                            <Tablet size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">iOS App</h2>
                        <p className="text-text-secondary mb-8 leading-relaxed">
                            Naqshad u gaar ah iPhone iyo iPad. Tayo sare iyo xawaare.
                        </p>
                        <Link
                            href="/apps/ios"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all"
                        >
                            <Download size={20} />
                            Download App
                        </Link>
                    </div>

                    {/* TV Card */}
                    <div className="group relative bg-stadium-elevated border border-border-subtle rounded-3xl p-8 hover:border-accent-blue/50 transition-all duration-300 hover:-translate-y-2 shadow-xl">
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Tv size={120} />
                        </div>
                        <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue mb-6 group-hover:scale-110 transition-transform">
                            <Tv size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Smart TV</h2>
                        <p className="text-text-secondary mb-8 leading-relaxed">
                            Shaashada weyn ku raaxeyso. Android TV, Fire TV iyo PC.
                        </p>
                        <Link
                            href="/apps/tv"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-accent-blue text-white font-bold rounded-xl hover:brightness-110 transition-all"
                        >
                            <Tv size={20} />
                            Watch on TV
                        </Link>
                    </div>

                </div>
            </section>

            {/* SEO Content Block */}
            <section className="container mx-auto px-4 mt-24">
                <div className="max-w-4xl mx-auto bg-stadium-elevated/50 border border-border-subtle rounded-2xl p-8 md:p-12">
                    <h3 className="text-2xl font-bold mb-6 text-white">Maxaan u isticmaalaa Fanbroj App?</h3>
                    <div className="space-y-4 text-text-secondary leading-relaxed">
                        <p>
                            Fanbroj App wuxuu kuu sahlayaa inaad si toos ah u daawato ciyaaraha kubadda cagta adduunka adiga oo jooga meel kasta. Uma baahnid inaad raadiso links ama website-yo kala duwan. Waxaan kuu keenaynaa Premier League, La Liga, Serie A iyo Champions League oo tayadoodu sareyso.
                        </p>
                        <p>
                            Sidoo kale, waxaad ka heli doontaa aflaanta iyo musalsalada ugu dambeeyay ee Af-Soomaaliga lagu turjumay. App-ka wuxuu isticmaalaa xog (internet data) ka yar tan browser-ka caadiga ah, wuxuuna leeyahay "Notification System" kuu soo sheegaya marka ciyaarta bilaabaneyso.
                        </p>
                        <div className="pt-4">
                            <Link href="/pricing" className="text-accent-green hover:underline flex items-center gap-2 font-bold">
                                Fiiri Qiimaha haray <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
