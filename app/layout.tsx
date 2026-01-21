import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { UserProvider } from "@/providers/UserProvider";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://fanbroj.net"),
  title: {
    default: "Daawo Ciyaar Live Maanta | Fanbroj.net - Kubadda Cagta & Filimaan",
    template: "%s | Fanbroj.net",
  },
  description:
    "Fanbroj waa halka aad kala socon karto ciyaaraha tooska ah (live), ciyaaraha maanta, iyo wararka kubadda cagta. Daawo Premier League, Champions League, iyo filimaan af Soomaali ah.",
  keywords: [
    "ciyaar live",
    "kubadda cagta",
    "daawo ciyaar",
    "fanbroj",
    "filim af soomaali",
    "musalsal af soomaali",
    "somali streaming",
    "premier league live",
  ],
  authors: [{ name: "Fanbroj Team" }],
  creator: "Fanbroj",
  publisher: "Fanbroj",
  openGraph: {
    type: "website",
    locale: "so_SO",
    url: "https://fanbroj.net",
    title: "Daawo Ciyaar Live Maanta | Fanbroj.net",
    description:
      "Fanbroj waa halka aad kala socon karto ciyaaraha tooska ah (live), ciyaaraha maanta, iyo wararka kubadda cagta.",
    siteName: "Fanbroj",
    images: [
      {
        url: "/og-image.jpg", // We need to ensure this image exists or create a dynamic one
        width: 1200,
        height: 630,
        alt: "Fanbroj - Ciyaaraha & Madadaalada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fanbroj.net - Kubadda Cagta & Filimaan",
    description: "Daawo ciyaaraha tooska ah iyo filimaanta af Soomaaliga.",
    creator: "@fanbroj",
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
  alternates: {
    canonical: "./",
  },
  verification: {
    google: "google-site-verification-placeholder", // User needs to provide this or we generate it later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="so" suppressHydrationWarning>
      <head>
        {/* Sports/Gaming Typography - Russo One (headings) + Chakra Petch (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Russo+One&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased bg-stadium-dark text-text-primary min-h-screen"
      >
        <ConvexClientProvider>
          <UserProvider>
            {/* Header */}
            <Navbar />

            <main className="min-h-[calc(100vh-4rem)]">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border-strong py-12 mt-12 bg-stadium-elevated">
              <div className="container mx-auto px-4 text-center">
                <p className="text-2xl font-black tracking-tighter mb-4">
                  FAN<span className="text-accent-green">BROJ</span>
                </p>
                <p className="text-text-muted text-sm max-w-md mx-auto mb-8">
                  Halkani waa hoyga taageerayaasha ciyaaraha ee Soomaaliyeed. Waxaan idiin soo gudbinnaa ciyaaraha ugu xiisaha badan dunida.
                </p>
                <nav className="flex flex-wrap justify-center items-center gap-6 mb-8">
                  <Link href="/" className="text-sm font-bold hover:text-accent-green transition-colors">HOME</Link>
                  <Link href="/ciyaar" className="text-sm font-bold hover:text-accent-green transition-colors">CIYAARAHA</Link>

                  {/* Footer specific links matching dropdown */}
                  <Link href="/movies" className="text-sm font-bold hover:text-accent-green transition-colors">HINDI AF SOMALI</Link>
                  <Link href="/series" className="text-sm font-bold hover:text-accent-green transition-colors">MUSALSAL</Link>
                  <Link href="/live" className="text-sm font-bold hover:text-accent-green transition-colors">FANPROJ TV</Link>

                  <Link href="/blog" className="text-sm font-bold hover:text-accent-green transition-colors">WARARKA</Link>
                  <Link href="/pricing" className="text-sm font-bold text-accent-gold hover:text-accent-gold/80 transition-colors">PREMIUM</Link>
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
          </UserProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
