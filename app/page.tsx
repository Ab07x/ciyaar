"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MatchCard } from "@/components/MatchCard";
import { AdSlot } from "@/components/AdSlot";
import Link from "next/link";
import { PlayCircle, Calendar, Clock, Crown, ChevronRight, Newspaper } from "lucide-react";
import { BlogCard } from "@/components/BlogCard";

export default function HomePage() {
  const matchData = useQuery(api.matches.getMatchesByStatus);
  const posts = useQuery(api.posts.listPosts, { isPublished: true, limit: 3 });
  const settings = useQuery(api.settings.getSettings);

  if (!matchData || !posts) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div></div>;

  const { live, upcoming, finished, premium } = matchData;

  const Section = ({ title, icon: Icon, color, children, count, link }: any) => (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={20} /></div>
          <h2 className="text-xl md:text-2xl font-black">{title}</h2>
          {count > 0 && <span className="text-xs bg-stadium-hover px-2 py-1 rounded-full text-text-muted">{count}</span>}
        </div>
        {link && <Link href={link} className="text-sm text-accent-green flex items-center gap-1">Dhamaan<ChevronRight size={16} /></Link>}
      </div>
      {children}
    </section>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-stadium-elevated to-[#1a2758] rounded-3xl p-8 md:p-12 mb-12 border border-border-strong">
        <h1 className="text-3xl md:text-5xl font-black mb-4">DAAWO <span className="text-accent-green">CIYAAR</span> LIVE</h1>
        <p className="text-text-secondary text-lg mb-6 max-w-xl">Ciyaaraha ugu xiisaha badan dunida, HD quality, ad-free</p>
        <div className="flex gap-4">
          <Link href="/pricing" className="bg-accent-gold text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">PREMIUM</Link>
          <Link href="#live" className="bg-stadium-hover px-6 py-3 rounded-xl font-bold border border-border-subtle hover:border-accent-green transition-colors">Daawo Hadda</Link>
        </div>
      </div>

      <AdSlot slotKey="home_top" className="mb-12" />

      {/* Live Now */}
      <Section title="LIVE HADA" icon={PlayCircle} color="bg-accent-red/20 text-accent-red" count={live.length}>
        {live.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{live.map((m: any) => <MatchCard key={m._id} {...m} />)}</div>
        ) : (
          <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 text-center"><p className="text-text-muted">Ma jiraan ciyaaro hadda socda. Eeg kuwa soo socda.</p></div>
        )}
      </Section>

      {/* Upcoming */}
      <Section title="KUWA SOO SOCDA" icon={Calendar} color="bg-accent-green/20 text-accent-green" count={upcoming.length} link="/ciyaar">
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{upcoming.slice(0, 6).map((m: any) => <MatchCard key={m._id} {...m} />)}</div>
        ) : (
          <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 text-center"><p className="text-text-muted">Jadwalka cusub ayaa soo soconaya dhowaan.</p></div>
        )}
      </Section>

      {/* News Section */}
      <Section title="WARARKA UGU DAMBEEYA" icon={Newspaper} color="bg-blue-500/20 text-blue-400" count={posts.length} link="/blog">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => <BlogCard key={post._id} post={post} />)}
          </div>
        ) : (
          <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 text-center">
            <p className="text-text-muted">Ma jiraan warar cusub hadda.</p>
          </div>
        )}
      </Section>

      <AdSlot slotKey="home_middle" className="mb-12" />

      {/* Premium */}
      {premium.length > 0 && (
        <Section title="PREMIUM" icon={Crown} color="bg-accent-gold/20 text-accent-gold" count={premium.length} link="/pricing">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{premium.slice(0, 3).map((m: any) => <MatchCard key={m._id} {...m} />)}</div>
        </Section>
      )}

      {/* Finished */}
      <Section title="CIYAARAHA HORE" icon={Clock} color="bg-text-muted/20 text-text-muted" count={finished.length}>
        {finished.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{finished.slice(0, 3).map((m: any) => <MatchCard key={m._id} {...m} />)}</div>
        ) : (
          <div className="bg-stadium-elevated border border-border-strong rounded-2xl p-8 text-center"><p className="text-text-muted">Wax ciyaaro hore ah ma jiraan.</p></div>
        )}
      </Section>
    </div>
  );
}
