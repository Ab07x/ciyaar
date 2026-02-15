import mongoose from "mongoose";
import { Movie } from "@/lib/models";

type LeanMovie = {
    _id?: unknown;
    slug?: string;
    title?: string;
    titleSomali?: string;
} | null;

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeTrialMovieToken(input: unknown): string {
    const raw = String(input || "").trim();
    if (!raw) return "";

    let token = safeDecode(raw).replace(/\+/g, " ").trim();
    if (!token) return "";

    token = token.replace(/^https?:\/\/[^/]+/i, "");
    token = token.split(/[?#]/)[0] || token;
    token = token.replace(/^\/+|\/+$/g, "");

    const moviePathMatch = token.match(/(?:^|\/)(?:tv\/)?movies\/([^/]+)/i);
    if (moviePathMatch?.[1]) {
        token = moviePathMatch[1];
    }

    token = token.replace(/^(?:tv\/)?movies\//i, "");
    token = token.replace(/\/(play|watch)$/i, "");
    token = token.replace(/^\/+|\/+$/g, "");

    if (!token) return "";
    if (token.includes("/")) token = token.split("/")[0] || token;

    return token.trim().toLowerCase();
}

export function toSlugLike(input: unknown): string {
    const normalized = normalizeTrialMovieToken(input);
    if (!normalized) return "";
    return normalized
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function buildTrialAliasSet(input: unknown): Set<string> {
    const aliases = new Set<string>();
    const raw = String(input || "").trim();
    if (!raw) return aliases;

    const rawLower = safeDecode(raw).trim().toLowerCase();
    if (rawLower) aliases.add(rawLower);

    const normalized = normalizeTrialMovieToken(raw);
    if (normalized) aliases.add(normalized);

    const slugLike = toSlugLike(raw);
    if (slugLike) aliases.add(slugLike);

    if (normalized && normalized.includes("-")) {
        const spaced = normalized.replace(/-/g, " ").trim();
        if (spaced) aliases.add(spaced);
    }

    return aliases;
}

export type TrialMovieResolution = {
    canonicalMovieId: string;
    aliases: string[];
};

export async function resolveTrialMovie(input: unknown): Promise<TrialMovieResolution> {
    const raw = String(input || "").trim();
    const aliases = buildTrialAliasSet(raw);
    const normalized = normalizeTrialMovieToken(raw);
    const slugLike = toSlugLike(raw);

    const possibleSlugs = Array.from(new Set([normalized, slugLike].filter(Boolean)));
    const possibleObjectIds = Array.from(aliases).filter((value) => mongoose.Types.ObjectId.isValid(value));

    let movie: LeanMovie = null;

    const orQuery: Array<Record<string, unknown>> = [];
    if (possibleSlugs.length > 0) {
        orQuery.push({ slug: { $in: possibleSlugs } });
    }
    if (possibleObjectIds.length > 0) {
        orQuery.push({ _id: { $in: possibleObjectIds } });
    }

    if (orQuery.length > 0) {
        movie = await Movie.findOne({ $or: orQuery })
            .select("_id slug title titleSomali")
            .lean<LeanMovie>();
    }

    if (!movie) {
        const titleCandidates = Array.from(
            new Set(
                [raw, normalized, slugLike]
                    .map((value) => String(value || "").replace(/-/g, " ").trim())
                    .filter(Boolean)
            )
        ).slice(0, 4);

        for (const titleCandidate of titleCandidates) {
            const titleRegex = new RegExp(`^${escapeRegExp(titleCandidate)}$`, "i");
            movie = await Movie.findOne({
                $or: [
                    { title: titleRegex },
                    { titleSomali: titleRegex },
                ],
            })
                .select("_id slug title titleSomali")
                .lean<LeanMovie>();

            if (movie) break;
        }
    }

    if (movie) {
        buildTrialAliasSet(String(movie._id || "")).forEach((value) => aliases.add(value));
        buildTrialAliasSet(movie.slug || "").forEach((value) => aliases.add(value));
        buildTrialAliasSet(movie.title || "").forEach((value) => aliases.add(value));
        buildTrialAliasSet(movie.titleSomali || "").forEach((value) => aliases.add(value));
    }

    const canonicalMovieId = String(movie?.slug || normalized || slugLike || raw);

    return {
        canonicalMovieId,
        aliases: Array.from(aliases).filter(Boolean),
    };
}

