
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Helper to download, convert to WebP, and save file with SEO-friendly name
async function downloadAndConvertImage(url: string, slug: string, type: "poster" | "backdrop"): Promise<string | null> {
    if (!url) return null;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);

        const uploadDir = path.join(process.cwd(), "public", "posters");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // SEO-friendly filename with WebP extension and fanproj-af-somali suffix
        const filename = `${slug}-${type}-fanproj-af-somali.webp`;
        const filePath = path.join(uploadDir, filename);

        // Get image buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Resize and convert to WebP for fast loading
        const width = type === "poster" ? 500 : 1280; // Poster: 500px, Backdrop: 1280px
        const quality = type === "poster" ? 80 : 75;

        await sharp(buffer)
            .resize(width, null, { withoutEnlargement: true })
            .webp({ quality, effort: 6 })
            .toFile(filePath);

        console.log(`✓ Saved ${type}: /posters/${filename}`);
        return `/posters/${filename}`;
    } catch (error) {
        console.error(`Error processing ${type} image:`, error);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const { tmdbId } = await req.json();

        if (!tmdbId) {
            return NextResponse.json({ error: "Missing tmdbId" }, { status: 400 });
        }

        // 1. Fetch metadata from TMDB API directly

        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) return NextResponse.json({ error: "Server API Key missing" }, { status: 500 });

        const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits,videos,keywords,release_dates`;
        const tmdbRes = await fetch(tmdbUrl);
        if (!tmdbRes.ok) return NextResponse.json({ error: "TMDB Error" }, { status: tmdbRes.status });

        const data = await tmdbRes.json();

        // 2. Generate SEO Slug
        const year = data.release_date ? data.release_date.split("-")[0] : "";
        const rawSlug = (data.title || "untitled")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        const slug = `${rawSlug}${year ? `-${year}` : ""}`;

        // 3. Download Images with SEO-friendly WebP conversion
        // Use original quality for best results, then compress to WebP
        const posterUrlRemote = data.poster_path ? `https://image.tmdb.org/t/p/original${data.poster_path}` : null;
        const backdropUrlRemote = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null;

        // Parallel download and convert to WebP
        const [localPosterPath, localBackdropPath] = await Promise.all([
            downloadAndConvertImage(posterUrlRemote!, slug, "poster"),
            downloadAndConvertImage(backdropUrlRemote!, slug, "backdrop")
        ]);

        // 4. Prepare Metadata
        const seoKeywords = (data.keywords?.keywords || []).map((k: any) => k.name);
        const usRelease = (data.release_dates?.results || []).find((r: any) => r.iso_3166_1 === "US");
        const mpaa = usRelease?.release_dates?.[0]?.certification || "";

        // Director & Cast
        const director = data.credits?.crew?.find((c: any) => c.job === "Director")?.name;
        const cast = (data.credits?.cast || []).slice(0, 5).map((c: any) => ({
            name: c.name,
            character: c.character,
            profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined
        }));

        // Extract YouTube trailer
        const trailer = (data.videos?.results || []).find(
            (v: any) => v.type === "Trailer" && v.site === "YouTube"
        );
        const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined;

        // 5. Return success (Frontend will then call createMovie with these paths)

        return NextResponse.json({
            success: true,
            data: {
                tmdbId: data.id,
                imdbId: data.imdb_id,
                title: data.title,
                overview: data.overview,
                slug,
                // The critical part: Local Paths!
                posterUrl: localPosterPath || posterUrlRemote, // Fallback if download failed
                backdropUrl: localBackdropPath || backdropUrlRemote,

                releaseDate: data.release_date,
                runtime: data.runtime,
                rating: data.vote_average,
                voteCount: data.vote_count,
                genres: (data.genres || []).map((g: any) => g.name),
                cast,
                director,
                trailerUrl,

                // SEO Fields
                seoKeywords,
                seoTitle: `${data.title} (${year}) - Watch Online`,
                seoDescription: data.overview?.substring(0, 155) || "",
                ratingMpaa: mpaa
            }
        });

    } catch (error: any) {
        console.error("Import Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
