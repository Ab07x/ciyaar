# Fanbroj - Somali Live Sports Streaming

A modern, premium live sports streaming platform built for Somali audiences.

## Features

- **TV Guide Style** - Browse Live, Upcoming, Finished, and Premium matches
- **Premium Subscriptions** - Code-based with device limits
- **Admin Panel** - Full match, blog, ads, and code management
- **Blog System** - SEO-ready news and articles
- **Ads System** - Multi-network support with slot configuration
- **Match Import** - One-click import from API-Football

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Convex
- **Deployment**: Vercel-ready

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url
ADMIN_TOKEN=your_secret_admin_token
FOOTBALL_API_KEY=your_api_football_key  # Optional
```

### 3. Start Convex
```bash
npx convex dev
```

### 4. Run Development Server
```bash
pnpm dev
```

### 5. Access Admin Panel
Navigate to `/admin/login` and enter your `ADMIN_TOKEN`.

### 6. Seed Default Data
In Admin → Settings, click "Seed All Defaults" to populate leagues and ad slots.

## Project Structure

```
app/
├── page.tsx              # Homepage TV Guide
├── match/[slug]/         # Match player page
├── pricing/              # Pricing & subscription
├── blog/                 # Blog system
└── admin/                # Admin panel
    ├── matches/          # Match CRUD
    ├── blog/             # Blog CRUD
    ├── codes/            # Code generation
    ├── ads/              # Ad slot config
    ├── leagues/          # League management
    ├── import/           # Fixture import
    ├── pricing/          # Plan settings
    └── settings/         # Global config

convex/
├── schema.ts             # Database schema
├── matches.ts            # Match queries/mutations
├── posts.ts              # Blog queries/mutations
├── users.ts              # User management
├── subscriptions.ts      # Subscription logic
├── redemptions.ts        # Code redemption
├── ads.ts                # Ad slot config
├── leagues.ts            # League management
└── settings.ts           # Global settings

components/
├── PlayerStage.tsx       # Video player with premium lock
├── MatchCard.tsx         # Match card component
├── AdSlot.tsx            # Ad slot renderer
├── Badge.tsx             # Status badges
└── CountdownTimer.tsx    # Kickoff countdown
```

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `ADMIN_TOKEN`
   - `FOOTBALL_API_KEY` (optional)
4. Deploy

## License

© 2026 Fanbroj. All rights reserved.
