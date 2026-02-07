import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { UserProvider } from "@/providers/UserProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import Link from "next/link";
import Image from "next/image";
import { SearchBox } from "@/components/SearchBox";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { ToastProvider } from "@/providers/ToastProvider";
import { PushProvider } from "@/providers/PushProvider";
import { NotificationOptIn } from "@/components/NotificationOptIn";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ConnectionIndicator } from "@/components/mobile/OfflineIndicator";

// Use static metadata to prevent build hangs
// Dynamic settings loaded client-side via Convex provider
export function generateMetadata(): Metadata {
  const siteName = "Fanbroj";
  const title = `${siteName} - Daawo Ciyaar Live & Filimaan`;
  const description = "Fanbroj waa halka aad kala socon karto ciyaaraha tooska ah (live), ciyaaraha maanta, iyo wararka kubadda cagta.";
  const keywords = ["ciyaar live", "somali", "kubadda cagta", "fanbroj", "live sports"];

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fanbroj.net"),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description: description,
    keywords: keywords,
    authors: [{ name: "Fanbroj Team" }],
    creator: siteName,
    openGraph: {
      type: "website",
      locale: "so_SO",
      url: "https://fanbroj.net",
      title: title,
      description: description,
      siteName: siteName,
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${siteName} - Ciyaaraha & Madadaalada`,
        },
      ],
    },
    icons: {
      icon: "/img/logo/icon-fanbroj.png",
      shortcut: "/img/logo/icon-fanbroj.png",
      apple: "/img/logo/icon-fanbroj.png",
    },
    manifest: "/manifest.json",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="so" suppressHydrationWarning>
      <head>
        {/* Mobile Viewport - Optimized for iOS and Android */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, viewport-fit=cover, user-scalable=yes" />

        {/* iOS Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fanbroj" />

        {/* Android Web App Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#020D18" />

        {/* Stadium Noir Typography - Outfit (Display) + Inter (Body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased bg-[var(--bg-primary)] text-[var(--color-text-primary)] min-h-screen overflow-x-hidden max-w-[100vw]"
      >
        <ConvexClientProvider>
          <LanguageProvider>
            <UserProvider>
              <PushProvider>
                <ToastProvider>
                  {/* Header */}
                  <Navbar />

                  <main className="min-h-[calc(100vh-4rem)] pb-32 md:pb-0">
                    {children}
                  </main>

                  {/* Footer with Movie Collage Background */}
                  <footer className="relative mt-12 mb-32 md:mb-0 overflow-hidden">
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/premium-ad/slider-bg.webp')" }}
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-[#0d1b2a]/90" />

                    {/* Content */}
                    <div className="relative z-10 py-16">
                      <div className="container mx-auto px-4 text-center">
                        {/* Logo */}
                        <div className="flex items-center justify-center gap-3 mb-6">
                          <Image
                            src="/img/logo/icon-fanbroj.png"
                            alt="Fanbroj"
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                          <Image
                            src="/img/logo/fanproj-logo.png"
                            alt="Fanbroj TV"
                            width={140}
                            height={40}
                            className="object-contain"
                          />
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-8 py-4 border-y border-[#333333]/50">
                          <Link href="/" className="text-sm font-bold text-white hover:text-[#E50914] transition-colors uppercase">Home</Link>
                          <Link href="/about" className="text-sm font-bold text-white hover:text-[#E50914] transition-colors uppercase">About</Link>
                          <Link href="/ciyaar" className="text-sm font-bold text-white hover:text-[#9AE600] transition-colors uppercase">Ciyaaraha</Link>
                          <Link href="/movies" className="text-sm font-bold text-white hover:text-[#E50914] transition-colors uppercase">Hindi AF Somali</Link>
                          <Link href="/series" className="text-sm font-bold text-white hover:text-[#DC2626] transition-colors uppercase">Musalsal</Link>
                          <Link href="/live" className="text-sm font-bold text-white hover:text-[#3B82F6] transition-colors uppercase">Fanbroj TV</Link>
                          <Link href="/pricing" className="text-sm font-bold text-[#E50914] hover:text-[#E50914]/80 transition-colors uppercase">Premium</Link>
                        </nav>

                        {/* Apps Section */}
                        <div className="flex flex-col items-center gap-4 mb-8">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Download Apps</span>
                          <div className="flex gap-6">
                            <Link href="/apps/android" aria-label="Download Android App" className="group flex flex-col items-center gap-2">
                              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl group-hover:bg-[#9AE600]/20 group-hover:text-[#9AE600] transition-all border border-white/10 group-hover:border-[#9AE600]/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">Android</span>
                            </Link>
                            <Link href="/apps/ios" aria-label="Download iOS App" className="group flex flex-col items-center gap-2">
                              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl group-hover:bg-[#E50914]/20 group-hover:text-[#E50914] transition-all border border-white/10 group-hover:border-[#E50914]/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" /><path d="M10 2c1 .5 2 2 2 5" /></svg>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">iOS</span>
                            </Link>
                            <Link href="/apps/tv" aria-label="Get Smart TV App" className="group flex flex-col items-center gap-2">
                              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl group-hover:bg-[#3B82F6]/20 group-hover:text-[#3B82F6] transition-all border border-white/10 group-hover:border-[#3B82F6]/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">Smart TV</span>
                            </Link>
                          </div>
                        </div>

                        {/* Tagline */}
                        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                          Halkani waa hoyga taageerayaasha ciyaaraha ee Soomaaliyeed. Waxaan idiin soo gudbinnaa ciyaaraha ugu xiisaha badan dunida.
                        </p>

                        {/* Copyright */}
                        <p className="text-gray-500 text-xs">
                          © {new Date().getFullYear()} Fanbroj.net. Dhamaan xuquuqda waa dhowran tahay.
                        </p>
                      </div>
                    </div>
                  </footer>

                  <BottomNav />
                  <NotificationOptIn />
                  <ConnectionIndicator />
                  <div className="fixed bottom-24 md:bottom-8 right-4 z-40">
                    <WhatsAppButton showLabel={false} className="w-14 h-14 p-0 flex items-center justify-center rounded-full" />
                  </div>
                </ToastProvider>
              </PushProvider>
            </UserProvider>
          </LanguageProvider>
        </ConvexClientProvider>

        {/* Histats.com  START  (aync)*/}
        <Script id="histats" strategy="afterInteractive">
          {`var _Hasync= _Hasync|| [];
_Hasync.push(['Histats.start', '1,5003254,4,0,0,0,00010000']);
_Hasync.push(['Histats.fasi', '1']);
_Hasync.push(['Histats.track_hits', '']);
(function() {
var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
hs.src = ('//s10.histats.com/js15_as.js');
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
})();`}
        </Script>
        <noscript>
          <a href="/" target="_blank">
            <img src="//sstatic1.histats.com/0.gif?5003254&101" alt="free tracking" style={{ border: 0 }} />
          </a>
        </noscript>
        {/* Histats.com  END  */}
      </body>
    </html>
  );
}
