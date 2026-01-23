import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Tablet, Smartphone, Search, Zap, Star } from "lucide-react";

export const metadata: Metadata = {
    title: "Fanbroj iOS App - iPhone & iPad",
    description: "Fanbroj App for iOS. Daawo ciyaaraha iyo filimaanta adigoo isticmaalaya iPhone ama iPad.",
    openGraph: {
        title: "Fanbroj for iPhone & iPad",
        description: "Khibrad heer sare ah oo loogu talagalay Apple devices.",
    },
};

export default function IOSAppPage() {
    return (
        <div className="min-h-screen bg-stadium-dark pb-20">
            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-6">
                <Link href="/apps" className="flex items-center gap-2 text-text-muted hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to Apps
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden mb-16">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* Text Content */}
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-bold mb-6 border border-white/20">
                                <span className="bg-white text-black text-xs px-1.5 rounded-sm font-bold"></span>
                                <span>Designed for iOS 17</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter leading-tight text-white">
                                FANBROJ <span className="text-blue-500">iOS</span>
                            </h1>
                            <p className="text-xl text-text-secondary mb-8 leading-relaxed max-w-xl mx-auto md:mx-0">
                                Naqshad qurux badan, xawaare sare, iyo tayada ugu fiican oo loogu talagalay iPhone iyo iPad.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-200 transition-all opacity-80 cursor-not-allowed" disabled>
                                    Coming Soon to App Store
                                </button>
                            </div>
                            <p className="mt-4 text-sm text-text-muted">
                                Notify me when available • Join Beta Test
                            </p>
                        </div>

                        {/* iPhone Mockup (CSS only) */}
                        <div className="flex-1 flex justify-center md:justify-end">
                            <div className="relative w-[300px] h-[600px] bg-black border-[14px] border-gray-800 rounded-[50px] shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-3xl z-20"></div>
                                {/* Screen Content */}
                                <div className="w-full h-full bg-stadium-elevated flex flex-col pt-12">
                                    {/* App Header */}
                                    <div className="px-6 pb-4 border-b border-border-subtle flex justify-between items-center">
                                        <span className="font-black text-xl italic tracking-tighter">FAN<span className="text-accent-green">BROJ</span></span>
                                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                                            <Search size={14} />
                                        </div>
                                    </div>
                                    {/* Content Placeholder */}
                                    <div className="p-4 space-y-4">
                                        <div className="w-full aspect-video bg-gradient-to-br from-green-900/40 to-black rounded-xl border border-white/5 relative overflow-hidden">
                                            <div className="absolute bottom-3 left-3">
                                                <div className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase">Live</div>
                                                <div className="text-white font-bold mt-1">Premier League</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="aspect-[2/3] bg-white/5 rounded-lg"></div>
                                            <div className="aspect-[2/3] bg-white/5 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Highlights */}
            <section className="container mx-auto px-4 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <Star className="text-yellow-400 mb-4" size={32} />
                        <h3 className="text-xl font-bold mb-2">Native Design</h3>
                        <p className="text-text-secondary">Si buuxda ugu raaxeyso naqshad u gaar ah Apple ecosystem, oo leh animations siman.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <Tablet className="text-blue-400 mb-4" size={32} />
                        <h3 className="text-xl font-bold mb-2">iPad Support</h3>
                        <p className="text-text-secondary">App-ka wuxuu sidoo kale u shaqeynayaa si heer sare ah shaashadaha waaweyn ee iPad-ka.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <Zap className="text-purple-400 mb-4" size={32} />
                        <h3 className="text-xl font-bold mb-2">Pro Motion</h3>
                        <p className="text-text-secondary">Wuxuu taageerayaa 120Hz refresh rate si aad u hesho khibrad daawasho oo aad u siman.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
