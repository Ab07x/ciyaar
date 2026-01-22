FANBROJ (CIYAAR) — Complete Development Documentation
The Premier Somali Entertainment & Sports Streaming Platform
Netflix meets ESPN, built for East Africa
Table of Contents
Executive Vision
Architecture Overview
Tech Stack Deep Dive
Design System — "Stadium Dark"
Database Schema & Convex Models
Feature Modules
API Integrations
Mobile Architecture (Expo)
Admin Dashboard
Performance & Optimization
Monetization System
Deployment & Infrastructure
Development Workflow
Future Roadmap
1. Executive Vision1.1 Mission StatementFanbroj is Somalia's first unified entertainment super-app, consolidating live football, Somali-dubbed content (Musalsal), and short-form video discovery into a single, culturally-resonant platform optimized for East African networks.1.2 Core Value PropositionsPillarDescriptionLive SportsReal-time football matches with HLS streaming, live scores, and community chatVOD LibraryPremium Somali-dubbed movies and series with progress trackingCiyaarSnapsTikTok-style vertical video discovery for highlights and viral contentOffline-FirstAggressive caching and low-bandwidth optimization for Somali networksCultural AuthenticityUI/UX designed specifically for Somali audience preferences1.3 Target Metrics┌─────────────────────────────────────────────────────────────┐
│  Monthly Active Users:     500K+ (Year 1 Target)           │
│  Average Session Duration: 45 minutes                       │
│  Concurrent Stream Limit:  50K viewers per match           │
│  Content Library:          1,000+ hours VOD                │
│  App Size Budget:          < 25MB (Android APK)            │
└─────────────────────────────────────────────────────────────┘2. Architecture Overview2.1 High-Level System Architecture┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                    │
├────────────────────────┬─────────────────────┬───────────────────────────┤
│    Next.js 15 Web      │    Expo Mobile      │    Smart TV Apps          │
│    (App Router)        │    (React Native)   │    (Future)               │
└────────────┬───────────┴──────────┬──────────┴────────────┬──────────────┘
             │                      │                       │
             ▼                      ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        CONVEX REAL-TIME LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Queries    │  │  Mutations  │  │  Actions    │  │  Subscriptions  │  │
│  │  (reads)    │  │  (writes)   │  │  (external) │  │  (live sync)    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
             │                      │                       │
             ▼                      ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATA & SERVICES                                   │
├─────────────────┬──────────────────┬──────────────────┬──────────────────┤
│  Convex DB      │  API-Football    │  CDN (Videos)    │  Auth Provider   │
│  (Real-time)    │  (Scores/Data)   │  (HLS Streams)   │  (Clerk/Custom)  │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘2.2 Directory Structurefanbroj/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                   # Main app routes
│   │   ├── page.tsx              # Homepage with CiyaarSnaps
│   │   ├── matches/              # Live matches hub
│   │   │   ├── page.tsx
│   │   │   └── [matchId]/
│   │   │       └── page.tsx      # Match detail + stream
│   │   ├── movies/               # VOD library
│   │   │   ├── page.tsx
│   │   │   └── [movieId]/
│   │   │       └── page.tsx
│   │   ├── series/               # Musalsal (TV series)
│   │   │   ├── page.tsx
│   │   │   └── [seriesId]/
│   │   │       ├── page.tsx
│   │   │       └── [episodeId]/
│   │   │           └── page.tsx
│   │   ├── snaps/                # CiyaarSnaps full-screen
│   │   │   └── page.tsx
│   │   ├── my-list/              # User's saved content
│   │   └── profile/
│   ├── admin/                    # Admin dashboard
│   │   ├── page.tsx              # Dashboard overview
│   │   ├── matches/
│   │   ├── content/
│   │   ├── ads/
│   │   ├── subscriptions/
│   │   └── analytics/
│   ├── api/                      # API routes
│   │   └── webhooks/
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── matches/                  # Match-specific components
│   │   ├── MatchCard.tsx
│   │   ├── LiveScoreBar.tsx
│   │   ├── MatchPlayer.tsx
│   │   └── LiveChat.tsx
│   ├── content/                  # VOD components
│   │   ├── ContentCarousel.tsx
│   │   ├── MovieCard.tsx
│   │   ├── EpisodeList.tsx
│   │   └── VideoPlayer.tsx
│   ├── snaps/                    # CiyaarSnaps components
│   │   ├── SnapsFeed.tsx
│   │   ├── SnapCard.tsx
│   │   └── SnapPlayer.tsx
│   └── admin/                    # Admin components
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── matches.ts                # Match queries/mutations
│   ├── content.ts                # VOD queries/mutations
│   ├── snaps.ts                  # CiyaarSnaps logic
│   ├── users.ts                  # User management
│   ├── subscriptions.ts          # Premium system
│   ├── ads.ts                    # Ad management
│   ├── sync.ts                   # External API sync
│   ├── _generated/               # Auto-generated types
│   └── crons.ts                  # Scheduled jobs
├── lib/                          # Utilities
│   ├── utils.ts
│   ├── constants.ts
│   ├── hooks/                    # Custom React hooks
│   └── validators/               # Zod schemas
├── styles/                       # Global styles
│   ├── globals.css
│   └── stadium-dark.css          # Design system tokens
├── public/                       # Static assets
│   ├── fonts/
│   └── images/
├── mobile/                       # Expo React Native app
│   ├── app/                      # Expo Router
│   ├── components/
│   ├── hooks/
│   └── app.json
├── scripts/                      # Utility scripts
├── tests/                        # Test suites
└── config files...3. Tech Stack Deep Dive3.1 Frontend FrameworkNext.js 15+ with App Routertypescript// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,                    // Partial Pre-rendering
    reactCompiler: true,          // React 19 Compiler
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.fanbroj.com' },
      { protocol: 'https', hostname: 'api-football.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;React 19 Features in Usetypescript// Using React 19's use() hook for data fetching
import { use } from 'react';

export default function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const match = use(fetchMatch(matchId));
  
  return <MatchDetail match={match} />;
}

// Server Actions for mutations
'use server';

export async function addToMyList(contentId: string) {
  const user = await getAuthUser();
  await convex.mutation(api.users.addToList, { userId: user.id, contentId });
  revalidatePath('/my-list');
}3.2 Convex Real-Time BackendWhy Convex?FeatureBenefit for FanbrojReal-time subscriptionsLive scores update without pollingAutomatic TypeScript typesEnd-to-end type safetyServerless functionsNo infrastructure managementBuilt-in file storageVideo thumbnails and assetsTransactional consistencyReliable subscription managementConvex Setuptypescript// convex/convex.config.ts
import { defineApp } from 'convex/server';

const app = defineApp();

app.use({
  functions: {
    // Rate limiting for live chat
    liveChatRateLimit: {
      kind: 'rate_limit',
      rate: 10,
      period: '1m',
    },
  },
});

export default app;3.3 TypeScript Configurationjson// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "lib": ["dom", "dom.iterable", "ES2023"],
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./components/*"],
      "@convex/*": ["./convex/*"],
      "@lib/*": ["./lib/*"]
    }
  }
}4. Design System — "Stadium Dark"4.1 Design PhilosophyFanbroj's visual language draws inspiration from the electric atmosphere of a night football match — dark backgrounds punctuated by vibrant accent colors, with glassmorphism creating depth and layers like stadium floodlights cutting through darkness.4.2 Color Palettecss/* styles/stadium-dark.css */

