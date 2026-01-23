import type { Metadata } from "next";
import Link from "next/link";
import { Download, CheckCircle, Smartphone, Wifi, Bell, Shield, HelpCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Fanbroj Android App - Daawo Ciyaar iyo Filim Af-Somali",
    description: "Soo degso Fanbroj Android App. Daawasho toos ah, filimaan cusub, iyo xog yar oo la isticmaalo.",
    openGraph: {
        title: "Fanbroj Android App - Download Now",
        description: "App-ka rasmiga ah ee Fanbroj. Daawo ciyaaraha caalamka.",
    },
};

export default function AndroidAppPage() {
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
                <div className="absolute inset-0 bg-gradient-to-r from-accent-green/10 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* Text Content */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/20 text-accent-green text-sm font-bold mb-6 border border-accent-green/20">
                                <Smartphone size={14} />
                                <span>Android Version 2.0</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter leading-tight">
                                FANBROJ <span className="text-accent-green">ANDROID</span> APP
                            </h1>
                            <p className="text-xl text-text-secondary mb-8 leading-relaxed max-w-xl mx-auto md:mx-0">
                                Khibrada ugu fiican ee daawashada. Soo degso App-ka oo hel ciyaaraha tooska ah, filimaanta, iyo musalsalada adiga oo isticmaalaya internet yar.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button className="cta-primary h-14 px-8 text-lg shadow-lg shadow-accent-green/20">
                                    <Download size={24} />
                                    Download APK (Direct)
                                </button>
                                <button className="cta-secondary h-14 px-8 text-lg">
                                    Google Play (Coming Soon)
                                </button>
                            </div>
                            <p className="mt-4 text-sm text-text-muted">
                                Requires Android 5.0 or later • Free Download
                            </p>
                        </div>

                        {/* Phone Mockup Placeholder */}
                        <div className="flex-1 flex justify-center md:justify-end">
                            <div className="relative w-[280px] h-[580px] border-[12px] border-stadium-elevated rounded-[3rem] bg-stadium-dark shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-stadium-elevated rounded-b-xl z-20"></div>
                                <div className="w-full h-full bg-gradient-to-b from-stadium-elevated to-stadium-dark flex items-center justify-center p-6 text-center">
                                    <div>
                                        <div className="w-16 h-16 bg-accent-green/20 rounded-2xl flex items-center justify-center text-accent-green mx-auto mb-4">
                                            <span className="font-black text-2xl">FB</span>
                                        </div>
                                        <p className="text-text-muted font-mono text-sm">App Screenshot</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4 mb-20">
                <h2 className="text-3xl font-bold mb-12 text-center text-white">Maxaa u gaar ah App-ka?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-stadium-elevated p-8 rounded-2xl border border-border-subtle hover:border-accent-green/30 transition-colors">
                        <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center text-accent-green mb-4">
                            <Wifi size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Internet Yar</h3>
                        <p className="text-text-secondary">
                            Waxaan u sameynay qaab keydinaya xogtaada (Data Saver Mode) si aad ugu daawato video tayo leh internet yar.
                        </p>
                    </div>
                    <div className="bg-stadium-elevated p-8 rounded-2xl border border-border-subtle hover:border-accent-green/30 transition-colors">
                        <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center text-accent-green mb-4">
                            <Smartphone size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Low Buffering</h3>
                        <p className="text-text-secondary">
                            Servers-keenu waa kuwa ugu dheereeya, mana la kulmi doontid buffering xittaa haddii internet-kaagu gaabis yahay.
                        </p>
                    </div>
                    <div className="bg-stadium-elevated p-8 rounded-2xl border border-border-subtle hover:border-accent-green/30 transition-colors">
                        <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center text-accent-green mb-4">
                            <Bell size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Match Reminders</h3>
                        <p className="text-text-secondary">
                            Wuxuu kuu soo dirayaa ogeysiis (notification) 15 daqiiqo ka hor inta aysan ciyaartu bilaaban.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-bold mb-8 text-center text-white flex items-center justify-center gap-3">
                    <HelpCircle className="text-accent-green" /> Su'aalaha Badanaa La Isweydiiyo
                </h2>
                <div className="space-y-4">
                    <div className="bg-stadium-elevated rounded-xl p-6 border border-border-subtle">
                        <h3 className="font-bold text-lg mb-2 text-white">App-ka ma lacag baa?</h3>
                        <p className="text-text-muted">
                            Haa iyo Maya. Filimaanta iyo wararka waa bilaash. Ciyaaraha tooska ah (Live Matches) qaarkood waa bilaash, kuwana waa Premium (lacag yar).
                        </p>
                    </div>
                    <div className="bg-stadium-elevated rounded-xl p-6 border border-border-subtle">
                        <h3 className="font-bold text-lg mb-2 text-white">Sideen u degsan karaa?</h3>
                        <p className="text-text-muted">
                            Riix badhanka "Download APK" ee kor ku yaal. Kadib Install dheh file-ka soo degay. Hubi inaad ogolaatay "Unknown Sources" settings-ka mobilkaaga.
                        </p>
                    </div>
                    <div className="bg-stadium-elevated rounded-xl p-6 border border-border-subtle">
                        <h3 className="font-bold text-lg mb-2 text-white">Login ma u baahanahay?</h3>
                        <p className="text-text-muted">
                            Uma baahnid login si aad u daawato waxyaabaha bilaashka ah. Laakiin si aad u hesho Premium, waa inaad gashataa Code-ka.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
