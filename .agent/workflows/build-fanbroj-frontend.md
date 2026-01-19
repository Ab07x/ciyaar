---
description: BUILDING FRONTEND – MOVIES & SERIES PAGES.md
---

Fanbroj (Af-Somali Sports, Movies & Series Platform)

🎯 OBJECTIVE

Build fast, SEO-optimized, mobile-first Movies & Series pages where:

Admin pastes ONLY:

TMDB ID or IMDb ID

iFrame streaming link

System auto-generates:

Title, poster, metadata

SEO content

Clean UI page

Users can watch instantly with minimal buffering

🧠 CORE CONCEPT

Fanbroj is not an OTT clone
It is a content aggregator + SEO engine for Af-Somali dubbed content.

Frontend must:

Render SEO content outside iframe

Load video player immediately

Work smoothly on low bandwidth

🧱 PAGE TYPES
1️⃣ Movie Page

Route

/movie/[slug]

2️⃣ Series Page

Route

/series/[slug]

3️⃣ Episode Page (optional later)
/series/[slug]/season/[n]/episode/[n]

📦 DATA SOURCES
TMDB (Primary)

Posters

Backdrops

Genres

Overview

Cast

Runtime

Release year

Example:

https://www.themoviedb.org/movie/109424

IMDb (Secondary / Validation)

Rating

Popularity

Alternate titles

Example:

https://www.imdb.com/title/tt1535109/

🔁 DATA FLOW (ONE-CLICK SYSTEM)
Admin enters TMDB ID or IMDb ID
            ↓
Backend fetches metadata
            ↓
Slug + SEO meta auto-generated
            ↓
Frontend renders page
            ↓
User watches instantly

🧩 FRONTEND PAGE STRUCTURE
🎬 Movie Page Layout
[ Video Player (iframe) ]
[ Title + Meta Info ]
[ Action Buttons ]
[ Description ]
[ Cast & Genres ]
[ Related Movies ]

📺 Series Page Layout
[ Video Player ]
[ Series Title + Meta ]
[ Season Selector ]
[ Episode List ]
[ Description ]
[ Related Series ]

▶️ VIDEO PLAYER RULES (CRITICAL)

Player always first

No ads overlays in UI

iframe only (no custom player)

Auto-select fastest embed

<iframe
  src={embedUrl}
  allow="autoplay; fullscreen"
  loading="lazy"
  className="w-full aspect-video rounded-md"
/>

🧠 SEO CONTENT STRATEGY
MUST be outside iframe

Google cannot index iframe content.

Required SEO Elements
Element	Source
H1 Title	TMDB / IMDb
Meta Description	Auto-generated
Overview Text	TMDB
Headings (H2/H3)	Generated
Internal Links	Related content
🏷️ TITLE & META FORMAT (AF-SOMALI)
Movie Title
Daawo [Movie Name] Af-Somali | Fanbroj

Meta Description
Daawo filimka [Movie Name] oo Af-Somali ah, HD tayo sare leh, buffering yar. Ku daawo Fanbroj maanta.

🖼️ IMAGE HANDLING
Posters

Source: TMDB

Use next/image

Sizes:

Mobile: 300px

Desktop: 500px

<Image
  src={posterUrl}
  alt={title}
  width={400}
  height={600}
  priority={false}
/>

🎛️ ACTION BUTTONS
Required Buttons

▶️ Daawo Hadda

⭐ Ku dar Favorites

🔗 La wadaag

Optional

🔒 Premium Badge

🧬 COMPONENTS TO BUILD
Core Components

MoviePlayer

MovieMeta

SeriesSeasons

EpisodeList

CastGrid

RelatedGrid

Shared UI

Badge

CTAButton

RatingPill

🔄 RELATED CONTENT LOGIC
Movies

Match by:

Genre

Language (Af-Somali)

Popularity

Series

Match by:

Category

Audience interest

📱 MOBILE UX RULES

Player above the fold

No sidebar

Vertical scrolling only

Sticky play CTA (optional)

⚡ PERFORMANCE RULES

Lazy load images

Server components for data

No heavy JS animations

Cache TMDB responses

Target:

TTFB < 600ms

LCP < 2.5s

🔐 PREMIUM CONTENT HANDLING
Premium Check

Before iframe render

If locked → show preview image

if (!hasAccess) return <PremiumUpsell />

🧪 QA CHECKLIST

Before publish:

✅ Player loads

✅ SEO text visible

✅ Page indexed

✅ Mobile tested

✅ Low bandwidth tested

🏁 FINAL RESULT

With this system:

Admin adds 100 movies in 10 minutes

Each page is:

SEO-rankable

Mobile-optimized

Fast

Fanbroj becomes:

“Hal meel oo Af-Somali ah laga daawado filim, musalsal & ciyaar.”