:root {
  /* ═══════════════════════════════════════════════════════
     BASE COLORS — The Stadium Night Sky
     ═══════════════════════════════════════════════════════ */
  
  --color-background-primary: #0A0A0B;      /* Deep black */
  --color-background-secondary: #121214;    /* Card backgrounds */
  --color-background-tertiary: #1A1A1D;     /* Elevated surfaces */
  --color-background-elevated: #242428;     /* Modals, dropdowns */
  
  /* ═══════════════════════════════════════════════════════
     ACCENT COLORS — Stadium Lights
     ═══════════════════════════════════════════════════════ */
  
  --color-primary: #22C55E;                 /* Pitch Green — Primary CTA */
  --color-primary-hover: #16A34A;
  --color-primary-muted: rgba(34, 197, 94, 0.15);
  
  --color-secondary: #EAB308;               /* Gold — Premium, highlights */
  --color-secondary-hover: #CA8A04;
  --color-secondary-muted: rgba(234, 179, 8, 0.15);
  
  --color-accent-red: #EF4444;              /* Live indicator, errors */
  --color-accent-blue: #3B82F6;             /* Links, info states */
  --color-accent-purple: #8B5CF6;           /* Special events */
  
  /* ═══════════════════════════════════════════════════════
     TEXT COLORS — Typography Hierarchy
     ═══════════════════════════════════════════════════════ */
  
  --color-text-primary: #FAFAFA;            /* High emphasis */
  --color-text-secondary: #A1A1AA;          /* Medium emphasis */
  --color-text-tertiary: #71717A;           /* Low emphasis */
  --color-text-disabled: #3F3F46;           /* Disabled states */
  
  /* ═══════════════════════════════════════════════════════
     BORDER & OVERLAY
     ═══════════════════════════════════════════════════════ */
  
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-strong: rgba(255, 255, 255, 0.2);
  
  --color-overlay-light: rgba(255, 255, 255, 0.05);
  --color-overlay-medium: rgba(0, 0, 0, 0.5);
  --color-overlay-heavy: rgba(0, 0, 0, 0.8);
  
  /* ═══════════════════════════════════════════════════════
     GLASSMORPHISM
     ═══════════════════════════════════════════════════════ */
  
  --glass-background: rgba(18, 18, 20, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
  
  /* ═══════════════════════════════════════════════════════
     GRADIENTS — Light Beams
     ═══════════════════════════════════════════════════════ */
  
  --gradient-primary: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  --gradient-gold: linear-gradient(135deg, #EAB308 0%, #CA8A04 100%);
  --gradient-dark: linear-gradient(180deg, #0A0A0B 0%, #121214 100%);
  --gradient-hero: linear-gradient(180deg, transparent 0%, #0A0A0B 100%);
  --gradient-card-shine: linear-gradient(
    115deg,
    transparent 0%,
    rgba(255, 255, 255, 0.03) 50%,
    transparent 100%
  );
}4.3 Typography Systemcss/* ═══════════════════════════════════════════════════════
   TYPOGRAPHY — Bold Headers, Clean Body
   ═══════════════════════════════════════════════════════ */

:root {
  /* Font Families */
  --font-display: 'Clash Display', 'SF Pro Display', system-ui, sans-serif;
  --font-body: 'Satoshi', 'SF Pro Text', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  
  /* Font Sizes — Fluid Typography */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
  --text-3xl: clamp(2rem, 1.5rem + 2.5vw, 3rem);
  --text-4xl: clamp(2.5rem, 2rem + 2.5vw, 4rem);
  --text-5xl: clamp(3rem, 2.5rem + 2.5vw, 5rem);
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  
  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Letter Spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}

/* Typography Classes */
.heading-hero {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: var(--font-extrabold);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
}

.heading-1 {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-2 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

.heading-3 {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

.body-large {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
}

.body-base {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

.body-small {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

.caption {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}4.4 Spacing & Layoutcss:root {
  /* ═══════════════════════════════════════════════════════
     SPACING SCALE — 4px Base Unit
     ═══════════════════════════════════════════════════════ */
  
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  
  /* ═══════════════════════════════════════════════════════
     LAYOUT CONTAINERS
     ═══════════════════════════════════════════════════════ */
  
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
  
  /* Content Width */
  --content-max-width: 1440px;
  --content-padding: clamp(var(--space-4), 5vw, var(--space-8));
  
  /* ═══════════════════════════════════════════════════════
     BORDER RADIUS
     ═══════════════════════════════════════════════════════ */
  
  --radius-none: 0;
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;
  
  /* ═══════════════════════════════════════════════════════
     Z-INDEX SCALE
     ═══════════════════════════════════════════════════════ */
  
  --z-behind: -1;
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-toast: 70;
  --z-tooltip: 80;
}4.5 Component PatternsGlass Card Componenttypescript// components/ui/GlassCard.tsx
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  className?: string;
  glow?: 'none' | 'primary' | 'gold';
}

export function GlassCard({ 
  children, 
  variant = 'default',
  glow = 'none',
  className 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        // Base glass effect
        'relative overflow-hidden rounded-xl',
        'bg-glass-background backdrop-blur-[20px]',
        'border border-glass-border',
        
        // Variants
        variant === 'elevated' && 'shadow-2xl shadow-black/50',
        variant === 'interactive' && [
          'transition-all duration-300 ease-out',
          'hover:scale-[1.02] hover:shadow-xl',
          'hover:border-white/20',
          'cursor-pointer',
        ],
        
        // Glow effects
        glow === 'primary' && 'ring-1 ring-primary/20 shadow-lg shadow-primary/10',
        glow === 'gold' && 'ring-1 ring-secondary/20 shadow-lg shadow-secondary/10',
        
        className
      )}
    >
      {/* Gradient shine overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
        }}
      />
      
      {children}
    </div>
  );
}Live Badge Componenttypescript// components/ui/LiveBadge.tsx
import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function LiveBadge({ size = 'md', pulse = true }: LiveBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        'bg-accent-red/20 text-accent-red font-semibold uppercase',
        'border border-accent-red/30',
        
        // Sizes
        size === 'sm' && 'px-2 py-0.5 text-[10px]',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm',
      )}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red" />
      </span>
      LIVE
    </div>
  );
}4.6 Animation Librarycss/* styles/animations.css */

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-bottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 20px 10px rgba(34, 197, 94, 0.2);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Utility Classes */
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}

.animate-fade-up {
  animation: fade-up 0.4s ease-out forwards;
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out forwards;
}

.animate-slide-in-bottom {
  animation: slide-in-bottom 0.4s ease-out forwards;
}

.animate-pulse-glow {
  animation: pulse-glow 2s infinite;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

/* Staggered Animations */
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }
.stagger-5 { animation-delay: 0.5s; }5. Database Schema & Convex Models5.1 Complete Schema Definitiontypescript// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ═══════════════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  
  users: defineTable({
    // Identity
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    
    // Profile
    preferredLanguage: v.optional(v.union(v.literal('so'), v.literal('en'), v.literal('ar'))),
    favoriteTeams: v.optional(v.array(v.string())),
    
    // Subscription
    subscriptionTier: v.union(
      v.literal('free'),
      v.literal('basic'),
      v.literal('premium'),
      v.literal('vip')
    ),
    subscriptionExpiresAt: v.optional(v.number()),
    
    // Activity tracking
    lastActiveAt: v.number(),
    totalWatchTimeMinutes: v.number(),
    
    // Admin
    role: v.union(v.literal('user'), v.literal('moderator'), v.literal('admin')),
    isBanned: v.boolean(),
    banReason: v.optional(v.string()),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email'])
    .index('by_username', ['username'])
    .index('by_subscription', ['subscriptionTier'])
    .index('by_role', ['role']),
  
  // ═══════════════════════════════════════════════════════════════
  // CONTENT — MOVIES & SERIES
  // ═══════════════════════════════════════════════════════════════
  
  movies: defineTable({
    // Basic Info
    title: v.string(),
    titleSomali: v.optional(v.string()),
    slug: v.string(),
    description: v.string(),
    descriptionSomali: v.optional(v.string()),
    
    // Media
    posterUrl: v.string(),
    backdropUrl: v.optional(v.string()),
    trailerUrl: v.optional(v.string()),
    videoUrl: v.string(),           // HLS m3u8 URL
    videoUrlBackup: v.optional(v.string()),
    
    // Metadata
    releaseYear: v.number(),
    durationMinutes: v.number(),
    genres: v.array(v.string()),
    tags: v.array(v.string()),
    
    // Ratings
    imdbRating: v.optional(v.number()),
    fanbrójRating: v.optional(v.number()),
    totalRatings: v.number(),
    
    // Access Control
    requiredTier: v.union(
      v.literal('free'),
      v.literal('basic'),
      v.literal('premium'),
      v.literal('vip')
    ),
    
    // Status
    status: v.union(v.literal('draft'), v.literal('published'), v.literal('archived')),
    isFeatured: v.boolean(),
    featuredOrder: v.optional(v.number()),
    
    // Analytics
    viewCount: v.number(),
    likeCount: v.number(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index('by_slug', ['slug'])
    .index('by_status', ['status'])
    .index('by_featured', ['isFeatured', 'featuredOrder'])
    .index('by_genre', ['genres'])
    .index('by_release_year', ['releaseYear'])
    .index('by_view_count', ['viewCount'])
    .searchIndex('search_movies', {
      searchField: 'title',
      filterFields: ['status', 'genres', 'requiredTier'],
    }),
  
  series: defineTable({
    // Basic Info
    title: v.string(),
    titleSomali: v.optional(v.string()),
    slug: v.string(),
    description: v.string(),
    descriptionSomali: v.optional(v.string()),
    
    // Media
    posterUrl: v.string(),
    backdropUrl: v.optional(v.string()),
    trailerUrl: v.optional(v.string()),
    
    // Metadata
    releaseYear: v.number(),
    genres: v.array(v.string()),
    tags: v.array(v.string()),
    totalSeasons: v.number(),
    totalEpisodes: v.number(),
    
    // Status
    status: v.union(v.literal('draft'), v.literal('ongoing'), v.literal('completed'), v.literal('archived')),
    isFeatured: v.boolean(),
    
    // Access
    requiredTier: v.union(
      v.literal('free'),
      v.literal('basic'),
      v.literal('premium'),
      v.literal('vip')
    ),
    
    // Analytics
    viewCount: v.number(),
    likeCount: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_status', ['status'])
    .index('by_featured', ['isFeatured'])
    .searchIndex('search_series', {
      searchField: 'title',
      filterFields: ['status', 'genres'],
    }),
  
  episodes: defineTable({
    seriesId: v.id('series'),
    
    // Episode Info
    seasonNumber: v.number(),
    episodeNumber: v.number(),
    title: v.string(),
    titleSomali: v.optional(v.string()),
    description: v.optional(v.string()),
    
    // Media
    thumbnailUrl: v.string(),
    videoUrl: v.string(),
    videoUrlBackup: v.optional(v.string()),
    durationMinutes: v.number(),
    
    // Status
    status: v.union(v.literal('draft'), v.literal('published')),
    publishedAt: v.optional(v.number()),
    
    // Analytics
    viewCount: v.number(),
    
    createdAt: v.number(),
  })
    .index('by_series', ['seriesId'])
    .index('by_series_season', ['seriesId', 'seasonNumber'])
    .index('by_series_episode', ['seriesId', 'seasonNumber', 'episodeNumber']),
  
  // ═══════════════════════════════════════════════════════════════
  // MATCHES — LIVE SPORTS
  // ═══════════════════════════════════════════════════════════════
  
  matches: defineTable({
    // External Reference
    externalId: v.string(),           // API-Football fixture ID
    externalSource: v.literal('api-football'),
    
    // Teams
    homeTeam: v.object({
      id: v.string(),
      name: v.string(),
      logo: v.string(),
      score: v.optional(v.number()),
    }),
    awayTeam: v.object({
      id: v.string(),
      name: v.string(),
      logo: v.string(),
      score: v.optional(v.number()),
    }),
    
    // Competition
    league: v.object({
      id: v.string(),
      name: v.string(),
      logo: v.string(),
      country: v.string(),
      round: v.optional(v.string()),
    }),
    
    // Timing
    kickoffTime: v.number(),
    status: v.union(
      v.literal('scheduled'),
      v.literal('live'),
      v.literal('halftime'),
      v.literal('finished'),
      v.literal('postponed'),
      v.literal('cancelled')
    ),
    matchMinute: v.optional(v.number()),
    
    // Streaming
    streamUrl: v.optional(v.string()),     // HLS m3u8
    streamType: v.optional(v.union(v.literal('hls'), v.literal('iframe'))),
    embedUrl: v.optional(v.string()),      // For iframe embeds
    
    // Access
    requiredTier: v.union(
      v.literal('free'),
      v.literal('basic'),
      v.literal('premium'),
      v.literal('vip')
    ),
    isFeatured: v.boolean(),
    
    // Analytics
    viewerCount: v.number(),
    peakViewerCount: v.number(),
    
    // Sync metadata
    lastSyncedAt: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_external_id', ['externalId'])
    .index('by_status', ['status'])
    .index('by_kickoff', ['kickoffTime'])
    .index('by_league', ['league.id'])
    .index('by_featured', ['isFeatured']),
  
  matchEvents: defineTable({
    matchId: v.id('matches'),
    
    eventType: v.union(
      v.literal('goal'),
      v.literal('own_goal'),
      v.literal('penalty'),
      v.literal('missed_penalty'),
      v.literal('yellow_card'),
      v.literal('red_card'),
      v.literal('substitution'),
      v.literal('var_decision'),
      v.literal('kickoff'),
      v.literal('halftime'),
      v.literal('fulltime')
    ),
    
    minute: v.number(),
    additionalMinute: v.optional(v.number()),
    
    team: v.union(v.literal('home'), v.literal('away')),
    player: v.optional(v.object({
      id: v.string(),
      name: v.string(),
    })),
    assistPlayer: v.optional(v.object({
      id: v.string(),
      name: v.string(),
    })),
    
    detail: v.optional(v.string()),
    
    createdAt: v.number(),
  })
    .index('by_match', ['matchId'])
    .index('by_match_time', ['matchId', 'minute']),
  
  // ═══════════════════════════════════════════════════════════════
  // CIYAARSNAPS — SHORT-FORM VIDEO
  // ═══════════════════════════════════════════════════════════════
  
  snaps: defineTable({
    // Creator
    creatorId: v.optional(v.id('users')),     // null for official content
    creatorType: v.union(v.literal('official'), v.literal('user')),
    
    // Content
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    videoUrl: v.string(),
    thumbnailUrl: v.string(),
    durationSeconds: v.number(),
    
    // Categorization
    category: v.union(
      v.literal('highlights'),
      v.literal('goals'),
      v.literal('skills'),
      v.literal('funny'),
      v.literal('news'),
      v.literal('behind_scenes'),
      v.literal('fan_content')
    ),
    tags: v.array(v.string()),
    relatedMatchId: v.optional(v.id('matches')),
    
    // Engagement
    viewCount: v.number(),
    likeCount: v.number(),
    shareCount: v.number(),
    commentCount: v.number(),
    
    // Status
    status: v.union(v.literal('processing'), v.literal('published'), v.literal('removed')),
    isFeatured: v.boolean(),
    featuredOrder: v.optional(v.number()),
    
    createdAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_category', ['category', 'status'])
    .index('by_featured', ['isFeatured', 'featuredOrder'])
    .index('by_creator', ['creatorId'])
    .index('by_match', ['relatedMatchId'])
    .index('by_trending', ['viewCount']),
  
  // ═══════════════════════════════════════════════════════════════
  // USER ACTIVITY & ENGAGEMENT
  // ═══════════════════════════════════════════════════════════════
  
  userWatchProgress: defineTable({
    userId: v.id('users'),
    
    // Content reference (one of these)
    movieId: v.optional(v.id('movies')),
    episodeId: v.optional(v.id('episodes')),
    matchId: v.optional(v.id('matches')),
    
    // Progress
    progressSeconds: v.number(),
    totalDurationSeconds: v.number(),
    progressPercent: v.number(),
    isCompleted: v.boolean(),
    
    lastWatchedAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_movie', ['userId', 'movieId'])
    .index('by_user_episode', ['userId', 'episodeId'])
    .index('by_user_match', ['userId', 'matchId'])
    .index('by_last_watched', ['userId', 'lastWatchedAt']),
  
  userLists: defineTable({
    userId: v.id('users'),
    
    // Content reference (one of these)
    movieId: v.optional(v.id('movies')),
    seriesId: v.optional(v.id('series')),
    
    listType: v.union(v.literal('watchlist'), v.literal('favorites')),
    
    addedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'listType'])
    .index('by_user_movie', ['userId', 'movieId'])
    .index('by_user_series', ['userId', 'seriesId']),
  
  snapLikes: defineTable({
    userId: v.id('users'),
    snapId: v.id('snaps'),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_snap', ['snapId'])
    .index('by_user_snap', ['userId', 'snapId']),
  
  // ═══════════════════════════════════════════════════════════════
  // LIVE CHAT
  // ═══════════════════════════════════════════════════════════════
  
  chatMessages: defineTable({
    matchId: v.id('matches'),
    userId: v.id('users'),
    
    content: v.string(),
    
    // Moderation
    isDeleted: v.boolean(),
    deletedBy: v.optional(v.id('users')),
    deletedReason: v.optional(v.string()),
    
    // Reactions
    reactionCounts: v.optional(v.object({
      fire: v.number(),
      goal: v.number(),
      laugh: v.number(),
      angry: v.number(),
    })),
    
    createdAt: v.number(),
  })
    .index('by_match', ['matchId', 'createdAt'])
    .index('by_user', ['userId']),
  
  chatReactions: defineTable({
    messageId: v.id('chatMessages'),
    userId: v.id('users'),
    reactionType: v.union(
      v.literal('fire'),
      v.literal('goal'),
      v.literal('laugh'),
      v.literal('angry')
    ),
    createdAt: v.number(),
  })
    .index('by_message', ['messageId'])
    .index('by_user_message', ['userId', 'messageId']),
  
  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS & PAYMENTS
  // ═══════════════════════════════════════════════════════════════
  
  redemptionCodes: defineTable({
    code: v.string(),
    
    tier: v.union(
      v.literal('basic'),
      v.literal('premium'),
      v.literal('vip')
    ),
    durationDays: v.number(),
    
    // Usage
    maxUses: v.number(),
    usedCount: v.number(),
    
    // Validity
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    
    // Tracking
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_active', ['isActive']),
  
  redemptions: defineTable({
    userId: v.id('users'),
    codeId: v.id('redemptionCodes'),
    
    tier: v.union(
      v.literal('basic'),
      v.literal('premium'),
      v.literal('vip')
    ),
    activatedAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_code', ['codeId']),
  
  // ═══════════════════════════════════════════════════════════════
  // ADVERTISING
  // ═══════════════════════════════════════════════════════════════
  
  adSlots: defineTable({
    name: v.string(),
    placement: v.union(
      v.literal('home_hero'),
      v.literal('home_banner'),
      v.literal('match_pre_roll'),
      v.literal('match_mid_roll'),
      v.literal('content_interstitial'),
      v.literal('snaps_between')
    ),
    
    // Creative
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    linkUrl: v.string(),
    
    // Targeting
    targetTiers: v.array(v.union(
      v.literal('free'),
      v.literal('basic'),
      v.literal('premium'),
      v.literal('vip')
    )),
    
    // Scheduling
    isActive: v.boolean(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    priority: v.number(),
    
    // Analytics
    impressionCount: v.number(),
    clickCount: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_placement', ['placement', 'isActive'])
    .index('by_priority', ['priority']),
  
  // ═══════════════════════════════════════════════════════════════
  // SYSTEM & ADMIN
  // ═══════════════════════════════════════════════════════════════
  
  syncLogs: defineTable({
    source: v.string(),
    operation: v.string(),
    status: v.union(v.literal('success'), v.literal('error'), v.literal('partial')),
    
    itemsProcessed: v.number(),
    itemsFailed: v.number(),
    
    errorMessage: v.optional(v.string()),
    errorDetails: v.optional(v.string()),
    
    startedAt: v.number(),
    completedAt: v.number(),
    durationMs: v.number(),
  })
    .index('by_source', ['source', 'startedAt'])
    .index('by_status', ['status']),
  
  systemSettings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id('users')),
  })
    .index('by_key', ['key']),
});5.2 Key Convex FunctionsMatch Queries with Real-time Updatestypescript// convex/matches.ts
import { query, mutation, action } from './_generated/server';
import { v } from 'convex/values';

// ═══════════════════════════════════════════════════════════════
// QUERIES — Real-time subscriptions
// ═══════════════════════════════════════════════════════════════

export const getLiveMatches = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_status', (q) => q.eq('status', 'live'))
      .order('desc')
      .take(20);
    
    return matches;
  },
});

export const getUpcomingMatches = query({
  args: {
    limit: v.optional(v.number()),
    leagueId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit ?? 10;
    
    let query = ctx.db
      .query('matches')
      .withIndex('by_kickoff')
      .filter((q) => 
        q.and(
          q.eq(q.field('status'), 'scheduled'),
          q.gt(q.field('kickoffTime'), now)
        )
      );
    
    const matches = await query.order('asc').take(limit);
    
    if (args.leagueId) {
      return matches.filter((m) => m.league.id === args.leagueId);
    }
    
    return matches;
  },
});

export const getMatchById = query({
  args: { matchId: v.id('matches') },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;
    
    // Get recent events
    const events = await ctx.db
      .query('matchEvents')
      .withIndex('by_match', (q) => q.eq('matchId', args.matchId))
      .order('desc')
      .take(50);
    
    return { ...match, events };
  },
});

export const getMatchWithStream = query({
  args: { 
    matchId: v.id('matches'),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;
    
    // Check user subscription for stream access
    let hasAccess = match.requiredTier === 'free';
    
    if (args.userId && !hasAccess) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        const tierHierarchy = { free: 0, basic: 1, premium: 2, vip: 3 };
        hasAccess = tierHierarchy[user.subscriptionTier] >= tierHierarchy[match.requiredTier];
      }
    }
    
    return {
      ...match,
      streamUrl: hasAccess ? match.streamUrl : null,
      embedUrl: hasAccess ? match.embedUrl : null,
      hasAccess,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// MUTATIONS — Database writes
// ═══════════════════════════════════════════════════════════════

export const updateMatchScore = mutation({
  args: {
    matchId: v.id('matches'),
    homeScore: v.number(),
    awayScore: v.number(),
    status: v.optional(v.union(
      v.literal('live'),
      v.literal('halftime'),
      v.literal('finished')
    )),
    matchMinute: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error('Match not found');
    
    await ctx.db.patch(args.matchId, {
      homeTeam: { ...match.homeTeam, score: args.homeScore },
      awayTeam: { ...match.awayTeam, score: args.awayScore },
      status: args.status ?? match.status,
      matchMinute: args.matchMinute,
      updatedAt: Date.now(),
    });
  },
});

export const addMatchEvent = mutation({
  args: {
    matchId: v.id('matches'),
    eventType: v.union(
      v.literal('goal'),
      v.literal('own_goal'),
      v.literal('penalty'),
      v.literal('missed_penalty'),
      v.literal('yellow_card'),
      v.literal('red_card'),
      v.literal('substitution'),
      v.literal('var_decision'),
      v.literal('kickoff'),
      v.literal('halftime'),
      v.literal('fulltime')
    ),
    minute: v.number(),
    team: v.union(v.literal('home'), v.literal('away')),
    playerName: v.optional(v.string()),
    playerId: v.optional(v.string()),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('matchEvents', {
      matchId: args.matchId,
      eventType: args.eventType,
      minute: args.minute,
      team: args.team,
      player: args.playerName && args.playerId ? {
        id: args.playerId,
        name: args.playerName,
      } : undefined,
      detail: args.detail,
      createdAt: Date.now(),
    });
    
    // If goal, update score
    if (['goal', 'penalty'].includes(args.eventType)) {
      const match = await ctx.db.get(args.matchId);
      if (match) {
        const scoreField = args.team === 'home' ? 'homeTeam' : 'awayTeam';
        const team = match[scoreField];
        await ctx.db.patch(args.matchId, {
          [scoreField]: { ...team, score: (team.score ?? 0) + 1 },
        });
      }
    }
  },
});

export const incrementViewerCount = mutation({
  args: { matchId: v.id('matches') },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return;
    
    const newCount = match.viewerCount + 1;
    await ctx.db.patch(args.matchId, {
      viewerCount: newCount,
      peakViewerCount: Math.max(match.peakViewerCount, newCount),
    });
  },
});

export const decrementViewerCount = mutation({
  args: { matchId: v.id('matches') },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return;
    
    await ctx.db.patch(args.matchId, {
      viewerCount: Math.max(0, match.viewerCount - 1),
    });
  },
});Content & VOD Functionstypescript// convex/content.ts
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ═══════════════════════════════════════════════════════════════
// MOVIE QUERIES
// ═══════════════════════════════════════════════════════════════

export const getFeaturedContent = query({
  args: {},
  handler: async (ctx) => {
    const [featuredMovies, featuredSeries] = await Promise.all([
      ctx.db
        .query('movies')
        .withIndex('by_featured', (q) => q.eq('isFeatured', true))
        .filter((q) => q.eq(q.field('status'), 'published'))
        .order('asc')
        .take(10),
      ctx.db
        .query('series')
        .withIndex('by_featured', (q) => q.eq('isFeatured', true))
        .filter((q) => q.neq(q.field('status'), 'archived'))
        .take(10),
    ]);
    
    return { movies: featuredMovies, series: featuredSeries };
  },
});

export const getMoviesByGenre = query({
  args: { 
    genre: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const movies = await ctx.db
      .query('movies')
      .filter((q) => 
        q.and(
          q.eq(q.field('status'), 'published'),
          // Array contains check
          q.or(
            ...Array.from({ length: 10 }, (_, i) => 
              q.eq(q.field(`genres.${i}` as any), args.genre)
            )
          )
        )
      )
      .order('desc')
      .take(limit);
    
    return movies;
  },
});

export const searchContent = query({
  args: { 
    query: v.string(),
    type: v.optional(v.union(v.literal('movie'), v.literal('series'), v.literal('all'))),
  },
  handler: async (ctx, args) => {
    const searchType = args.type ?? 'all';
    const results: { movies: any[]; series: any[] } = { movies: [], series: [] };
    
    if (searchType === 'all' || searchType === 'movie') {
      results.movies = await ctx.db
        .query('movies')
        .withSearchIndex('search_movies', (q) => 
          q.search('title', args.query).eq('status', 'published')
        )
        .take(20);
    }
    
    if (searchType === 'all' || searchType === 'series') {
      results.series = await ctx.db
        .query('series')
        .withSearchIndex('search_series', (q) =>
          q.search('title', args.query)
        )
        .filter((q) => q.neq(q.field('status'), 'archived'))
        .take(20);
    }
    
    return results;
  },
});

export const getMovieWithAccess = query({
  args: {
    movieId: v.id('movies'),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const movie = await ctx.db.get(args.movieId);
    if (!movie || movie.status !== 'published') return null;
    
    let hasAccess = movie.requiredTier === 'free';
    let watchProgress = null;
    
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        const tierHierarchy = { free: 0, basic: 1, premium: 2, vip: 3 };
        hasAccess = tierHierarchy[user.subscriptionTier] >= tierHierarchy[movie.requiredTier];
      }
      
      // Get watch progress
      watchProgress = await ctx.db
        .query('userWatchProgress')
        .withIndex('by_user_movie', (q) => 
          q.eq('userId', args.userId!).eq('movieId', args.movieId)
        )
        .first();
    }
    
    return {
      ...movie,
      videoUrl: hasAccess ? movie.videoUrl : null,
      hasAccess,
      watchProgress,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// WATCH PROGRESS
// ═══════════════════════════════════════════════════════════════

export const updateWatchProgress = mutation({
  args: {
    userId: v.id('users'),
    movieId: v.optional(v.id('movies')),
    episodeId: v.optional(v.id('episodes')),
    matchId: v.optional(v.id('matches')),
    progressSeconds: v.number(),
    totalDurationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const progressPercent = Math.round((args.progressSeconds / args.totalDurationSeconds) * 100);
    const isCompleted = progressPercent >= 90;
    
    // Find existing progress
    let existingProgress;
    if (args.movieId) {
      existingProgress = await ctx.db
        .query('userWatchProgress')
        .withIndex('by_user_movie', (q) => 
          q.eq('userId', args.userId).eq('movieId', args.movieId)
        )
        .first();
    } else if (args.episodeId) {
      existingProgress = await ctx.db
        .query('userWatchProgress')
        .withIndex('by_user_episode', (q) =>
          q.eq('userId', args.userId).eq('episodeId', args.episodeId)
        )
        .first();
    }
    
    const now = Date.now();
    
    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        progressSeconds: args.progressSeconds,
        progressPercent,
        isCompleted,
        lastWatchedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('userWatchProgress', {
        userId: args.userId,
        movieId: args.movieId,
        episodeId: args.episodeId,
        matchId: args.matchId,
        progressSeconds: args.progressSeconds,
        totalDurationSeconds: args.totalDurationSeconds,
        progressPercent,
        isCompleted,
        lastWatchedAt: now,
        updatedAt: now,
      });
    }
    
    // Update user's total watch time
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        totalWatchTimeMinutes: user.totalWatchTimeMinutes + Math.round(args.progressSeconds / 60),
        lastActiveAt: now,
      });
    }
  },
});

export const getContinueWatching = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query('userWatchProgress')
      .withIndex('by_last_watched', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('isCompleted'), false))
      .order('desc')
      .take(10);
    
    // Fetch associated content
    const results = await Promise.all(
      progress.map(async (p) => {
        if (p.movieId) {
          const movie = await ctx.db.get(p.movieId);
          return { type: 'movie' as const, content: movie, progress: p };
        }
        if (p.episodeId) {
          const episode = await ctx.db.get(p.episodeId);
          if (episode) {
            const series = await ctx.db.get(episode.seriesId);
            return { type: 'episode' as const, content: { ...episode, series }, progress: p };
          }
        }
        return null;
      })
    );
    
    return results.filter(Boolean);
  },
});6. Feature Modules6.1 CiyaarSnaps — Short-Form Video DiscoveryArchitecture Overview┌─────────────────────────────────────────────────────────────────┐
│                    CIYAARSNAPS FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Homepage (Horizontal Carousel)                                │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                      │
│   │Snap │ │Snap │ │Snap │ │Snap │ │Snap │  →  Tap to expand    │
│   │  1  │ │  2  │ │  3  │ │  4  │ │  5  │                      │
│   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                      │
│                       │                                         │
│                       ▼                                         │
│   Full-Screen Player (/snaps)                                   │
│   ┌─────────────────────────────────────────────────┐          │
│   │                                                  │          │
│   │              [VIDEO CONTENT]                     │  Swipe   │
│   │                                                  │  Up/Down │
│   │   ┌────┐                               ┌────┐   │          │
│   │   │Like│                               │Share│  │          │
│   │   │ ♥  │     Title & Description       │ ↗  │  │          │
│   │   └────┘                               └────┘   │          │
│   │                                                  │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘SnapsFeed Componenttypescript// components/snaps/SnapsFeed.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { SnapPlayer } from './SnapPlayer';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface SnapsFeedProps {
  initialSnapId?: string;
  category?: string;
}

export function SnapsFeed({ initialSnapId, category }: SnapsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch snaps with infinite scroll
  const snaps = useQuery(api.snaps.getFeed, { 
    category,
    limit: 20,
  });
  
  const trackView = useMutation(api.snaps.trackView);
  const toggleLike = useMutation(api.snaps.toggleLike);
  
  // Handle vertical swipe navigation
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const snapHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / snapHeight);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      
      // Track view for new snap
      const snap = snaps?.[newIndex];
      if (snap) {
        trackView({ snapId: snap._id });
      }
    }
  }, [currentIndex, snaps, trackView]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        navigateSnap('next');
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        navigateSnap('prev');
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev);
      } else if (e.key === 'l') {
        const snap = snaps?.[currentIndex];
        if (snap) toggleLike({ snapId: snap._id });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, snaps]);
  
  const navigateSnap = (direction: 'prev' | 'next') => {
    if (!containerRef.current || !snaps) return;
    
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, snaps.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    containerRef.current.scrollTo({
      top: newIndex * containerRef.current.clientHeight,
      behavior: 'smooth',
    });
  };
  
  if (!snaps) {
    return <SnapsFeedSkeleton />;
  }
  
  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        'h-screen w-full overflow-y-scroll snap-y snap-mandatory',
        'scrollbar-hide bg-background-primary'
      )}
    >
      {snaps.map((snap, index) => (
        <div 
          key={snap._id}
          className="h-screen w-full snap-start snap-always relative"
        >
          <SnapPlayer
            snap={snap}
            isActive={index === currentIndex}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted((prev) => !prev)}
            onLike={() => toggleLike({ snapId: snap._id })}
          />
        </div>
      ))}
      
      {/* Load more trigger */}
      <LoadMoreTrigger />
    </div>
  );
}

function SnapsFeedSkeleton() {
  return (
    <div className="h-screen w-full bg-background-primary flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-background-tertiary" />
        <div className="w-32 h-4 rounded bg-background-tertiary" />
      </div>
    </div>
  );
}SnapPlayer Componenttypescript// components/snaps/SnapPlayer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Share2, MessageCircle, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/lib/formatters';

interface Snap {
  _id: string;
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  category: string;
}

interface SnapPlayerProps {
  snap: Snap;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  onLike: () => void;
}

export function SnapPlayer({ 
  snap, 
  isActive, 
  isMuted, 
  onMuteToggle,
  onLike 
}: SnapPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  // Auto-play when active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);
  
  // Update mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);
  
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };
  
  const handleLike = () => {
    setIsLiked(true);
    onLike();
    
    // Heart animation
    setTimeout(() => setIsLiked(false), 1000);
  };
  
  return (
    <div className="relative h-full w-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={snap.videoUrl}
        poster={snap.thumbnailUrl}
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlayPause}
        className="h-full w-full object-cover"
      />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </div>
        </div>
      )}
      
      {/* Right sidebar actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
        {/* Like */}
        <button
          onClick={handleLike}
          className={cn(
            'flex flex-col items-center gap-1 transition-transform',
            isLiked && 'scale-125'
          )}
        >
          <div className={cn(
            'w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center',
            'hover:bg-white/20 transition-colors',
            isLiked && 'bg-accent-red/20'
          )}>
            <Heart 
              className={cn(
                'w-6 h-6 transition-colors',
                isLiked ? 'text-accent-red fill-accent-red' : 'text-white'
              )} 
            />
          </div>
          <span className="text-white text-xs font-medium">
            {formatCompactNumber(snap.likeCount)}
          </span>
        </button>
        
        {/* Comments */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">
            {formatCompactNumber(snap.commentCount)}
          </span>
        </button>
        
        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">
            {formatCompactNumber(snap.shareCount)}
          </span>
        </button>
        
        {/* Mute toggle */}
        <button
          onClick={onMuteToggle}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
      
      {/* Bottom content info */}
      <div className="absolute bottom-0 left-0 right-20 p-4 pb-8">
        {/* Category badge */}
        <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-2">
          {snap.category.replace('_', ' ')}
        </div>
        
        {/* Title & description */}
        {snap.title && (
          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">
            {snap.title}
          </h3>
        )}
        {snap.description && (
          <p className="text-white/70 text-sm line-clamp-2">
            {snap.description}
          </p>
        )}
        
        {/* View count */}
        <p className="text-white/50 text-xs mt-2">
          {formatCompactNumber(snap.viewCount)} views
        </p>
      </div>
      
      {/* Double-tap to like animation */}
      {isLiked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart 
            className="w-24 h-24 text-accent-red fill-accent-red animate-scale-in"
            style={{ 
              animation: 'scale-in 0.3s ease-out, fade-out 0.3s ease-out 0.5s forwards' 
            }}
          />
        </div>
      )}
    </div>
  );
}6.2 Live Match ExperienceMatch Detail Pagetypescript// app/(main)/matches/[matchId]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@convex/_generated/api';
import { MatchHero } from '@/components/matches/MatchHero';
import { MatchPlayer } from '@/components/matches/MatchPlayer';
import { LiveChat } from '@/components/matches/LiveChat';
import { MatchTimeline } from '@/components/matches/MatchTimeline';
import { MatchStats } from '@/components/matches/MatchStats';
import { RelatedMatches } from '@/components/matches/RelatedMatches';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

