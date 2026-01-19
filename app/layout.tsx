import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { UserProvider } from "@/providers/UserProvider";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daawo Ciyaar Live Maanta | Fanbroj.net – Kubadda Cagta",
  description: "Fanbroj waa halka aad kala socon karto ciyaaraha tooska ah (live), ciyaaraha maanta, iyo wararka kubadda cagta. Daawo Premier League, Champions League iyo ciyaaro kale.",
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
                </nav>
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
