import mongoose, { Schema, Document } from "mongoose";

export interface IMovie extends Document {
    convexId?: string;
    slug: string;
    tmdbId: number;
    imdbId?: string;
    title: string;
    titleSomali?: string;
    overview: string;
    overviewSomali?: string;
    posterUrl: string;
    backdropUrl?: string;
    releaseDate: string;
    runtime?: number;
    rating?: number;
    voteCount?: number;
    genres: string[];
    cast: { name: string; character: string; profileUrl?: string }[];
    director?: string;
    embeds: { label: string; url: string; quality?: string; type?: string; isProtected?: boolean }[];
    isDubbed: boolean;
    isPremium: boolean;
    isPublished: boolean;
    tags?: string[];
    category?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    ratingMpaa?: string;
    views?: number;
    isFeatured?: boolean;
    featuredOrder?: number;
    isTop10?: boolean;
    top10Order?: number;
    trailerUrl?: string;
    downloadUrl?: string;
    createdAt: number;
    updatedAt: number;
}

const MovieSchema = new Schema<IMovie>(
    {
        convexId: String,
        slug: { type: String, required: true, index: true },
        tmdbId: { type: Number, required: true, index: true },
        imdbId: String,
        title: { type: String, required: true },
        titleSomali: String,
        overview: { type: String, required: true },
        overviewSomali: String,
        posterUrl: { type: String, required: true },
        backdropUrl: String,
        releaseDate: { type: String, required: true },
        runtime: Number,
        rating: Number,
        voteCount: Number,
        genres: [String],
        cast: [{ name: String, character: String, profileUrl: String }],
        director: String,
        embeds: [{ label: String, url: String, quality: String, type: String, isProtected: Boolean }],
        isDubbed: { type: Boolean, default: false },
        isPremium: { type: Boolean, default: false, index: true },
        isPublished: { type: Boolean, default: true, index: true },
        tags: [String],
        category: { type: String, index: true },
        seoTitle: String,
        seoDescription: String,
        seoKeywords: [String],
        ratingMpaa: String,
        views: { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false, index: true },
        featuredOrder: Number,
        isTop10: { type: Boolean, default: false, index: true },
        top10Order: Number,
        trailerUrl: String,
        downloadUrl: String,
        createdAt: { type: Number, required: true },
        updatedAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Movie = mongoose.models.Movie || mongoose.model<IMovie>("Movie", MovieSchema, "movies");