export default async function MatchPage({ params }: PageProps) {
  const { matchId } = await params;
  
  const match = await fetchQuery(api.matches.getMatchById, { 
    matchId: matchId as any 
  });
  
  if (!match) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Hero Section with Scores */}
      <MatchHero match={match} />
      
      {/* Main Content Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<MatchPlayerSkeleton />}>
              <MatchPlayer matchId={matchId} />
            </Suspense>
            
            {/* Match Timeline (Events) */}
            <MatchTimeline events={match.events} />
            
            {/* Match Statistics */}
            <Suspense fallback={<MatchStatsSkeleton />}>
              <MatchStats matchId={matchId} />
            </Suspense>
          </div>
          
          {/* Live Chat Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Suspense fallback={<LiveChatSkeleton />}>
                <LiveChat matchId={matchId} />
              </Suspense>
            </div>
          </div>
        </div>
        
        {/* Related Matches */}
        <div className="mt-12">
          <RelatedMatches 
            leagueId={match.league.id}
            excludeMatchId={matchId}
          />
        </div>
      </div>
    </div>
  );
}Live Score Bar Componenttypescript// components/matches/LiveScoreBar.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LiveScoreBarProps {
  matchId: string;
  className?: string;
}

export function LiveScoreBar({ matchId, className }: LiveScoreBarProps) {
  // Real-time subscription to match updates
  const match = useQuery(api.matches.getMatchById, { matchId: matchId as any });
  
  if (!match) return null;
  
  const isLive = match.status === 'live' || match.status === 'halftime';
  
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl',
      'bg-glass-background backdrop-blur-[20px]',
      'border border-glass-border',
      isLive && 'ring-1 ring-accent-red/30',
      className
    )}>
      {/* Live pulse background */}
      {isLive && (
        <div className="absolute inset-0 bg-accent-red/5 animate-pulse" />
      )}
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image
              src={match.league.logo}
              alt={match.league.name}
              width={20}
              height={20}
              className="rounded"
            />
            <span className="text-text-secondary text-sm">
              {match.league.name}
            </span>
          </div>
          
          {isLive ? (
            <div className="flex items-center gap-2">
              <LiveBadge size="sm" />
              <span className="text-accent-red text-sm font-mono">
                {match.matchMinute}'
              </span>
            </div>
          ) : (
            <span className="text-text-tertiary text-sm">
              {formatMatchStatus(match.status)}
            </span>
          )}
        </div>
        
        {/* Teams & Score */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1">
            <Image
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-text-primary font-semibold truncate">
              {match.homeTeam.name}
            </span>
          </div>
          
          {/* Score */}
          <div className="flex items-center gap-3 px-4">
            <span className={cn(
              'text-3xl font-bold tabular-nums',
              isLive ? 'text-text-primary' : 'text-text-secondary'
            )}>
              {match.homeTeam.score ?? '-'}
            </span>
            <span className="text-text-tertiary text-xl">:</span>
            <span className={cn(
              'text-3xl font-bold tabular-nums',
              isLive ? 'text-text-primary' : 'text-text-secondary'
            )}>
              {match.awayTeam.score ?? '-'}
            </span>
          </div>
          
          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="text-text-primary font-semibold truncate text-right">
              {match.awayTeam.name}
            </span>
            <Image
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
        </div>
        
        {/* Viewer count for live matches */}
        {isLive && match.viewerCount > 0 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-glass-border">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-text-secondary text-sm">
              {formatCompactNumber(match.viewerCount)} watching
            </span>
          </div>
        )}
      </div>
    </div>
  );
}Live Chat Componenttypescript// components/matches/LiveChat.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { Send, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatRelativeTime } from '@/lib/formatters';

