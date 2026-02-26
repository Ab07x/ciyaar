import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SWRProvider } from "@/providers/SWRProvider";
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

import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ConnectionIndicator } from "@/components/mobile/OfflineIndicator";
import { FreeTrialBanner } from "@/components/FreeTrialBanner";
import { AggressivePushBanner } from "@/components/AggressivePushBanner";
import { SitewideOfferBar } from "@/components/SitewideOfferBar";
import { LayoutChrome } from "@/components/LayoutChrome";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

// SEO-optimized metadata targeting top Google Search Console keywords
export function generateMetadata(): Metadata {
  const siteName = "Fanbroj";
  const title = "Fanbroj - Daawo Filimada Hindi Af Somali Cusub 2026 | Aflaam & Musalsal Bilaash Ah";
  const description = "Fanbroj.net - Daawo filimada Hindi Af Somali cusub 2026 oo dhamaystiran. Streamnxt Fanproj, Saafi Films, Mysomali, Musalsal Turkish Af Somali. Ku daawo bilaash ah!";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://fanbroj.net"),
    title: {
      default: title,
      template: `%s | Fanbroj - Hindi Af Somali`,
    },
    description,
    keywords: [
      // Brand keywords (highest volume from GSC)
      "fanbroj", "fanproj", "fanprojnet", "fanproj nxt", "streamnxt fanproj", "fanbaroj",
      "fanproj net", "fanprojnxt", "fanbroj net",
      // Content keywords (top search volume)
      "hindi af somali", "film hindi af somali", "filim hindi afsomali",
      "musalsal af somali", "saafi films", "mysomali",
      "astaan films hindi af somali", "hindi af somali cusub", "zee films",
      // Year-specific keywords (trending)
      "hindi af somali cusub 2026", "fanproj afsomali 2026", "filim hindi afsomali 2026",
      "hindi af somali cusub 2025", "fanproj afsomali 2025", "filim hindi afsomali 2025",
      // Long-tail content keywords
      "daawo filim af somali", "daawo online", "filimada hindi af somali",
      "musalsal turkish af somali", "musalsal hindi af somali cusub",
      "bollywood af somali", "somali movies", "hindi dubbed somali",
      // Platform keywords
      "fanproj play", "fanproj tv", "fanproj films", "fanproj aflaam",
      "streamnxt", "fanproj nxt af somali", "ciyaar live",
    ],
    authors: [{ name: "Fanbroj Team" }],
    creator: siteName,
    publisher: "Fanbroj (Fanbroj.net)",
    openGraph: {
      type: "website",
      locale: "so_SO",
      url: "https://fanbroj.net",
      title: title,
      description,
      siteName: "Fanbroj",
      images: [
        {
          url: "/og-preview.png",
          width: 1200,
          height: 630,
          alt: "Fanbroj - Daawo Filimada Hindi Af Somali Cusub 2026 | Aflaam & Musalsal",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description,
      images: ["/og-preview.png"],
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/icon-192.png",
      other: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          url: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          url: "/favicon-16x16.png",
        },
      ],
    },
    manifest: "/manifest.json",
    alternates: {
      canonical: "https://fanbroj.net",
    },
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
    verification: {
      google: "5Sr4jg6B9yKRWgCpSaAUTSJyMFgcPkIo1aoERkJO9Xc",
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

        {/* JSON-LD Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://fanbroj.net/#organization",
                  name: "Fanbroj",
                  // All brand variants people search — helps Google match all misspellings to this entity
                  alternateName: [
                    "Fanproj", "Fanproj NXT", "FanprojNXT", "Fanprojnxt",
                    "Fanproj TV", "Fanproj Play", "Fanproj Net", "Fanprojnet",
                    "Fanbaroj", "Fanparoj", "Faanproj", "Fanbroj TV",
                    "Fanproj Af Somali", "Fanbroj Af Somali",
                    "Stream NXT", "StreamNXT", "Mysomali", "Saafi Films",
                  ],
                  url: "https://fanbroj.net",
                  logo: "https://fanbroj.net/icon-512.png",
                  description: "Fanbroj - Goobta ugu weyn ee lagu daawo filimaha Hindi Af Somali cusub 2026, Astaan Films, Saafi Films, Mysomali iyo ciyaaraha live.",
                  sameAs: ["https://www.facebook.com/fanprojneet/"],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://fanbroj.net/#website",
                  url: "https://fanbroj.net",
                  name: "Fanbroj - Filimada Hindi Af Somali Cusub 2026",
                  alternateName: ["Fanproj", "Fanprojnet", "Streamnxt Fanproj"],
                  publisher: { "@id": "https://fanbroj.net/#organization" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: "https://fanbroj.net/search?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "WebPage",
                  "@id": "https://fanbroj.net/#webpage",
                  url: "https://fanbroj.net",
                  name: "Fanbroj - Daawo Filimada Hindi Af Somali Cusub 2026 | Aflaam & Musalsal Bilaash Ah",
                  isPartOf: { "@id": "https://fanbroj.net/#website" },
                  about: { "@id": "https://fanbroj.net/#organization" },
                  description: "Fanbroj.net - Daawo filimada Hindi Af Somali cusub 2026 oo dhamaystiran. Streamnxt Fanproj, Saafi Films, Mysomali, Musalsal Turkish Af Somali. Ku daawo bilaash ah!",
                },
              ],
            }),
          }}
        />

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
        <SWRProvider>
          <LanguageProvider>
            <UserProvider>
              <PushProvider>
                <ToastProvider>
                  {/* Header */}
                  <Navbar />
                  <LayoutChrome><SitewideOfferBar /></LayoutChrome>

                  <main className="min-h-[calc(100vh-4rem)] pb-32 md:pb-0">
                    {children}
                  </main>

                  {/* Footer with Movie Collage Background */}
                  <LayoutChrome>
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
                        <div className="flex items-center justify-center mb-6">
                          <Image
                            src="/img/logo/FANPROJ LOGO- footor.png"
                            alt="Fanbroj TV"
                            width={200}
                            height={60}
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
                          <Link href="/tags" className="text-sm font-bold text-white hover:text-[#E50914] transition-colors uppercase">Tags</Link>
                          <Link href="/pricing" className="text-sm font-bold text-[#E50914] hover:text-[#E50914]/80 transition-colors uppercase">Premium</Link>
                          <Link href="/pay?auth=signup" className="text-sm font-bold text-white hover:text-[#3B82F6] transition-colors uppercase">Sign Up</Link>
                          <Link href="/login" className="text-sm font-bold text-white hover:text-[#3B82F6] transition-colors uppercase">Login</Link>
                          <Link href="/pay" className="text-sm font-bold text-white hover:text-[#9AE600] transition-colors uppercase">Pay</Link>
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

                        {/* Popular Categories - Internal Linking for SEO */}
                        <div className="mb-8">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Popular Categories</h3>
                          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
                            <Link href="/tags/hindi-af-somali" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Hindi Af Somali</Link>
                            <Link href="/tags/bollywood" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Bollywood</Link>
                            <Link href="/tags/turkish" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Turkish</Link>
                            <Link href="/tags/action" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Action</Link>
                            <Link href="/tags/drama" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Drama</Link>
                            <Link href="/tags/romance" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Romance</Link>
                            <Link href="/tags/comedy" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Comedy</Link>
                            <Link href="/tags/thriller" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Thriller</Link>
                            <Link href="/tags/korean" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Korean</Link>
                            <Link href="/tags/astaan-films" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Astaan Films</Link>
                            <Link href="/tags/saafi-films" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Saafi Films</Link>
                            <Link href="/movies" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Filimada Cusub</Link>
                            <Link href="/series" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Musalsal Cusub</Link>
                            <Link href="/ciyaar" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Ciyaar Live</Link>
                            <Link href="/live" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">Live TV</Link>
                            <Link href="/tags" className="text-[11px] text-gray-500 hover:text-white bg-white/5 px-2.5 py-1 rounded-full transition-colors">All Tags</Link>
                          </div>
                        </div>

                        {/* SEO-rich Tagline */}
                        <p className="text-gray-400 text-sm max-w-2xl mx-auto mb-4">
                          Fanbroj (Fanproj) waa goobta ugu weyn ee lagu daawo filimaha Hindi Af Somali cusub 2026, filim hindi afsomali, musalsal af somali, Saafi Films, Mysomali, Astaan Films iyo ciyaaraha live. Streamnxt Fanproj – dhammaantood hal goobtaa ku daawo bilaash.
                        </p>
                        <p className="text-gray-500 text-xs max-w-xl mx-auto mb-6">
                          Hindi Af Somali Cusub 2026 | Filim Hindi Afsomali | Film Hindi Af Somali | Musalsal Af Somali | Saafi Films | Mysomali | Zee Films | Streamnxt Fanproj | Fanbroj
                        </p>

                        {/* Copyright */}
                        <p className="text-gray-500 text-xs">
                          &copy; {new Date().getFullYear()} Fanbroj.net (Fanproj). Dhamaan xuquuqda waa dhowran tahay.
                        </p>
                      </div>
                    </div>
                  </footer>
                  </LayoutChrome>

                  <LayoutChrome>
                    <BottomNav />
                    <AggressivePushBanner />
                    <FreeTrialBanner />
                    <ConnectionIndicator />
                    <div className="fixed bottom-24 md:bottom-8 right-4 z-40">
                      <WhatsAppButton showLabel={false} className="w-14 h-14 p-0 flex items-center justify-center rounded-full" />
                    </div>
                  </LayoutChrome>
                </ToastProvider>
              </PushProvider>
            </UserProvider>
          </LanguageProvider>
        </SWRProvider>

        {/* Google Analytics 4 */}
        <GoogleAnalytics />

        {/* Meta Pixel Code */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '953507847337368');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=953507847337368&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}

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
