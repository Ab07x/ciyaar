import mongoose, { Schema, Document } from "mongoose";

export interface ISeries extends Document {
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
    firstAirDate: string;
    lastAirDate?: string;
    status: string;
    rating?: number;
    genres: string[];
    cast: { name: string; character: string; profileUrl?: string }[];
    numberOfSeasons: number;
    numberOfEpisodes: number;
    isDubbed: boolean;
    isPremium: boolean;
    isPublished: boolean;
    tags?: string[];
    category?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    views?: number;
    isFeatured?: boolean;
    featuredOrder?: number;
    createdAt: number;
    updatedAt: number;
}

const SeriesSchema = new Schema<ISeries>(
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
        firstAirDate: { type: String, required: true },
        lastAirDate: String,
        status: { type: String, required: true },
        rating: Number,
        genres: [String],
        cast: [{ name: String, character: String, profileUrl: String }],
        numberOfSeasons: { type: Number, required: true },
        numberOfEpisodes: { type: Number, required: true },
        isDubbed: { type: Boolean, default: false },
        isPremium: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: true, index: true },
        tags: [String],
        category: { type: String, index: true },
        seoTitle: String,
        seoDescription: String,
        seoKeywords: [String],
        views: { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false, index: true },
        featuredOrder: Number,
        createdAt: { type: Number, required: true },
        updatedAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const Series = mongoose.models.Series || mongoose.model<ISeries>("Series", SeriesSchema, "series");

// EPISODES
export interface IEpisode extends Document {
    convexId?: string;
    seriesId: string;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    titleSomali?: string;
    overview?: string;
    stillUrl?: string;
    airDate?: string;
    runtime?: number;
    embeds: { label: string; url: string; type?: string; isProtected?: boolean }[];
    isPublished: boolean;
    createdAt: number;
}

const EpisodeSchema = new Schema<IEpisode>(
    {
        convexId: String,
        seriesId: { type: String, required: true, index: true },
        seasonNumber: { type: Number, required: true },
        episodeNumber: { type: Number, required: true },
        title: { type: String, required: true },
        titleSomali: String,
        overview: String,
        stillUrl: String,
        airDate: String,
        runtime: Number,
        embeds: [{ label: String, url: String, type: String, isProtected: Boolean }],
        isPublished: { type: Boolean, default: true },
        createdAt: { type: Number, required: true },
    },
    { timestamps: false }
);

EpisodeSchema.index({ seriesId: 1, seasonNumber: 1 });

export const Episode = mongoose.models.Episode || mongoose.model<IEpisode>("Episode", EpisodeSchema, "episodes");