interface LiveChatProps {
  matchId: string;
}

const REACTIONS = [
  { type: 'fire', emoji: '🔥' },
  { type: 'goal', emoji: '⚽' },
  { type: 'laugh', emoji: '😂' },
  { type: 'angry', emoji: '😤' },
] as const;

export function LiveChat({ matchId }: LiveChatProps) {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Real-time messages subscription
  const messages = useQuery(api.chat.getMatchMessages, { 
    matchId: matchId as any,
    limit: 100,
  });
  
  const sendMessage = useMutation(api.chat.sendMessage);
  const addReaction = useMutation(api.chat.addReaction);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    if (!message.trim() || !user) return;
    
    try {
      await sendMessage({
        matchId: matchId as any,
        userId: user._id,
        content: message.trim(),
      });
      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.Continue11:55 PM<function_results>File created at /home/claude/FANBROJ_DEVELOPMENT_DOCS.md (65535 characters)
</parameter>Failed to load file content
regenrate donwloand link11:56 PMLet me recreate the file and provide you with a download link.1 stepClean up and check directorybashrm -f /home/claude/FANBROJ_DEVELOPMENT_DOCS.md 2>/dev/null; ls -la /home/claude/Outputtotal 5
drwxr-xr-x 7 root root 180 Nov 21 01:57 .
drwxr-xr-x 4 root root  80 Nov 21 01:53 ..
drwxr-xr-x 5 root root 100 Nov 21 01:59 .cache
drwxr-xr-x 3 root root  60 Nov 21 01:57 .config
drwxr-xr-x 3 root root  60 Nov 21 01:57 .local
drwxr-xr-x 3 root root  80 Nov 21 02:00 .npm
drwxr-xr-x 5 root root 100 Nov 21 01:59 .npm-global
-rw-r--r-- 1 root root  74 Nov 21 01:57 .npmrc
-rw-r--r-- 1 root root 215 Nov 21 01:58 .wget-hsts
Creating comprehensive Fanbroj development documentation - Part 1FANBROJ_COMPLETE_DEV_DOCS.mdFailed to load file content
regenrate donwloand link12:00 AMLet me create a smaller, more manageable file and generate a fresh download link.Clean outputs directorybashrm -rf /mnt/user-data/outputs/* 2>/dev/null; mkdir -p /mnt/user-data/outputsOutputexit code 0Creating Fanbroj development documentationFANBROJ_DEV_DOCS.mdFANBROJ (CIYAAR) — Development Documentation
The Premier Somali Entertainment & Sports Streaming Platform
Netflix meets ESPN, built for East Africa
1. Executive VisionMission Statement
Fanbroj is Somalia's first unified entertainment super-app, consolidating live football, Somali-dubbed content (Musalsal), and short-form video discovery into a single platform optimized for East African networks.Core Features
FeatureDescriptionLive SportsReal-time football with HLS streaming & live chatVOD LibrarySomali-dubbed movies/series with progress trackingCiyaarSnapsTikTok-style vertical video discoveryPremium SystemCode-based subscription activationTarget Metrics

Monthly Active Users: 500K+ (Year 1)
Average Session: 45 minutes
Concurrent Streams: 50K viewers/match
App Size: < 25MB Android APK
2. Tech StackLayerTechnologyFrameworkNext.js 15+ (App Router)LanguageTypeScript (Strict)UIReact 19 + Tailwind CSS 4BackendConvex (Real-time serverless)MobileExpo (React Native)IconsLucide ReactAuthClerk3. Project Structurefanbroj/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login, Register
│   ├── (main)/
│   │   ├── page.tsx          # Homepage
│   │   ├── matches/          # Live sports
│   │   ├── movies/           # VOD movies
│   │   ├── series/           # Musalsal
│   │   ├── snaps/            # CiyaarSnaps
│   │   └── my-list/          # User library
│   └── admin/                # Admin dashboard
├── components/
│   ├── ui/                   # Base components
│   ├── layout/               # Navigation, Footer
│   ├── matches/              # Match components
│   ├── content/              # VOD components
│   └── snaps/                # Short video components
├── convex/                   # Backend
│   ├── schema.ts
│   ├── matches.ts
│   ├── content.ts
│   ├── snaps.ts
│   └── users.ts
├── lib/                      # Utilities
├── styles/                   # CSS
└── mobile/                   # Expo app4. Design System — "Stadium Dark"Color Palettecss:root {
  /* Backgrounds */
  --bg-primary: #0A0A0B;
  --bg-secondary: #121214;
  --bg-tertiary: #1A1A1D;
  --bg-elevated: #242428;
  
  /* Accents */
  --color-primary: #22C55E;       /* Pitch Green */
  --color-secondary: #EAB308;     /* Gold */
  --color-accent-red: #EF4444;    /* Live indicator */
  --color-accent-blue: #3B82F6;
  
  /* Text */
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;
  
  /* Glass Effect */
  --glass-bg: rgba(18, 18, 20, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
}Typographycss:root {
  --font-display: 'Clash Display', system-ui;
  --font-body: 'Satoshi', system-ui;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.5rem;
  --text-5xl: 3rem;
}Spacing Scale (4px base)css:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}5. Database Schema (Convex)Users Table
typescriptusers: defineTable({
  clerkId: v.string(),
  email: v.string(),
  username: v.string(),
  displayName: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  preferredLanguage: v.optional(v.union(
    v.literal('so'), v.literal('en'), v.literal('ar')
  )),
  favoriteTeams: v.optional(v.array(v.string())),
  subscriptionTier: v.union(
    v.literal('free'),
    v.literal('basic'),
    v.literal('premium'),
    v.literal('vip')
  ),
  subscriptionExpiresAt: v.optional(v.number()),
  totalWatchTimeMinutes: v.number(),
  role: v.union(
    v.literal('user'),
    v.literal('moderator'),
    v.literal('admin')
  ),
  isBanned: v.boolean(),
  lastActiveAt: v.number(),
})
  .index('by_clerk_id', ['clerkId'])
  .index('by_email', ['email'])Movies Table
typescriptmovies: defineTable({
  title: v.string(),
  titleSomali: v.optional(v.string()),
  slug: v.string(),
  description: v.string(),
  posterUrl: v.string(),
  backdropUrl: v.optional(v.string()),
  trailerUrl: v.optional(v.string()),
  videoUrl: v.string(),
  releaseYear: v.number(),
  durationMinutes: v.number(),
  genres: v.array(v.string()),
  requiredTier: v.union(
    v.literal('free'),
    v.literal('basic'),
    v.literal('premium'),
    v.literal('vip')
  ),
  status: v.union(
    v.literal('draft'),
    v.literal('published'),
    v.literal('archived')
  ),
  isFeatured: v.boolean(),
  viewCount: v.number(),
  likeCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_slug', ['slug'])
  .index('by_status', ['status'])
  .index('by_featured', ['isFeatured'])
  .searchIndex('search_movies', {
    searchField: 'title',
    filterFields: ['status', 'genres'],
  })Series Table
typescriptseries: defineTable({
  title: v.string(),
  titleSomali: v.optional(v.string()),
  slug: v.string(),
  description: v.string(),
  posterUrl: v.string(),
  backdropUrl: v.optional(v.string()),
  releaseYear: v.number(),
  genres: v.array(v.string()),
  totalSeasons: v.number(),
  totalEpisodes: v.number(),
  status: v.union(
    v.literal('draft'),
    v.literal('ongoing'),
    v.literal('completed'),
    v.literal('archived')
  ),
  requiredTier: v.union(
    v.literal('free'),
    v.literal('basic'),
    v.literal('premium'),
    v.literal('vip')
  ),
  isFeatured: v.boolean(),
  viewCount: v.number(),
  createdAt: v.number(),
})
  .index('by_slug', ['slug'])
  .index('by_status', ['status'])Episodes Table
typescriptepisodes: defineTable({
  seriesId: v.id('series'),
  seasonNumber: v.number(),
  episodeNumber: v.number(),
  title: v.string(),
  titleSomali: v.optional(v.string()),
  description: v.optional(v.string()),
  thumbnailUrl: v.string(),
  videoUrl: v.string(),
  durationMinutes: v.number(),
  status: v.union(v.literal('draft'), v.literal('published')),
  viewCount: v.number(),
  createdAt: v.number(),
})
  .index('by_series', ['seriesId'])
  .index('by_series_season', ['seriesId', 'seasonNumber'])Matches Table
typescriptmatches: defineTable({
  externalId: v.string(),
  externalSource: v.literal('api-football'),
  homeTeam: v.object({
    id: v.string(),
    name: v.string(),
    logo: v.string(),
    score: v.optional(v.number()),
  }),
  awayTeam: v.object({
    id: v.string(),
    name: v.string(),
    logo: v.string(),
    score: v.optional(v.number()),
  }),
  league: v.object({
    id: v.string(),
    name: v.string(),
    logo: v.string(),
    country: v.string(),
  }),
  kickoffTime: v.number(),
  status: v.union(
    v.literal('scheduled'),
    v.literal('live'),
    v.literal('halftime'),
    v.literal('finished'),
    v.literal('postponed'),
    v.literal('cancelled')
  ),
  matchMinute: v.optional(v.number()),
  streamUrl: v.optional(v.string()),
  streamType: v.optional(v.union(
    v.literal('hls'),
    v.literal('iframe')
  )),
  embedUrl: v.optional(v.string()),
  requiredTier: v.union(
    v.literal('free'),
    v.literal('basic'),
    v.literal('premium'),
    v.literal('vip')
  ),
  isFeatured: v.boolean(),
  viewerCount: v.number(),
  peakViewerCount: v.number(),
  lastSyncedAt: v.number(),
  createdAt: v.number(),
})
  .index('by_external_id', ['externalId'])
  .index('by_status', ['status'])
  .index('by_kickoff', ['kickoffTime'])Snaps Table (CiyaarSnaps)
typescriptsnaps: defineTable({
  creatorId: v.optional(v.id('users')),
  creatorType: v.union(
    v.literal('official'),
    v.literal('user')
  ),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  videoUrl: v.string(),
  thumbnailUrl: v.string(),
  durationSeconds: v.number(),
  category: v.union(
    v.literal('highlights'),
    v.literal('goals'),
    v.literal('skills'),
    v.literal('funny'),
    v.literal('news'),
    v.literal('behind_scenes'),
    v.literal('fan_content')
  ),
  tags: v.array(v.string()),
  relatedMatchId: v.optional(v.id('matches')),
  viewCount: v.number(),
  likeCount: v.number(),
  shareCount: v.number(),
  commentCount: v.number(),
  status: v.union(
    v.literal('processing'),
    v.literal('published'),
    v.literal('removed')
  ),
  isFeatured: v.boolean(),
  createdAt: v.number(),
})
  .index('by_status', ['status'])
  .index('by_category', ['category', 'status'])
  .index('by_featured', ['isFeatured'])
  .index('by_trending', ['viewCount'])Watch Progress Table
typescriptuserWatchProgress: defineTable({
  userId: v.id('users'),
  movieId: v.optional(v.id('movies')),
  episodeId: v.optional(v.id('episodes')),
  matchId: v.optional(v.id('matches')),
  progressSeconds: v.number(),
  totalDurationSeconds: v.number(),
  progressPercent: v.number(),
  isCompleted: v.boolean(),
  lastWatchedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_movie', ['userId', 'movieId'])
  .index('by_user_episode', ['userId', 'episodeId'])Redemption Codes Table
typescriptredemptionCodes: defineTable({
  code: v.string(),
  tier: v.union(
    v.literal('basic'),
    v.literal('premium'),
    v.literal('vip')
  ),
  durationDays: v.number(),
  maxUses: v.number(),
  usedCount: v.number(),
  isActive: v.boolean(),
  expiresAt: v.optional(v.number()),
  createdBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_code', ['code'])
  .index('by_active', ['isActive'])6. Key ComponentsGlassCard Component
tsx// components/ui/GlassCard.tsx
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  glow?: 'none' | 'primary' | 'gold';
  className?: string;
}

export function GlassCard({ 
  children,Claude is AI and can make mistakes. Please double-check responses.