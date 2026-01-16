import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { UserProvider } from "@/providers/UserProvider";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fanbroj - DAAWO CIYAAR LIVE",
  description: "Somali Live Sports Streaming Platform - Daawo ciyaaraha ugu xiisaha badan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="so" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stadium-dark text-text-primary min-h-screen`}
      >
        <ConvexClientProvider>
          <UserProvider>
            {/* Header */}
            <header className="bg-[#121c4a] border-b border-border-strong sticky top-0 z-50">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl font-black tracking-tighter text-white">
                  FAN<span className="text-accent-green">BROJ</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                  <Link href="/" className="text-sm font-bold hover:text-accent-green transition-colors">HOME</Link>
                  <Link href="/ciyaar" className="text-sm font-bold hover:text-accent-green transition-colors">CIYAARAHA</Link>
                  <Link href="/blog" className="text-sm font-bold hover:text-accent-green transition-colors">WARARKA</Link>
                  <Link href="/pricing" className="text-sm font-bold text-accent-gold hover:text-accent-gold/80 transition-colors">PREMIUM</Link>
                </nav>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block w-48 lg:w-64">
                    <SearchBox />
                  </div>
                  <Link
                    href="/pricing"
                    className="bg-accent-gold text-black px-4 py-2 rounded-md font-bold text-sm hover:scale-105 transition-transform"
                  >
                    PREMIUM
                  </Link>
                </div>
              </div>
            </header>

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
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  <Link href="/" className="text-sm text-text-secondary hover:text-white">Home</Link>
                  <Link href="/ciyaar" className="text-sm text-text-secondary hover:text-white">Ciyaaraha</Link>
                  <Link href="/blog" className="text-sm text-text-secondary hover:text-white">Wararka</Link>
                  <Link href="/pricing" className="text-sm text-text-secondary hover:text-white">Premium</Link>
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
