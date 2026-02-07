# Ciyaar Project: TMDB/IMDB SEO & Fetching Implementation Plan

This document outlines the logic extracted from the `idmuvi-core` WordPress plugin and how to implement it correctly in the Ciyaar (Next.js) project, fixing specific SEO flaws regarding image handling.

## 1. Current Workflow Analysis (WordPress Plugin)
The existing plugin (`idmuvi-core`) uses a frontend-heavy approach:
1.  **Trigger**: User enters IMDB/TMDB ID in the admin panel.
2.  **Fetch**: jQuery calls `https://api.themoviedb.org/3/movie/{id}` directly.
3.  **Populate**: Forms are filled via JavaScript.
4.  **Image Handling (Flawed)**:
    *   It sends the raw TMDB image URL to a backend handler (`save_poster`).
    *   The backend downloads the image using `download_url()`.
    *   **CRITICAL SEO FAIL**: It saves the file with the hashed filename from TMDB (e.g., `kqjL17.jpg`) instead of a keyword-rich name.
    *   **Meta Fail**: It does not add Alt Text or Caption to the image.

## 2. Proposed Implementation for Ciyaar (Next.js + Convex/Firebase)

We will move this logic to the **Server Side** (API Route or Convex Action) for better reliability and SEO control.

### A. Data Fetching (Server-Side)
Create a Convex Action or Next.js API Route `fetchMovieData(tmdbId)`:

**API Endpoint**: `https://api.themoviedb.org/3/movie/{id}?append_to_response=videos,keywords,images,credits,release_dates,external_ids`

**Mapped Fields:**
-   `title`: Movie Title
-   `overview`: Plot/Synopsis
-   `runtime`: Runtime in minutes
-   `release_date`: Release Date
-   `vote_average`: TMDB Rating
-   `genres`: Array of Genre names
-   `credits.cast`: Top 5-10 Actors
-   `credits.crew`: Director (job: "Director")
-   `videos`: YouTube Trailer ID (type: "Trailer")
-   `mpaa_rating`: search `release_dates` for `iso_3166_1: "US"` certification.

### B. SEO-Optimized Image Pipeline (The Fix)
Unlike the WP plugin, we will process images to maximize SEO value.

1.  **Files to Download**:
    *   `poster_path` -> Main Poster
    *   `backdrop_path` -> Header Background (High Priority for UX)

2.  **Renaming Logic (SEO)**:
    *   Do NOT keep `w782n3.jpg`.
    *   **New Name**: `{movie-slug}-poster.jpg` and `{movie-slug}-backdrop.jpg`.
    *   *Example*: `the-dark-knight-2008-poster.jpg`

3.  **Storage & Metadata**:
    *   Upload to **Firebase Storage** (since you are using `firebase-admin.ts`) or Convex Storage.
    *   Save the public URL in the database.
    *   **Alt Text**: Store the movie title as the default alt text in the DB schema.

### C. Implementation Steps

#### 1. Schema Update (Convex/Firebase)
Ensure your `movies` table has these fields:
```typescript
interface Movie {
  title: string;
  slug: string; // SEO friendly URL
  tmdbId: number;
  imdbId?: string;
  
  // SEO & Images
  posterUrl: string; // Your hosted URL
  posterAlt: string; // "Watch {Title} Online"
  backdropUrl?: string; // Your hosted URL
  
  // Metadata
  plot: string;
  director: string;
  cast: string[];
  genres: string[];
  rating: string; // MPAA
  releaseYear: number;
  runtime: number; // minutes
  trailerUrl?: string;
}
```

#### 2. Fetch Script (Pseudo-code)
```typescript
async function importMovieFromTMDB(tmdbId: string) {
  const data = await fetchTMDB(tmdbId);
  const slug = generateSlug(data.title);
  
  // 1. Download Images
  const posterBuffer = await downloadImage(`https://image.tmdb.org/t/p/original${data.poster_path}`);
  const backdropBuffer = await downloadImage(`https://image.tmdb.org/t/p/original${data.backdrop_path}`);
  
  // 2. Upload with SEO Names
  const posterUrl = await uploadToStorage(posterBuffer, `${slug}-poster.jpg`);
  const backdropUrl = await uploadToStorage(backdropBuffer, `${slug}-backdrop.jpg`);
  
  // 3. Save to DB
  await db.insert('movies', {
    title: data.title,
    slug: slug,
    posterUrl: posterUrl,
    posterAlt: `${data.title} Poster`,
    // ... mapped fields
  });
}
```

## 3. Immediate Action Items
1.  Add `TMDB_API_KEY` to `.env.local`.
2.  Create `lib/tmdb.ts` for the fetch logic.
3.  Create the image upload utility in `lib/storage.ts` that enforces the renaming convention.
