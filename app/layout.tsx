import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { UserProvider } from "@/providers/UserProvider";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { ToastProvider } from "@/providers/ToastProvider";
import { PremiumFooterPromo } from "@/components/PremiumFooterPromo";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function generateMetadata(): Promise<Metadata> {
  let settings: any = null;

  try {
    const settingsData = await fetchQuery(api.settings.getSettings);
    settings = settingsData;
  } catch (error) {
    // Fallback when Convex is unreachable (build time, network issues)
    console.warn("Failed to fetch settings for metadata:", error);
  }

  const siteName = settings?.siteName || "Fanbroj";
  const title = settings?.seoTagline ? `${siteName} | ${settings.seoTagline}` : `${siteName} - Daawo Ciyaar Live & Filimaan`;
  const description = settings?.seoDescription || "Fanbroj waa halka aad kala socon karto ciyaaraha tooska ah (live), ciyaaraha maanta, iyo wararka kubadda cagta.";
  const keywords = settings?.seoKeywords?.split(",").map((k: string) => k.trim()) || ["ciyaar live", "somali", "kubadda cagta"];

  return {
    metadataBase: new URL("https://fanbroj.net"),
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
          url: settings?.ogImage || settings?.logoUrl || "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${siteName} - Ciyaaraha & Madadaalada`,
        },
      ],
    },
    icons: {
      icon: settings?.faviconUrl || "/favicon.ico",
      shortcut: settings?.faviconUrl || "/favicon.ico",
      apple: settings?.logoUrl || "/apple-touch-icon.png",
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
      google: settings?.googleVerification || undefined,
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
        {/* Stadium Noir Typography - Outfit (Display) + Inter (Body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased bg-[var(--bg-primary)] text-[var(--color-text-primary)] min-h-screen"
      >
        <ConvexClientProvider>
          <UserProvider>
            <ToastProvider>
              {/* Header */}
              <Navbar />

              <main className="min-h-[calc(100vh-4rem)] pb-32 md:pb-0">
                {children}
              </main>

              {/* Footer */}
              <footer className="border-t border-[var(--glass-border)] py-12 mt-12 bg-[var(--bg-elevated)] mb-32 md:mb-0">
                <div className="container mx-auto px-4 text-center">
                  <p className="text-2xl font-black tracking-tighter mb-4">
                    FAN<span className="text-accent-green">BROJ</span>
                  </p>
                  <p className="text-text-muted text-sm max-w-md mx-auto mb-8">
                    Halkani waa hoyga taageerayaasha ciyaaraha ee Soomaaliyeed. Waxaan idiin soo gudbinnaa ciyaaraha ugu xiisaha badan dunida.
                  </p>
                  <nav className="flex flex-wrap justify-center items-center gap-6 mb-8">
                    <Link href="/" className="text-sm font-bold hover:text-accent-green transition-colors">HOME</Link>
                    <Link href="/about" className="text-sm font-bold hover:text-accent-green transition-colors">ABOUT</Link>
                    <Link href="/ciyaar" className="text-sm font-bold hover:text-accent-green transition-colors">CIYAARAHA</Link>

                    {/* Footer specific links matching dropdown */}
                    <Link href="/movies" className="text-sm font-bold hover:text-accent-green transition-colors">HINDI AF SOMALI</Link>
                    <Link href="/series" className="text-sm font-bold hover:text-accent-green transition-colors">MUSALSAL</Link>
                    <Link href="/live" className="text-sm font-bold hover:text-accent-green transition-colors">FANPROJ TV</Link>

                    <Link href="/blog" className="text-sm font-bold hover:text-accent-green transition-colors">WARARKA</Link>
                    <Link href="/pricing" className="text-sm font-bold text-accent-gold hover:text-accent-gold/80 transition-colors">PREMIUM</Link>
                  </nav>

                  {/* Apps Section */}
                  <div className="flex flex-col items-center gap-4 mb-8 p-6 bg-stadium-dark rounded-2xl border border-white/5 max-w-lg mx-auto">
                    <span className="text-xs font-black text-text-secondary uppercase tracking-widest">Download Apps</span>
                    <div className="flex gap-6">
                      <Link href="/apps/android" aria-label="Download Android App" className="group flex flex-col items-center gap-2">
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-accent-green/20 group-hover:text-accent-green transition-all border border-transparent group-hover:border-accent-green/20">
                          {/* Icon placeholder - using generic SVG since lucide imports might not be at top level context correctly if strictly replacing block */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted group-hover:text-white transition-colors">Android</span>
                      </Link>
                      <Link href="/apps/ios" aria-label="Download iOS App" className="group flex flex-col items-center gap-2">
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-white/20 group-hover:text-white transition-all border border-transparent group-hover:border-white/20">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="2" rx="2" /><path d="M10 20.4C8 22 4 21.8 2 20c.5-1.4 3-2 3-2a4 4 0 0 0 6 0s2.5.6 3 2c-2 1.8-6 2-8 .4" /></svg>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted group-hover:text-white transition-colors">iOS</span>
                      </Link>
                      <Link href="/apps/tv" aria-label="Get Smart TV App" className="group flex flex-col items-center gap-2">
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-accent-blue/20 group-hover:text-accent-blue transition-all border border-transparent group-hover:border-accent-blue/20">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted group-hover:text-white transition-colors">Smart TV</span>
                      </Link>
                    </div>
                  </div>
                  <p className="text-text-muted text-xs">
                    © {new Date().getFullYear()} Fanbroj.net. Dhamaan xuquuqda waa dhowran tahay.
                  </p>
                </div>
              </footer>

              <BottomNav />
              <PremiumFooterPromo />
            </ToastProvider>
          </UserProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
